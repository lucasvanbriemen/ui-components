# button helpers, used by every app that adds this directory to its
# helper paths. Edit here once -> all apps pick it up on next restart.
#
# Usage:
#   <%= button do %> Save <% end %>
#   <%= button(variant: :secondary, type: :button, class: "w-full") { "Cancel" } %>
module HeaderHelper
  # Read once at load time; the class attribute is injected per call below.
  # Inlined (not image_tag) so the SVG's `fill="var(--primary)"` resolves
  # against the host page — CSS variables can't cross an <img> boundary.
  LOGO_SVG = File.read(File.expand_path("../assets/images/logo.svg", __dir__)).freeze

  def header(title: "test", items: [])
    tag.header(class: "header") do
      raw(LOGO_SVG) + content_tag(:span, "", class: "divder") + link_to(title, root_path, class: "title") + content_tag(:span, "", class: "divder") +

        content_tag(:nav, class: "nav") do
          items.each do |item|
            concat button(text: item[:name], variant: :text, href: item[:href], active: item[:active], class: "nav-item")
          end
        end
    end
  end
end
