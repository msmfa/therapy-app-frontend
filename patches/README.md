# Native dependency patches

## expo-apple-authentication 8.0.8

This SDK 54 backport hardens presentation of the native Sign in with Apple sheet:

- [Expo #47733](https://github.com/expo/expo/pull/47733): run `requestAsync` on the main queue, where UIKit presentation must be prepared.
- [Expo #46955](https://github.com/expo/expo/pull/46955): resolve and retain a presentation window before starting authorization, and return `WindowUnavailableException` instead of calling `fatalError` if a window is unavailable.

SDK 54 does not have the newer `Utilities.keyWindow()` helper used upstream. The patch looks for a key window in a foreground-active `UIWindowScene`, then supports SDK 54's legacy AppDelegate lifecycle with a key window that has no scene. It does not choose a window belonging to a background scene.

The dependency is pinned to `8.0.8`, and `postinstall` applies the patch with `--error-on-fail` so an incompatible update fails installation. `postinstall-postinstall` keeps the patch applied after Yarn v1 dependency removals as well. Review and remove the backport when upgrading to an Expo version that includes both fixes. A new native build is required; an OTA JavaScript update cannot apply it.

This addresses known native presentation failure paths. The upstream main-queue crash report involved a newer scene-window helper, so it does not by itself establish the cause of any SDK 54 device freeze. Verify sheet presentation, cancellation and retry, and successful authentication on the affected device.
