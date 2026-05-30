import { Controller } from "@hotwired/stimulus"

// Directional ripple hover effect for .button elements.
// Uses transform: scale() toggled via a CSS class instead of @property
// transitions, which cause layout thrashing in Safari.
//
// Attach with `data-controller="button"`; the controller manages its own
// mouseover/mouseout listeners on its element rather than delegating off
// document, so there is one ripple per button instance.
export default class extends Controller {
  connect() {
    this.onMouseover = this.ripple.bind(this);
    this.onMouseout = this.endRipple.bind(this);
    this.element.addEventListener("mouseover", this.onMouseover);
    this.element.addEventListener("mouseout", this.onMouseout);
  }

  disconnect() {
    this.element.removeEventListener("mouseover", this.onMouseover);
    this.element.removeEventListener("mouseout", this.onMouseout);
  }

  ripple(e) {
    const btn = this.element;
    if (btn.matches(":disabled, .disabled")) return;

    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    btn.style.setProperty("--ripple-x", `${(x / rect.width) * 100}%`);
    btn.style.setProperty("--ripple-y", `${(y / rect.height) * 100}%`);
    // Inputs can't use ::before, so they render the ripple via a radial-gradient
    // background sized by --ripple-radius (snaps on/off, no transition).
    if (btn.matches("input")) btn.style.setProperty("--ripple-radius", `${rect.width}px`);

    btn.classList.add("button--ripple");
  }

  endRipple(e) {
    const btn = this.element;
    // Ignore mouseout caused by moving between the button's own children.
    if (btn.contains(e.relatedTarget)) return;

    btn.classList.remove("button--ripple");
    if (btn.matches("input")) btn.style.setProperty("--ripple-radius", "0px");
  }
}
