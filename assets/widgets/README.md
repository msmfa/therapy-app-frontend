# Widget guide images

These PNGs capture `ProgressWidgetView`, the same SwiftUI view used by the real WidgetKit extension, at 3× resolution. Each size has light/dark variants for English, German, French, and Spanish. They contain example progress, never account data.

To refresh after changing the widget design:

1. Run `ruby scripts/widget-preview/build.rb` and build the StreakPreview simulator app.
2. Install it and launch with `--export-widget-images`.
3. Copy `widget-*.png` from its simulator Documents folder here.

The export implementation is in `native/widget-preview/PreviewApp.swift`. The guide selects the appropriate language, size, and appearance automatically.
