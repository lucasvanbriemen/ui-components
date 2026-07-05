# Searchable select dropdown, shared across apps. The caller passes the
# option data; this renders the trigger + searchable panel and wires the
# `search-select` Stimulus controller (assets/js/controllers). Place it inside a
# form — checking several options OR-combines them server side via `name[]`.
#
# Usage:
#   <%= search_select(
#         name: "author",
#         title: "Author",
#         options: @authors.map { |u| { value: u.id, label: u.display_label, image: u.avatar_url } },
#         selected: Array(params[:author]),
#         placeholder: "Anyone") %>
#
# Each option is a hash: { value:, label:, image: (optional avatar url) }.
#
# Options beyond the original multi-select behavior (all opt-in):
#   multiple: false   -> radio buttons under a single `name`, picking one closes
#                        the panel. Pass include_blank: "None" for a clear option.
#   auto_submit: true -> submits the enclosing form when the panel closes and
#                        the selection changed (for pickers that save on close).
module SearchSelectHelper
  def search_select(name:, title:, options:, selected: [], placeholder: "Anyone", form: nil, multiple: true, auto_submit: false, include_blank: nil)
    selected = Array(selected).map(&:to_s)

    data = {
      controller: "search-select",
      "search-select-placeholder-value": placeholder,
      "search-select-multiple-value": multiple,
      "search-select-auto-submit-value": auto_submit
    }

    tag.div(class: "search-select", data: data) do
      search_select_trigger(title, placeholder, form) +
        search_select_panel(name, title, options, selected, form, multiple, include_blank)
    end
  end

  private

  def search_select_trigger(title, placeholder, form)
    form.text_field(:search_select, readonly: true, label: title, name: nil, value: placeholder, data: { action: "click->search-select#toggle", "search-select-target": "summary" })
  end

  def search_select_panel(name, title, options, selected, form, multiple, include_blank)
    options = [ { value: "", label: include_blank } ] + options if include_blank

    tag.div(class: "option-wrapper", hidden: true, data: { "search-select-target": "panel" }) do
      search = form.text_field(:search_select,
        label: "Search #{title.downcase}…",
        data: { "search-select-target": "search", action: "input->search-select#filter" }
      )

      list = tag.div(class: "search-select__options") do
        safe_join(options.map { |option| search_select_option(name, option, selected, form, multiple) })
      end

      search + list
    end
  end

  def search_select_option(name, option, selected, form, multiple)
    value = option[:value].to_s
    label = option[:label]

    tag.label(class: "option", data: { "search-select-target": "option", label: label }) do
      input = if multiple
        form.check_box("#{name}[]", { id: "#{name}-#{value}", checked: selected.include?(value), data: { action: "search-select#onToggle" } }, value, nil)
      else
        form.radio_button(name, value, checked: selected.include?(value), id: "#{name}-#{value}", data: { action: "search-select#onToggle" })
      end

      avatar = if option[:image].present?
        tag.img(src: option[:image], class: "avatar", loading: "lazy", alt: "")
      else
        "".html_safe
      end

      input + avatar + tag.span(label)
    end
  end
end
