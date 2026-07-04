import { Controller } from "@hotwired/stimulus"

// GitHub-flavored-markdown editor over a plain <textarea>.
//
// Toolbar buttons carry their formatting as data-* attributes (data-md-prefix /
// data-md-suffix for inline wraps like **bold**, data-md-line-prefix for line
// constructs like "> " or "- ", data-md-alert for GFM alert callouts, and
// data-md-table for a table skeleton), so the markup decides *what* the buttons
// do and this controller only decides *how* to apply it to the selection.
//
// Beyond formatting it adds editing conveniences, all client-side:
//   - list continuation: Enter inside a list item starts the next item, and a
//     second Enter on an empty item ends the list;
//   - a suggestions popup that surfaces (a) emoji when you type ":tag" and
//     (b) a "Did you mean …?" fix when the word you're typing is a known typo.
//     Both are applied with click / Enter / Tab; nothing is changed silently.
export default class extends Controller {
  static targets = ["input", "suggestions", "write", "preview", "writeTab", "previewTab"]

  // Alert callout icons for the live preview (mirror the toolbar SVGs).
  alertIcons = {
    NOTE:      '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M8 7.3v3.4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="8" cy="5" r="0.9" fill="currentColor"/></svg>',
    TIP:       '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2.5a4 4 0 0 1 2.6 7.05c-.4.35-.6.85-.6 1.35v.6H6v-.6c0-.5-.2-1-.6-1.35A4 4 0 0 1 8 2.5Z"/><path d="M6.5 13.5h3"/></svg>',
    IMPORTANT: '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"><path d="M8 2 9.8 5.7 14 6.3l-3 2.9.7 4.1L8 11.4 4.3 13.3 5 9.2 2 6.3l4.2-.6z"/></svg>',
    WARNING:   '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M8 2.5 14.5 13.5H1.5z" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><path d="M8 6.5v3.3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><circle cx="8" cy="11.5" r="0.8" fill="currentColor"/></svg>',
    CAUTION:   '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M5.3 2.5h5.4l3.3 3.3v5.4l-3.3 3.3H5.3L2 11.2V5.8z" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><path d="M8 5v3.8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><circle cx="8" cy="11.2" r="0.8" fill="currentColor"/></svg>'
  }

  // Shortcodes offered by the ":tag" autocomplete. A starter set — extend at will.
  emoji = {
    smile: "😄", grin: "😁", tada: "🎉", rocket: "🚀", fire: "🔥", bug: "🐛",
    eyes: "👀", thumbsup: "👍", heart: "❤️", warning: "⚠️", sparkles: "✨",
    check: "✅", x: "❌", thinking: "🤔", clap: "👏", wave: "👋"
  }

  // Whole-word fixes offered as a suggestion when the typed word matches. Case
  // of the first letter is preserved so "Teh" → "The".
  corrections = {
    teh: "the", adn: "and", thier: "their", recieve: "receive", seperate: "separate",
    definately: "definitely", occured: "occurred", wich: "which", dont: "don't",
    cant: "can't", wont: "won't", ive: "I've", alot: "a lot", becuase: "because"
  }

  connect() {
    this.activeIndex = 0
  }

  // --- Write / Preview tabs ------------------------------------------------

  showWrite() {
    this.writeTarget.hidden = false
    this.previewTarget.hidden = true
    this.writeTabTarget.classList.add("is-active")
    this.previewTabTarget.classList.remove("is-active")
    this.inputTarget.focus()
  }

  showPreview() {
    this.previewTarget.innerHTML = this.renderMarkdown(this.inputTarget.value.trim() || "_Nothing to preview yet._")
    this.hideSuggestions()
    this.writeTarget.hidden = true
    this.previewTarget.hidden = false
    this.previewTabTarget.classList.add("is-active")
    this.writeTabTarget.classList.remove("is-active")
  }

  // --- Toolbar -------------------------------------------------------------

  format(event) {
    const data = event.currentTarget.dataset
    if (data.mdAlert !== undefined) {
      this.applyAlert(data.mdAlert)
    } else if (data.mdTable !== undefined) {
      this.applyTable()
    } else if (data.mdLinePrefix) {
      this.applyLinePrefix(data.mdLinePrefix)
    } else {
      this.applyWrap(data.mdPrefix || "", data.mdSuffix || "", data.mdPlaceholder || "")
    }
    this.closeMenus()
  }

  // Wrap the current selection (or a placeholder, if nothing is selected) and
  // leave the inner text selected so the user can type over the placeholder.
  applyWrap(prefix, suffix, placeholder) {
    const ta = this.inputTarget
    const { selectionStart: start, selectionEnd: end, value } = ta
    const selected = value.slice(start, end) || placeholder

    ta.value = value.slice(0, start) + prefix + selected + suffix + value.slice(end)
    const innerStart = start + prefix.length
    ta.focus()
    ta.setSelectionRange(innerStart, innerStart + selected.length)
  }

  // Prepend a marker to every line the selection touches. "1. " auto-numbers.
  applyLinePrefix(linePrefix) {
    const ta = this.inputTarget
    const { selectionStart: start, selectionEnd: end, value } = ta
    const lineStart = value.lastIndexOf("\n", start - 1) + 1
    const numbered = linePrefix === "1. "

    const updated = value
      .slice(lineStart, end)
      .split("\n")
      .map((line, i) => (numbered ? `${i + 1}. ` : linePrefix) + line)
      .join("\n")

    ta.value = value.slice(0, lineStart) + updated + value.slice(end)
    ta.focus()
    ta.setSelectionRange(lineStart, lineStart + updated.length)
  }

  // GFM alert callout: a blockquote whose first line is "[!KIND]".
  //   > [!NOTE]
  //   > selected text
  applyAlert(kind) {
    const ta = this.inputTarget
    const { selectionStart: start, selectionEnd: end, value } = ta
    const lineStart = value.lastIndexOf("\n", start - 1) + 1
    const body = (value.slice(lineStart, end) || "text").split("\n").map((line) => `> ${line}`).join("\n")
    const block = `> [!${kind}]\n${body}`

    ta.value = value.slice(0, lineStart) + block + value.slice(end)
    ta.focus()
    ta.setSelectionRange(lineStart, lineStart + block.length)
  }

  // A minimal GFM table skeleton inserted on its own lines.
  applyTable() {
    const ta = this.inputTarget
    const { selectionStart: caret, value } = ta
    const atLineStart = caret === 0 || value[caret - 1] === "\n"
    const table = `${atLineStart ? "" : "\n"}| Column | Column |\n| --- | --- |\n| Cell | Cell |\n`

    ta.value = value.slice(0, caret) + table + value.slice(caret)
    const pos = caret + table.length
    ta.focus()
    ta.setSelectionRange(pos, pos)
  }

  // --- Keyboard ------------------------------------------------------------

  keydown(event) {
    if (this.suggestionsVisible && ["ArrowDown", "ArrowUp", "Enter", "Tab", "Escape"].includes(event.key)) {
      this.handleSuggestionKey(event)
      return
    }
    if (event.key === "Enter") this.continueList(event)
  }

  // Enter inside "- ", "* ", "1. " etc. continues the list; on an empty item it
  // removes the marker and breaks out of the list instead.
  continueList(event) {
    const ta = this.inputTarget
    const { selectionStart: caret, value } = ta
    const lineStart = value.lastIndexOf("\n", caret - 1) + 1
    const match = value.slice(lineStart, caret).match(/^(\s*)([-*+]|\d+\.)\s+(.*)$/)
    if (!match) return

    event.preventDefault()
    const [, indent, marker, content] = match

    if (content === "") {
      ta.value = value.slice(0, lineStart) + value.slice(caret)
      ta.setSelectionRange(lineStart, lineStart)
      return
    }

    const next = /^\d+\.$/.test(marker) ? `${parseInt(marker, 10) + 1}.` : marker
    const insert = `\n${indent}${next} `
    ta.value = value.slice(0, caret) + insert + value.slice(caret)
    const pos = caret + insert.length
    ta.setSelectionRange(pos, pos)
  }

  // --- Suggestions popup (emoji + spelling) --------------------------------

  oninput() {
    this.updateSuggestions()
  }

  updateSuggestions() {
    const ta = this.inputTarget
    const caret = ta.selectionStart
    const upto = ta.value.slice(0, caret)

    // ":tag" emoji autocomplete takes priority over spelling.
    const emojiToken = upto.match(/:([a-z0-9_+-]{2,})$/i)
    if (emojiToken) {
      const query = emojiToken[1].toLowerCase()
      const start = caret - emojiToken[0].length
      const items = Object.keys(this.emoji)
        .filter((key) => key.includes(query))
        .slice(0, 6)
        .map((key) => ({ html: `${this.emoji[key]}<span>:${key}:</span>`, start, end: caret, insert: `${this.emoji[key]} ` }))
      return items.length ? this.renderSuggestions(items) : this.hideSuggestions()
    }

    // Spelling: the word currently being typed, if it's a known typo.
    const wordToken = upto.match(/([A-Za-z']+)$/)
    if (wordToken) {
      const fix = this.corrections[wordToken[1].toLowerCase()]
      if (fix) {
        const cased = this.matchCase(wordToken[1], fix)
        const start = caret - wordToken[1].length
        return this.renderSuggestions([{
          html: `<span class="markdown-editor__suggestion-hint">Did you mean</span> <strong>${cased}</strong>?`,
          start, end: caret, insert: cased
        }])
      }
    }

    this.hideSuggestions()
  }

  // Each suggestion knows the [start, end) range it replaces and the text to
  // insert, so applying one is uniform regardless of its kind.
  renderSuggestions(items) {
    this.activeIndex = 0
    this.suggestionsTarget.innerHTML = items
      .map((item, i) => `<button type="button" tabindex="-1" class="markdown-editor__suggestion${i === 0 ? " is-active" : ""}" data-action="click->markdown-editor#applySuggestion" data-start="${item.start}" data-end="${item.end}" data-insert="${this.escape(item.insert)}">${item.html}</button>`)
      .join("")
    this.suggestionsTarget.hidden = false
  }

  handleSuggestionKey(event) {
    const items = this.suggestionItems

    if (event.key === "Escape") return this.hideSuggestions()

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault()
      const dir = event.key === "ArrowDown" ? 1 : -1
      this.activeIndex = (this.activeIndex + dir + items.length) % items.length
      items.forEach((el, i) => el.classList.toggle("is-active", i === this.activeIndex))
      return
    }

    // Enter or Tab commits the highlighted suggestion.
    event.preventDefault()
    this.applyFromButton(items[this.activeIndex])
  }

  applySuggestion(event) {
    this.applyFromButton(event.currentTarget)
  }

  applyFromButton(button) {
    if (!button) return this.hideSuggestions()
    const ta = this.inputTarget
    const start = Number(button.dataset.start)
    const end = Number(button.dataset.end)
    const insert = button.dataset.insert

    ta.value = ta.value.slice(0, start) + insert + ta.value.slice(end)
    const pos = start + insert.length
    ta.focus()
    ta.setSelectionRange(pos, pos)
    this.hideSuggestions()
  }

  hideSuggestions() {
    this.suggestionsTarget.hidden = true
    this.suggestionsTarget.innerHTML = ""
  }

  // --- Live preview render (GFM subset) ------------------------------------
  //
  // A lightweight client-side renderer covering the constructs the toolbar can
  // produce — headings, blockquotes, alerts, lists, task lists, tables, fenced
  // code and inline marks. It is intentionally a preview, not a full CommonMark
  // engine; the server renders the canonical HTML on submit.
  renderMarkdown(source) {
    const lines = source.split("\n")
    let html = ""
    let i = 0

    while (i < lines.length) {
      const line = lines[i]

      if (/^```/.test(line)) {
        const buf = []
        i++
        while (i < lines.length && !/^```/.test(lines[i])) { buf.push(this.escape(lines[i])); i++ }
        i++
        html += `<pre><code>${buf.join("\n")}</code></pre>`
        continue
      }

      const heading = line.match(/^(#{1,3})\s+(.*)$/)
      if (heading) {
        const n = heading[1].length
        html += `<h${n}>${this.renderInline(heading[2])}</h${n}>`
        i++
        continue
      }

      if (/^>/.test(line)) {
        const buf = []
        while (i < lines.length && /^>/.test(lines[i])) { buf.push(lines[i].replace(/^>\s?/, "")); i++ }
        const alert = buf[0] && buf[0].match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*$/i)
        if (alert) {
          const kind = alert[1].toUpperCase()
          const title = kind[0] + kind.slice(1).toLowerCase()
          const body = buf.slice(1).filter((l) => l.trim() !== "").map((l) => `<p>${this.renderInline(l)}</p>`).join("")
          html += `<div class="markdown-alert ${kind.toLowerCase()}"><p class="markdown-alert-title">${this.alertIcons[kind]}${title}</p>${body}</div>`
        } else {
          html += `<blockquote>${buf.map((l) => this.renderInline(l)).join("<br>")}</blockquote>`
        }
        continue
      }

      if (/^\s*[-*+]\s+/.test(line)) {
        const buf = []
        let task = false
        while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
          const item = lines[i].replace(/^\s*[-*+]\s+/, "")
          const checkbox = item.match(/^\[([ xX])\]\s+(.*)$/)
          if (checkbox) {
            task = true
            const checked = checkbox[1].toLowerCase() === "x" ? " checked" : ""
            buf.push(`<li class="task-list-item"><input type="checkbox" disabled${checked}>${this.renderInline(checkbox[2])}</li>`)
          } else {
            buf.push(`<li>${this.renderInline(item)}</li>`)
          }
          i++
        }
        html += `<ul${task ? ' class="contains-task-list"' : ""}>${buf.join("")}</ul>`
        continue
      }

      if (/^\s*\d+\.\s+/.test(line)) {
        const buf = []
        while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) { buf.push(`<li>${this.renderInline(lines[i].replace(/^\s*\d+\.\s+/, ""))}</li>`); i++ }
        html += `<ol>${buf.join("")}</ol>`
        continue
      }

      if (/^\s*\|.*\|\s*$/.test(line) && i + 1 < lines.length && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
        const cells = (row) => row.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim())
        const head = cells(line)
        i += 2
        let body = ""
        while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) {
          body += `<tr>${cells(lines[i]).map((c) => `<td>${this.renderInline(c)}</td>`).join("")}</tr>`
          i++
        }
        html += `<table><thead><tr>${head.map((c) => `<th>${this.renderInline(c)}</th>`).join("")}</tr></thead><tbody>${body}</tbody></table>`
        continue
      }

      if (line.trim() === "") { i++; continue }

      const buf = []
      while (i < lines.length && lines[i].trim() !== "" && !/^(#{1,3}\s|>|```|\s*[-*+]\s|\s*\d+\.\s|\s*\|)/.test(lines[i])) {
        buf.push(this.renderInline(lines[i]))
        i++
      }
      html += `<p>${buf.join("<br>")}</p>`
    }

    return html
  }

  renderInline(text) {
    return this.escape(text)
      .replace(/&lt;ins&gt;([\s\S]*?)&lt;\/ins&gt;/g, "<u>$1</u>")
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/~~([^~]+)~~/g, "<del>$1</del>")
      .replace(/(^|[^_])_([^_]+)_/g, "$1<em>$2</em>")
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
  }

  // --- Helpers -------------------------------------------------------------

  matchCase(source, replacement) {
    return source[0] === source[0].toUpperCase()
      ? replacement[0].toUpperCase() + replacement.slice(1)
      : replacement
  }

  escape(value) {
    return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  }

  closeMenus() {
    this.element.querySelectorAll("details[open]").forEach((details) => { details.open = false })
  }

  get suggestionsVisible() {
    return !this.suggestionsTarget.hidden
  }

  get suggestionItems() {
    return Array.from(this.suggestionsTarget.children)
  }
}
