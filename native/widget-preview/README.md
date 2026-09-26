# Check-in widget — simulator design preview

The connected app widget is now implemented in `native/progress-widget`. This standalone host remains useful for design exploration with fixtures.

A native medium-size WidgetKit extension plus an isolated preview app. The same SwiftUI view renders in both. Scheduled days appear above the day streak, using the app's existing fonts and pale blue/orange palette. Includes light/dark rendering, 3/5/7 scheduled days, completed/pending today, and no-plan state.

This is a design prototype with **sample data**. It does not read or change production accounts, notifications, reviews, or streaks. The preview uses a separate bundle ID (`com.plastic-brains.widgetpreview`). The completion switch changes a sample streak from 12 to 13; it is not a streak calculation.

## Run

Requires Xcode and the Ruby `xcodeproj` gem (already provided with CocoaPods on this machine).

```sh
ruby scripts/widget-preview/build.rb
xcodebuild -project output/widget-preview/StreakPreview.xcodeproj -scheme StreakPreview -configuration Debug -sdk iphonesimulator -derivedDataPath output/widget-preview/build build
xcrun simctl install booted output/widget-preview/build/Build/Products/Debug-iphonesimulator/StreakPreview.app
xcrun simctl launch booted com.plastic-brains.widgetpreview
```

On the simulator Home Screen, add the **Streak Preview → Check-in streak** widget. Tapping it opens the preview app. The controls write sample state to an App Group and request a WidgetKit reload. Generated projects/builds stay under ignored `output/`.

## Before production integration

- Attach the extension to the Expo iOS build with a reproducible config plugin and production App Group/signing configuration.
- Derive visible dates from the actual reminder plan, not a fixed weekday preference: this app schedules around therapy appointments.
- Derive ticks from attributed saved reviews. A delivered reminder is not a completed check-in.
- Implement and test consecutive scheduled-day streaks, including missed windows, multiple reminders on one day, edits, time zones, and week rollover. The app currently has review progress but no shared streak calculation.
- Share only the display snapshot, clear it on logout/account changes, and refresh after reviews and schedule edits.
- Add localized labels and verify the real Home Screen in light, dark, tinted, and larger-text configurations.
