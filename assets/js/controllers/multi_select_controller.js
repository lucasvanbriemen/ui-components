import { Controller } from "@hotwired/stimulus"

// Searchable multi-select built over a plain list of checkboxes.
//
// A trigger button opens a panel containing a search box and the options.
// Typing filters the visible options; checking several boxes OR-combines them
// server side (name="author[]"). The enclosing form is submitted only when the
// panel closes *and* the selection changed, so picking two people is a single
// navigation rather than one per click.
//
// The panel starts hidden in markup; the controller only toggles it.
export default class extends Controller {
  static targets = ["panel", "search", "summary", "option"]
  static values = { placeholder: String }

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
    if (this.selectedValues().join(",") !== this.selectionOnOpen) {
      this.element.closest("form").requestSubmit()
    }
  }

  // Show only options whose label contains the query.
  filter() {
    const query = this.searchTarget.value.trim().toLowerCase()
    this.optionTargets.forEach((option) => {
      option.hidden = query !== "" && !option.dataset.label.includes(query)
    })
  }

  // Enter toggles the first visible option, so a user can type a name and hit
  // Enter to pick it without reaching for the mouse.
  keydown(event) {
    if (event.key !== "Enter") return
    event.preventDefault()
    const first = this.optionTargets.find((option) => !option.hidden)
    if (!first) return
    const checkbox = first.querySelector("input[type=checkbox]")
    checkbox.checked = !checkbox.checked
    this.updateSummary()
  }

  onToggle() {
    this.updateSummary()
  }

  checkboxes() {
    return this.optionTargets.map((option) => option.querySelector("input[type=checkbox]"))
  }

  selectedValues() {
    return this.checkboxes().filter((box) => box.checked).map((box) => box.value)
  }

  updateSummary() {
    const names = this.optionTargets
      .filter((option) => option.querySelector("input[type=checkbox]").checked)
      .map((option) => option.dataset.name)
    this.summaryTarget.value = names.length === 0 ? this.placeholderValue : names.join(", ")
    this.element.classList.toggle("multi-select--active", names.length > 0)
  }

  handleDocumentClick(event) {
    if (!this.element.contains(event.target)) this.close()
  }
}
