# button helpers, used by every app that adds this directory to its
# helper paths. Edit here once -> all apps pick it up on next restart.
#
# Usage:
#   <%= button do %> Save <% end %>
#   <%= button(variant: :secondary, type: :button, class: "w-full") { "Cancel" } %>
module ButtonHelper
  def button(variant: :primary, type: :submit, text: "'", **attrs, &block)
    extra = attrs.delete(:class)
    classes = ["button", "button-#{variant}", extra].compact.join(" ")

    content = block_given? ? capture(&block).strip : text.strip

    tag.button(content, type: type, class: classes, **attrs)
  end
end
