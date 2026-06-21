# Searchable multi-select dropdown, shared across apps. The caller passes the
# option data; this renders the trigger + searchable panel and wires the
# `multi-select` Stimulus controller (assets/js/controllers). Place it inside a
# form — checking several options OR-combines them server side via `name[]`.
#
# Usage:
#   <%= multi_select(
#         name: "author",
#         title: "Author",
#         options: @authors.map { |u| { value: u.id, label: u.display_label, image: u.avatar_url } },
#         selected: Array(params[:author]),
#         placeholder: "Anyone") %>
#
# Each option is a hash: { value:, label:, image: (optional avatar url) }.
module SearchSelectHelper
  def multi_select(name:, title:, options:, selected: [], placeholder: "Anyone", form: nil)
    selected = Array(selected).map(&:to_s)

    tag.div(class: "search-select", data: { controller: "search-select", "search-select-placeholder-value": placeholder }) do
      multi_select_trigger(title, placeholder, form) + multi_select_panel(name, title, options, selected, form)
    end
  end

  private

  def multi_select_trigger(title, placeholder, form)
    form.text_field(:multi_select, readonly: true, label: title, name: nil, value: placeholder, data: { action: "click->search-select#toggle", "search-select-target": "summary" })
  end

  def multi_select_panel(name, title, options, selected, form)
    tag.div(class: "option-wrapper", hidden: true, data: { "search-select-target": "panel" }) do
      search = form.text_field(:multi_select,
        label: "Search #{title.downcase}…",
        data: { "search-select-target": "search", action: "input->search-select#filter" }
      )

      list = tag.div(class: "search-select__options") do
        safe_join(options.map { |option| multi_select_option(name, option, selected, form) })
      end

      search + list
    end
  end

  def multi_select_option(name, option, selected, form)
    value = option[:value].to_s
    label = option[:label]

    tag.label(class: "option", data: { "search-select-target": "option", label: label }) do
      checkbox = form.check_box("#{name}[]", { id: "#{name}-#{value}", checked: selected.include?(value), data: { action: "search-select#onToggle" } }, value, nil)
      avatar = if option[:image].present?
        tag.img(src: option[:image], class: "search-select__avatar", loading: "lazy", alt: "")
      else
        "".html_safe
      end
      checkbox + avatar + tag.span(label)
    end
  end
end
