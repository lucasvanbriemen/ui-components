# Shared UI helpers, used by every app that adds this directory to its
# helper paths. Edit here once -> all apps pick it up on next restart.
#
# Usage:
#   <%= button do %> Save <% end %>
#   <%= button(variant: :secondary, type: :button, class: "w-full") { "Cancel" } %>
module UiHelper
  def button(variant: :primary, type: :submit, **attrs, &block)
    extra   = attrs.delete(:class)
    classes = ["btn", "btn--#{variant}", extra].compact.join(" ")
    tag.button(capture(&block), type: type, class: classes, **attrs)
  end
end
