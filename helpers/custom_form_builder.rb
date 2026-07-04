class CustomFormBuilder < ActionView::Helpers::FormBuilder
  # The always-visible toolbar, split into visual groups (separators between).
  # Each entry is a wrap (prefix/suffix around the selection) or a line prefix
  # (prepended to every selected line); the `markdown-editor` Stimulus
  # controller reads the data-* attributes and applies them.
  MARKDOWN_TOOL_GROUPS = [
    [
      { icon: :bold,      label: "Bold",          prefix: "**",    suffix: "**",      placeholder: "bold text" },
      { icon: :italic,    label: "Italic",        prefix: "_",     suffix: "_",       placeholder: "italic text" },
      { icon: :strike,    label: "Strikethrough", prefix: "~~",    suffix: "~~",      placeholder: "struck text" },
      { icon: :underline, label: "Underline",     prefix: "<ins>", suffix: "</ins>",  placeholder: "underlined text" }
    ],
    [
      { icon: :heading,   label: "Heading",   line_prefix: "### " },
      { icon: :quote,     label: "Quote",     line_prefix: "> " },
      { icon: :code,      label: "Inline code", prefix: "`", suffix: "`", placeholder: "code" },
      { icon: :link,      label: "Link",      prefix: "[", suffix: "](url)", placeholder: "text" }
    ],
    [
      { icon: :ul,        label: "Bulleted list", line_prefix: "- " },
      { icon: :ol,        label: "Numbered list", line_prefix: "1. " },
      { icon: :task,      label: "Task list",     line_prefix: "- [ ] " }
    ]
  ].freeze

  # Block-level inserts behind the "Insert" dropdown (icon + label), including
  # the two GFM constructs that don't fit a single toolbar button: fenced code,
  # tables, and the five GitHub "alert" callouts (Note/Tip/Important/…).
  MARKDOWN_INSERTS = [
    { icon: :codeblock, label: "Code block", prefix: "```\n", suffix: "\n```", placeholder: "code" },
    { icon: :table,     label: "Table",      table: true },
    { icon: :note,      label: "Note",       alert: "NOTE" },
    { icon: :tip,       label: "Tip",        alert: "TIP" },
    { icon: :important, label: "Important",  alert: "IMPORTANT" },
    { icon: :warning,   label: "Warning",    alert: "WARNING" },
    { icon: :caution,   label: "Caution",    alert: "CAUTION" }
  ].freeze

  def text_field(method, options = {})
    wrap_with_label(method, options) { super(method, extract_input_options(options, default_placeholder: " ")) }
  end

  # Multiline input. Pass `markdown: true` to render the GitHub-flavored
  # markdown editor (toolbar + autocomplete) instead of a bare textarea.
  def text_area(method, options = {})
    if options.delete(:markdown)
      options[:wrapper_class] ||= "markdown-field"
      wrap_with_label(method, options) { build_markdown_editor(method, options) }
    else
      wrap_with_label(method, options) { super(method, extract_input_options(options, default_placeholder: " ")) }
    end
  end

  def email_field(method, options = {})
    wrap_with_label(method, options) { super(method, extract_input_options(options, default_placeholder: " ")) }
  end

  def password_field(method, options = {})
    wrap_with_label(method, options) { super(method, extract_input_options(options, default_placeholder: " ")) }
  end

  def select(method, choices = nil, options = {}, html_options = {}, &block)
    merged_options = options.merge(html_options)
    wrap_with_label(method, merged_options) do
        super(method, choices, options, extract_input_options(merged_options), &block)
    end
  end

  def submit(text = nil, **options)
    text ||= options.delete(:text)
    @template.button(variant: :primary, type: :submit, text: text, **options)
  end

  def wrap_with_label(method, options)
    normalized = normalize_options(options, method)

    content = @template.safe_join([
      (build_label(method, normalized[:label]) if normalized[:label].present?),
      yield,
      (build_helper_text(normalized[:helper_text]) if normalized[:helper_text].present?)
    ].compact)

    @template.content_tag(:div, content, class: normalized[:wrapper_class], data: {error: @object.try(:errors)&.key?(method)})
  end

  def create_human_attribute_name(attribute)
    @object.try(:class)&.try(:human_attribute_name, attribute)
  end

  def normalize_options(options, method)
    {}.deep_merge(options).tap do |result|
      result[:helper_text] = {text: result[:helper_text]} if result[:helper_text].is_a?(String)

      unless options[:label] == false
        # convert string label to hash
        result[:label] = {title: result[:label]} if result[:label].is_a?(String)

        # ensure label is always a hash with title
        result[:label] ||= {}
        result[:label][:title] ||= create_human_attribute_name(method)
      end

      result[:wrapper_class] ||= "input-wrapper"
    end
  end

  def build_label(method, label_config)
    label_text = label_config.delete(:title)
    @template.label(@object_name, method, label_text, label_config)
  end

  def build_helper_text(helper_text_config)
    text = helper_text_config.delete(:text)
    helper_text_config[:class] = [helper_text_config[:class], "helper-text"]
    @template.content_tag(:p, text, helper_text_config)
  end

  def extract_input_options(options, default_placeholder: nil)
    options = options.dup

    if options[:placeholder] != false
      options[:placeholder] ||= default_placeholder if default_placeholder
    else
      options.delete(:placeholder)
    end

    # Remove label, helper_text, wrapper options, and flatpickr options, keep everything else for the input
    options.except(:label, :helper_text, :wrapper_class)
  end

  # The markdown editor: Write/Preview tabs over a toolbar + textarea (wired to
  # the `markdown-editor` Stimulus controller) and an (initially hidden)
  # suggestions popup for emoji/typo autocomplete. Switching to Preview renders
  # the markdown live, client-side. The controller also handles formatting, list
  # continuation, autocomplete and inline typo suggestions.
  def build_markdown_editor(method, options)
    input_options = extract_input_options(options)
    input_options[:class] = [input_options[:class], "markdown-editor__textarea"].compact
    input_options[:rows] ||= 6
    input_options[:spellcheck] = "true"
    input_options[:data] = (input_options[:data] || {}).merge(
      "markdown-editor-target": "input",
      action: "keydown->markdown-editor#keydown input->markdown-editor#oninput"
    )

    textarea = @template.text_area(@object_name, method, input_options)
    suggestions = @template.content_tag(:div, "", class: "markdown-editor__suggestions", hidden: true,
      data: { "markdown-editor-target": "suggestions" })

    write_pane = @template.content_tag(:div,
      @template.safe_join([build_markdown_toolbar, textarea, suggestions]),
      class: "markdown-editor__write", data: { "markdown-editor-target": "write" })

    @template.content_tag(:div, @template.safe_join([write_pane]),
      class: "markdown-editor", data: { controller: "markdown-editor" })
  end

  def build_markdown_toolbar
    groups = MARKDOWN_TOOL_GROUPS.map do |group|
      @template.content_tag(:div, @template.safe_join(group.map { |tool| markdown_tool_button(tool) }),
        class: "markdown-editor__group")
    end

    insert = @template.content_tag(:details, class: "markdown-editor__insert") do
      summary = @template.content_tag(:summary, class: "markdown-editor__tool markdown-editor__tool--menu") do
        @template.safe_join([ @template.tag.span("Insert"), @template.tag.span("▾", class: "markdown-editor__caret")])
      end
      menu = @template.content_tag(:div, class: "markdown-editor__menu") do
        @template.safe_join(MARKDOWN_INSERTS.map { |tool| markdown_tool_button(tool, labelled: true) })
      end
      summary + menu
    end

    @template.content_tag(:div, @template.safe_join(groups + [insert]), class: "markdown-editor__toolbar")
  end

  def markdown_tool_button(tool, labelled: false)
    # tabindex: -1 keeps the toolbar out of the tab order so Tab moves between
    # form fields, not toolbar buttons. type: button so it never submits.
    data = { action: "click->markdown-editor#format" }
    data[:md_prefix] = tool[:prefix] if tool[:prefix]
    data[:md_suffix] = tool[:suffix] if tool[:suffix]
    data[:md_placeholder] = tool[:placeholder] if tool[:placeholder]
    data[:md_line_prefix] = tool[:line_prefix] if tool[:line_prefix]
    data[:md_alert] = tool[:alert] if tool[:alert]
    data[:md_table] = "" if tool[:table]

    content = @template.tag.span(tool[:label]) if tool[:label]

    classes = ["markdown-editor__tool", ("markdown-editor__tool--labelled" if labelled)].compact
    @template.tag.button(content, type: "button", class: classes, title: tool[:title] || tool[:label],
      "aria-label": tool[:title] || tool[:label], tabindex: -1, data: data)
  end
end
