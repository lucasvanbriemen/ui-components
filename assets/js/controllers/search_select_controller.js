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
    this.updateSummary()
  }

  disconnect() {
    document.removeEventListener("click", this.onDocumentClick)
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
