import { Controller } from "@hotwired/stimulus"

// Shared "alert on page load" controller, used by every app that wires the
// shared-ui controllers into its importmap (see each app's config/importmap.rb).
//
// Usage in a view:
//   <div data-controller="page-alert" data-page-alert-message-value="Welcome!"></div>
//
// With no message value it falls back to a default. Edit here once -> all apps
// pick it up on next restart (production caches assets + eager-loads).
export default class extends Controller {
  static values = { message: { type: String, default: "Page loaded" } }

  connect() {
    window.alert(this.messageValue)
  }
}
