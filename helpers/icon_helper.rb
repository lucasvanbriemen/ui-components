module IconHelper
  def icon(name, **attrs)
    logical_path = "images/#{name}.svg"
    asset = Rails.application.assets.load_path.find(logical_path)
    raise Propshaft::MissingAssetError, "The asset '#{logical_path}' was not found in the load path." unless asset

    attrs = attrs.map { |key, value| %(#{key}="#{value}") }

    svg = asset.content.sub(/<svg\b/, [ "<svg", *attrs ].join(" "))
    svg.html_safe
  end
end
