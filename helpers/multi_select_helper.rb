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
module MultiSelectHelper
  def multi_select(name:, title:, options:, selected: [], placeholder: "Anyone", form: nil)
    selected = Array(selected).map(&:to_s)

    tag.div(class: "multi-select",
            data: { controller: "multi-select", "multi-select-placeholder-value": placeholder }) do
      multi_select_trigger(title, placeholder, form) + multi_select_panel(name, title, options, selected, form)
    end
  end

  private

  def multi_select_trigger(title, placeholder, form)
    form.text_field(:multi_select, readonly: true, label: title, name: nil, value: placeholder, class: "multi-select__trigger", data: { action: "click->multi-select#toggle", "multi-select-target": "summary" })
  end

  def multi_select_panel(name, title, options, selected, form)
    tag.div(class: "multi-select__panel", hidden: true, data: { "multi-select-target": "panel" }) do
      search = tag.input(
        type: "text",
        class: "multi-select__search",
        placeholder: "Search #{title.downcase}…",
        data: { "multi-select-target": "search", action: "input->multi-select#filter" }
      )

      list = tag.div(class: "multi-select__options") do
        safe_join(options.map { |option| multi_select_option(name, option, selected, form) })
      end

      search + list
    end
  end

  def multi_select_option(name, option, selected, form)
    value = option[:value].to_s
    label = option[:label]

    tag.label(class: "multi-select__option", data: { "multi-select-target": "option", label: label }) do
      checkbox = form.check_box("#{name}[]", { id: "#{name}-#{value}", checked: selected.include?(value), data: { action: "multi-select#onToggle" } }, value, nil)
      avatar = if option[:image].present?
        tag.img(src: option[:image], class: "multi-select__avatar", loading: "lazy", alt: "")
      else
        "".html_safe
      end
      checkbox + avatar + tag.span(label)
    end
  end
end
