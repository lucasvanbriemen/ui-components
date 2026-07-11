# button helpers, used by every app that adds this directory to its
# helper paths. Edit here once -> all apps pick it up on next restart.
#
# Usage:
#   <%= button do %> Save <% end %>
#   <%= button(variant: :secondary, type: :button, class: "w-full") { "Cancel" } %>
module ButtonHelper
  VALID_VARIANTS = [:primary, :text, :outline]

  def button(variant: :primary, type: :submit, text: "'", href: "", active: false, **attrs, &block)
    raise ArgumentError, "Invalid button variant: #{variant}" unless VALID_VARIANTS.include?(variant)

    extra = attrs.delete(:class)
    classes = ["button", "button-#{variant}", ("active" if active), extra].compact.join(" ")

    # Wire the ripple Stimulus controller, merging with any caller-supplied
    # data attributes (and not clobbering a custom controller list).
    data = attrs.delete(:data) || {}
    data[:controller] = ["button", data[:controller]].compact.join(" ")

    content = block_given? ? capture(&block).strip : text.strip

    if href.present?
      return link_to(content, href, class: classes, data: data, **attrs)
    end

    tag.button(content, type: type, class: classes, data: data, **attrs)
  end
end
