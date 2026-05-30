# shared-ui

Centralized helpers, partials, and assets shared by every Rails app on the box.
No gem, no `bundle install`. Each app just adds these folders to its lookup paths
and reads the files straight off disk.

```
shared-ui/
  helpers/   -> auto-included view helpers   (ui_helper.rb -> `button`, ...)
  views/     -> renderable partials          (ui/_card.html.erb -> render "ui/card")
  assets/    -> css/js                        (ui.css)
```

## Wiring an app to it

Add to the app's `config/application.rb` (inside the `Application` class):

```ruby
shared_ui = ENV.fetch("SHARED_UI_PATH") do
  [
    "/var/www/vhosts/ltvb.nl/shared-ui",          # server
    File.expand_path("../../shared-ui", __dir__)  # local checkout next to the app
  ].find { |path| Dir.exist?(path) }
end

if shared_ui && Dir.exist?(shared_ui)
  config.paths["app/views"]   << File.join(shared_ui, "views")
  config.paths["app/helpers"] << File.join(shared_ui, "helpers")
  config.assets.paths         << File.join(shared_ui, "assets")
end
```

To use the shared CSS, add to the app layout: `<%= stylesheet_link_tag "ui" %>`.

## Usage in views

```erb
<%= button do %>Save<% end %>
<%= button(variant: :secondary, type: :button, class: "w-full") { "Cancel" } %>
<%= render "ui/card", title: "Hello" do %> body <% end %>
```

## Server layout & propagating changes

Clone this repo once on the server at `/var/www/vhosts/ltvb.nl/shared-ui`.
Locally, keep it checked out next to your app repos (the config auto-discovers both).

Rails caches compiled templates and eager-loads helper code in production, so a
running Passenger process will NOT see edits until it restarts. After changing
the source, pull on the server and restart every app — `propagate.sh` does both.
