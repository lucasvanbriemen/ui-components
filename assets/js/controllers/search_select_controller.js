import { Controller } from "@hotwired/stimulus"

// Searchable select built over a plain list of checkboxes (or radios when the
// helper is called with multiple: false).
//
// A trigger button opens a panel containing a search box and the options.
// Typing filters the visible options; checking several boxes OR-combines them
// server side (name="author[]"). Single-select mode closes the panel as soon
// as an option is picked.
//
// With auto-submit enabled, the enclosing form is submitted when the panel
// closes *and* the selection changed, so picking two people is a single
// navigation rather than one per click.
//
// The panel starts hidden in markup; the controller only toggles it.
export default class extends Controller {
  static targets = ["panel", "search", "summary", "option"]
  static values = {
    placeholder: String,
    multiple: { type: Boolean, default: true },
    autoSubmit: { type: Boolean, default: false },
  }

  connect() {
    this.onDocumentClick = this.handleDocumentClick.bind(this)
    document.addEventListener("click", this.onDocumentClick)
    this.onKeydown = this.handleKeydown.bind(this)
    this.element.addEventListener("keydown", this.onKeydown)
    this.updateSummary()
  }

  disconnect() {
    document.removeEventListener("click", this.onDocumentClick)
    this.element.removeEventListener("keydown", this.onKeydown)
  }

  // Keyboard support while the panel is open: arrows move the highlight,
  // Enter toggles the highlighted option, Escape closes (and auto-submits).
  handleKeydown(event) {
    if (this.panelTarget.hidden) return

    switch (event.key) {
      case "Escape":
        event.preventDefault()
        this.close()
        break
      case "ArrowDown":
        event.preventDefault()
        this.moveHighlight(1)
        break
      case "ArrowUp":
        event.preventDefault()
        this.moveHighlight(-1)
        break
      case "Enter":
        event.preventDefault()
        this.highlighted?.querySelector("input[type=checkbox], input[type=radio]")?.click()
        break
    }
  }

  visibleOptions() {
    return this.optionTargets.filter((option) => !option.hidden)
  }

  moveHighlight(delta) {
    const options = this.visibleOptions()
    if (options.length === 0) return

    const index = options.indexOf(this.highlighted)
    this.highlight(options[Math.min(Math.max(index + delta, 0), options.length - 1)])
  }

  highlight(option) {
    this.highlighted?.classList.remove("option--highlighted")
    this.highlighted = option
    if (option) {
      option.classList.add("option--highlighted")
      option.scrollIntoView({ block: "nearest" })
    }
  }

  toggle(event) {
    event.preventDefault()
    this.panelTarget.hidden ? this.open() : this.close()
  }

  open() {
    this.selectionOnOpen = this.selectedValues().join(",")
    this.panelTarget.hidden = false
    this.element.classList.add("multi-select--open")
    this.searchTarget.value = ""
    this.filter()
    this.searchTarget.focus()
  }

  close() {
    if (this.panelTarget.hidden) return
    this.panelTarget.hidden = true
    this.element.classList.remove("multi-select--open")

    if (
      this.autoSubmitValue &&
      this.selectionOnOpen !== undefined &&
      this.selectedValues().join(",") !== this.selectionOnOpen
    ) {
      this.element.closest("form")?.requestSubmit()
    }
  }

  // Show only options whose label contains the query.
  filter() {
    const query = this.searchTarget.value.trim().toLowerCase()
    this.optionTargets.forEach((option) => {
      option.hidden = query !== "" && !option.dataset.label.toLowerCase().includes(query)
    })

    // Keep the keyboard highlight on a visible option.
    if (!this.highlighted || this.highlighted.hidden) this.highlight(this.visibleOptions()[0])
  }

  onToggle() {
    this.updateSummary()
    if (!this.multipleValue) this.close()
  }

  inputs() {
    return this.optionTargets.map((option) => option.querySelector("input[type=checkbox], input[type=radio]"))
  }

  selectedValues() {
    return this.inputs().filter((input) => input.checked).map((input) => input.value)
  }

  updateSummary() {
    const labels = this.optionTargets
      .filter((option) => option.querySelector("input[type=checkbox], input[type=radio]").checked)
      .map((option) => option.dataset.label)
    this.summaryTarget.value = labels.length === 0 ? this.placeholderValue : labels.join(", ")
    this.element.classList.toggle("multi-select--active", labels.length > 0)
  }

  handleDocumentClick(event) {
    if (!this.element.contains(event.target)) this.close()
  }
}
