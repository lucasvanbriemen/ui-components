module TabsHelper
  def tabs(tabs:)
    content_tag(:div, class: "tabs") do
      content_tag(:nav) do
        tabs.each do |tab|
          content_tag(:div, class: "tab") do
            link_to(tab[:label], tab[:href], class: "tab #{'current disabled' if tab[:active]}")
          end
        end
      end
    end
  end
end
