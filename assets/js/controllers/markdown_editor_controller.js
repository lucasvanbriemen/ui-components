import { Controller } from "@hotwired/stimulus"
import emoji from "objects/emoji"

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
  static targets = ["input", "suggestions"]

  connect() {
    this.activeIndex = 0
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
      const items = Object.keys(emoji)
        .filter((key) => key.includes(query))
        .sort((a, b) => (b.startsWith(query) - a.startsWith(query)) || a.localeCompare(b))
        .slice(0, 6)
        .map((key) => ({ html: `${emoji[key]}<span>:${key}:</span>`, start, end: caret, insert: `${emoji[key]} ` }))
      return items.length ? this.renderSuggestions(items) : this.hideSuggestions()
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
