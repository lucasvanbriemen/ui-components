# button helpers, used by every app that adds this directory to its
# helper paths. Edit here once -> all apps pick it up on next restart.
#
# Usage:
#   <%= button do %> Save <% end %>
#   <%= button(variant: :secondary, type: :button, class: "w-full") { "Cancel" } %>
module HeaderHelper
  def header(title: "test", items: [])
    tag.header(class: "header") do
      image_tag("images/logo.svg", class: "logo") + content_tag(:span, "", class: "divder") + content_tag(:p, title, class: "title") + content_tag(:span, "", class: "divder") + 

        content_tag(:nav, class: "nav") do
          items.each do |item|
            concat button(text: item[:name], variant: :text, href: item[:href], class: "nav-item #{'active' if item[:active]}") #if item[:button]
          end
        end
    end
  end
end
