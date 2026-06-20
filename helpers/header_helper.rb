# button helpers, used by every app that adds this directory to its
# helper paths. Edit here once -> all apps pick it up on next restart.
#
# Usage:
#   <%= button do %> Save <% end %>
#   <%= button(variant: :secondary, type: :button, class: "w-full") { "Cancel" } %>
module HeaderHelper
  def header(title: "No mans land", items: [])
    tag.header(class: "header frosted-glass") do
      icon("logo") + content_tag(:span, "", class: "divder") + link_to(title, root_path, class: "title") + content_tag(:span, "", class: "divder") +

        content_tag(:nav, class: "nav") do
          items.each do |item|
            concat button(text: item[:name], variant: :text, href: item[:href], active: item[:active], class: "nav-item")
          end
        end
    end
  end
end
