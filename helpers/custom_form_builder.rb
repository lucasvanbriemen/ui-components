class CustomFormBuilder < ActionView::Helpers::FormBuilder
  def submit(text: "Submit", **options)
    @template.button(text: text, type: "submit", **options)
  end
end
