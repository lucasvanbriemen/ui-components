import { Controller } from "@hotwired/stimulus"
import { DirectUpload } from "@rails/activestorage"

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
//   - image upload: the Image button, pasting, and dropping all send the file
//     to ActiveStorage as a direct upload (directUploadUrlValue) and insert the
//     resulting blob URL (blobUrlTemplateValue) as an image link.
export default class extends Controller {
  static targets = ["input", "fileInput"]
  static values = { directUploadUrl: String, blobUrlTemplate: String }

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


  // --- Image upload ----------------------------------------------------------

  pickImage() {
    this.fileInputTarget.click()
    this.closeMenus()
  }

  uploadSelected(event) {
    this.uploadImages(event.target.files)
    event.target.value = ""
  }

  paste(event) {
    const images = this.imageFiles(event.clipboardData)
    if (!images.length) return

    event.preventDefault()
    this.uploadImages(images)
  }

  // Without this the browser navigates to the dropped file instead of firing drop.
  dragover(event) {
    event.preventDefault()
  }

  drop(event) {
    const images = this.imageFiles(event.dataTransfer)
    if (!images.length) return

    event.preventDefault()
    this.uploadImages(images)
  }

  imageFiles(transfer) {
    return Array.from(transfer?.files || []).filter((file) => file.type.startsWith("image/"))
  }

  uploadImages(files) {
    Array.from(files).forEach((file) => this.uploadImage(file))
  }

  // Insert an "uploading" placeholder at the caret right away, then swap it for
  // the final ![name](url) once ActiveStorage returns the blob — the user can
  // keep typing while the upload runs.
  uploadImage(file) {
    const name = file.name.replace(/[[\]()]/g, "")
    const placeholder = `![Uploading ${name}…]()`
    this.insertAtCaret(placeholder)

    new DirectUpload(file, this.directUploadUrlValue).create((error, blob) => {
      if (error) {
        this.replaceOnce(placeholder, "")
        alert(`Uploading ${file.name} failed: ${error}`)
        return
      }

      const url = this.blobUrlTemplateValue
        .replace(":signed_id", blob.signed_id)
        .replace(":filename", encodeURIComponent(blob.filename))
      this.replaceOnce(placeholder, `![${name}](${url})`)
    })
  }

  insertAtCaret(text) {
    const ta = this.inputTarget
    const { selectionStart: start, selectionEnd: end, value } = ta

    ta.value = value.slice(0, start) + text + value.slice(end)
    const pos = start + text.length
    ta.focus()
    ta.setSelectionRange(pos, pos)
  }

  // Replace the first occurrence, keeping the user's caret in place even when
  // the swap happens behind it (uploads finish while they keep typing).
  replaceOnce(search, replacement) {
    const ta = this.inputTarget
    const index = ta.value.indexOf(search)
    if (index === -1) return

    const { selectionStart, selectionEnd } = ta
    ta.value = ta.value.slice(0, index) + replacement + ta.value.slice(index + search.length)
    const shift = (pos) => (pos <= index ? pos : Math.max(index, pos + replacement.length - search.length))
    ta.setSelectionRange(shift(selectionStart), shift(selectionEnd))
  }

  // The textarea's keydown entry point (wired by the form builder).
  keydown(event) {
    if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
      this.continueList(event)
    }
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
}
