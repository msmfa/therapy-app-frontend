# Connected progress widget

`ProgressWidget` is embedded in the Plastic Brains iOS app. It supports small and medium Home Screen widgets, light/dark appearance, and the system's Clear mode. Native source files and fonts are copied into the generated iOS project by `plugins/withProgressWidget.js`; do not edit the ignored `ios/ProgressWidget` copies.

## Data flow

- `ProgressWidgetSync` reads the signed-in user's materialised `review_note` reminder plan and locally saved review metadata. Log-note prompts do not represent review check-ins.
- Review identity matching and closing times reuse `isOccurrenceAnswered` and `occurrenceWindows`. Consecutive scheduled dates earn one streak day each; unscheduled dates and open windows preserve the streak. An unanswered slot resets the streak when its existing grace window closes. If a date has multiple slots, all must be completed.
- Historical calendar chunks are fetched only when local review history extends beyond the main calendar's 90-day lookback. Requests remain inside the API's two-year range limit. A revision mismatch is discarded until the next calendar refresh.
- Review save/undo/deletion, schedule changes, language changes, and foregrounding rebuild the display timeline. It includes local midnights and window boundaries for 35 days, so the extension can update without the app running. After the timeline expires, it asks the user to reopen the app.
- The bridge writes only display fields (weekday labels, ticks, streak, copy, destination and timeline dates) to `group.com.plastic-brains.app.progress`. It shares no note contents, identifiers, access tokens, or user details. Native account ownership guards stale writes, and auth transitions clear the shared timeline.
- A tap opens `therapyapp:///(tabs)/notes`. The existing auth/onboarding gates still apply.

The disconnected design preview is still available through `scripts/widget-preview/build.rb`, with its own bundle ID and App Group. Production never includes `PreviewSample.swift` or the preview fixtures.

## Build and signing

The Expo config plugin creates the extension target, embeds it, adds the native React Native bridge, and declares the extension for EAS credential generation. Repeated runs are idempotent. Generate an iOS build through the normal Expo/EAS workflow; Expo Go cannot load the custom bridge.

For device/TestFlight builds, the Apple team must provision both `com.plastic-brains.app` and `com.plastic-brains.app.progress` with the shared App Group. EAS reads the plugin's `extra.eas.build.experimental.ios.appExtensions` declaration. No release or developer-account change is performed by local simulator builds.

## Verification

Focused Jest tests cover window parity, missed and open windows, unplanned days, duplicate dates, undo, stable identities after schedule edits, Monday rollover, DST boundaries, no note data in payloads, mutation refreshes, stale async reads and sign-out. TypeScript and the full simulator app/extension build are checked separately.

A signed-in device check remains necessary before release: complete and undo a real review, edit a schedule, change accounts/sign out, and verify both widget sizes refresh. WidgetKit refresh requests are controlled by iOS and aren't an immediate-update guarantee.
