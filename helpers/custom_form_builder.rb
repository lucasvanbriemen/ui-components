class CustomFormBuilder < ActionView::Helpers::FormBuilder
  def text_field(method, options = {})
    wrap_with_label(method, options) { super(method, extract_input_options(options, default_placeholder: " ")) }
  end

  def email_field(method, options = {})
    wrap_with_label(method, options) { super(method, extract_input_options(options, default_placeholder: " ")) }
  end

  def password_field(method, options = {})
    wrap_with_label(method, options) { super(method, extract_input_options(options, default_placeholder: " ")) }
  end

  def submit(value = nil, options = {})
    merged_options = options.merge(class: [options[:class], "wg-button wg-button-form"].compact)
    button(variant: :primary, type: :submit, text: value, **merged_options)
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
end
