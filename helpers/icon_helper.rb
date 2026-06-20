module IconHelper
  def icon(name, **attrs)
    asset = Rails.application.assets.load_path.find("#{name}.svg")
    raise Propshaft::MissingAssetError, "The asset '#{name}.svg' was not found in the load path." unless asset

    attrs = attrs.map { |key, value| %(#{key}="#{value}") }

    svg = asset.content.sub(/<svg\b/, [ "<svg", *attrs ].join(" "))
    svg.html_safe
  end
end
