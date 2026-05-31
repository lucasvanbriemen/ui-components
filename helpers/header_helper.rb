# button helpers, used by every app that adds this directory to its
# helper paths. Edit here once -> all apps pick it up on next restart.
#
# Usage:
#   <%= button do %> Save <% end %>
#   <%= button(variant: :secondary, type: :button, class: "w-full") { "Cancel" } %>
module HeaderHelper
  def header(title: "", items: [])
    tag.header(class: "header") do
      image_tag("images/logo.svg") + content_tag(:span, title, class: "title")
    end
  end
end
