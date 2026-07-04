class CustomFormBuilder < ActionView::Helpers::FormBuilder
  # Inline SVG icons for the toolbar (16×16, currentColor so they inherit the
  # button text colour). Kept inline rather than as asset files because they're
  # specific to this editor and small. Letter marks (B/I/S/U/H) are the standard
  # for text styles — Docs/Notion/GitHub all use them — drawn as crisp vectors.
  MARKDOWN_ICONS = {
    bold:      %(<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><text x="8" y="12" text-anchor="middle" font-family="Georgia, serif" font-size="13" font-weight="700" fill="currentColor">B</text></svg>),
    italic:    %(<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><text x="8" y="12" text-anchor="middle" font-family="Georgia, serif" font-size="13" font-style="italic" fill="currentColor">I</text></svg>),
    strike:    %(<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><text x="8" y="11.5" text-anchor="middle" font-family="Georgia, serif" font-size="12" fill="currentColor">S</text><line x1="2.5" y1="8" x2="13.5" y2="8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>),
    underline: %(<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><text x="8" y="11" text-anchor="middle" font-family="Georgia, serif" font-size="12" fill="currentColor">U</text><line x1="4" y1="13.5" x2="12" y2="13.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>),
    heading:   %(<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><text x="8" y="12" text-anchor="middle" font-family="Georgia, serif" font-size="13" font-weight="700" fill="currentColor">H</text></svg>),
    quote:     %(<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M3 3.5v9"/><path d="M6.5 5.5h6.5"/><path d="M6.5 8h6.5"/><path d="M6.5 10.5h4"/></svg>),
    code:      %(<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 5 3 8l3 3"/><path d="M10 5l3 3-3 3"/></svg>),
    link:      %(<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 9.5 9.5 6.5"/><path d="M8.5 4.5 10 3a2.5 2.5 0 0 1 3.5 3.5L12 8"/><path d="M7.5 11.5 6 13a2.5 2.5 0 0 1-3.5-3.5L4 8"/></svg>),
    ul:        %(<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><g fill="currentColor"><circle cx="3.4" cy="4" r="1.1"/><circle cx="3.4" cy="8" r="1.1"/><circle cx="3.4" cy="12" r="1.1"/></g><g stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M6.5 4h7"/><path d="M6.5 8h7"/><path d="M6.5 12h7"/></g></svg>),
    ol:        %(<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><g stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M6.5 4h7"/><path d="M6.5 8h7"/><path d="M6.5 12h7"/></g><g fill="currentColor" font-family="system-ui, sans-serif" font-size="5"><text x="1.4" y="5.6">1</text><text x="1.4" y="9.8">2</text><text x="1.4" y="14">3</text></g></svg>),
    task:      %(<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="5.5" height="5.5" rx="1.2"/><path d="M3.2 5.7 4.4 6.9 6.4 4.4"/><path d="M10 5.7h4"/><path d="M2.5 12h11.5"/></svg>),
    codeblock: %(<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-linejoin="round"><rect x="2" y="3" width="12" height="10" rx="1.5" stroke-width="1.3"/><g stroke-width="1.2" stroke-linecap="round"><path d="M6 6.5 4.5 8.2 6 9.9"/><path d="M10 6.5l1.5 1.7L10 9.9"/></g></svg>),
    table:     %(<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="2" y="3" width="12" height="10" rx="1.3"/><path d="M2 6.5h12"/><path d="M6.5 6.5V13"/><path d="M10.5 6.5V13"/></svg>),
    note:      %(<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M8 7.3v3.4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="8" cy="5" r="0.9" fill="currentColor"/></svg>),
    tip:       %(<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2.5a4 4 0 0 1 2.6 7.05c-.4.35-.6.85-.6 1.35v.6H6v-.6c0-.5-.2-1-.6-1.35A4 4 0 0 1 8 2.5Z"/><path d="M6.5 13.5h3"/></svg>),
    important: %(<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"><path d="M8 2 9.8 5.7 14 6.3l-3 2.9.7 4.1L8 11.4 4.3 13.3 5 9.2 2 6.3l4.2-.6z"/></svg>),
    warning:   %(<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M8 2.5 14.5 13.5H1.5z" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><path d="M8 6.5v3.3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><circle cx="8" cy="11.5" r="0.8" fill="currentColor"/></svg>),
    caution:   %(<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M5.3 2.5h5.4l3.3 3.3v5.4l-3.3 3.3H5.3L2 11.2V5.8z" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><path d="M8 5v3.8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><circle cx="8" cy="11.2" r="0.8" fill="currentColor"/></svg>)
  }.freeze

  # The always-visible toolbar, split into visual groups (separators between).
  # Each entry is a wrap (prefix/suffix around the selection) or a line prefix
  # (prepended to every selected line); the `markdown-editor` Stimulus
  # controller reads the data-* attributes and applies them.
  MARKDOWN_TOOL_GROUPS = [
    [
      { icon: :bold,      title: "Bold",          prefix: "**",    suffix: "**",      placeholder: "bold text" },
      { icon: :italic,    title: "Italic",        prefix: "_",     suffix: "_",       placeholder: "italic text" },
      { icon: :strike,    title: "Strikethrough", prefix: "~~",    suffix: "~~",      placeholder: "struck text" },
      { icon: :underline, title: "Underline",     prefix: "<ins>", suffix: "</ins>",  placeholder: "underlined text" }
    ],
    [
      { icon: :heading,   title: "Heading",   line_prefix: "### " },
      { icon: :quote,     title: "Quote",     line_prefix: "> " },
      { icon: :code,      title: "Inline code", prefix: "`", suffix: "`", placeholder: "code" },
      { icon: :link,      title: "Link",      prefix: "[", suffix: "](url)", placeholder: "text" }
    ],
    [
      { icon: :ul,        title: "Bulleted list", line_prefix: "- " },
      { icon: :ol,        title: "Numbered list", line_prefix: "1. " },
      { icon: :task,      title: "Task list",     line_prefix: "- [ ] " }
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

    @template.content_tag(:div, @template.safe_join([build_markdown_tabs, write_pane]),
      class: "markdown-editor", data: { controller: "markdown-editor" })
  end

  def build_markdown_tabs
    write = @template.tag.button("Write", type: "button", tabindex: -1,
      class: "markdown-editor__tab is-active", data: { "markdown-editor-target": "writeTab", action: "click->markdown-editor#showWrite" })

    @template.content_tag(:div, @template.safe_join([write]), class: "markdown-editor__tabs")
  end

  def build_markdown_toolbar
    groups = MARKDOWN_TOOL_GROUPS.map do |group|
      @template.content_tag(:div, @template.safe_join(group.map { |tool| markdown_tool_button(tool) }),
        class: "markdown-editor__group")
    end

    insert = @template.content_tag(:details, class: "markdown-editor__insert") do
      summary = @template.content_tag(:summary, class: "markdown-editor__tool markdown-editor__tool--menu") do
        @template.safe_join([markdown_icon(:note), @template.tag.span("Insert"), @template.tag.span("▾", class: "markdown-editor__caret")])
      end
      menu = @template.content_tag(:div, class: "markdown-editor__menu") do
        @template.safe_join(MARKDOWN_INSERTS.map { |tool| markdown_tool_button(tool, labelled: true) })
      end
      summary + menu
    end

    @template.content_tag(:div, @template.safe_join(groups + [insert]), class: "markdown-editor__toolbar")
  end

  def markdown_icon(name)
    MARKDOWN_ICONS.fetch(name).html_safe
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

    content = markdown_icon(tool[:icon])
    content += @template.tag.span(tool[:label]) if labelled && tool[:label]

    classes = ["markdown-editor__tool", ("markdown-editor__tool--labelled" if labelled)].compact
    @template.tag.button(content, type: "button", class: classes, title: tool[:title] || tool[:label],
      "aria-label": tool[:title] || tool[:label], tabindex: -1, data: data)
  end
end
