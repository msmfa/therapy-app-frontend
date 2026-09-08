# TestFlight release

Use the `testflight` EAS profile for this beta: store distribution, physical-device iOS Release, production EAS environment/API, and demo seeding, subscription fixtures and demo autologin off. Client analytics carries `environment=qa`, keeping beta activity outside production dashboards and cohorts. The `analytics-qa` profile is a separate simulator/staging build and cannot be submitted to TestFlight.

Analytics consent is recorded automatically after authentication state has hydrated, with no question or control in Welcome or Settings. This behavior is the same in every build. Existing false or unknown local values migrate to true, and authenticated accounts synchronize `analyticsConsent: true` with the configured API. TestFlight uses production accounts while its client event environment and local analytics storage remain separate from production analytics.

This is a release procedure, not confirmation that a build has been uploaded or approved.

## Build and upload

Start from the reviewed, committed SHA in a clean checkout after CI passes. Use Node 22 and the pinned EAS CLI; keep local `.env*` files out of the release archive. Verify the resolved profile and remote environment preserve the settings above. Reuse the normal `PlasticBrains` scheme and existing distribution credentials, never the local StoreKit scheme.

```sh
nvm use 22
node --version
git status --short
git rev-parse HEAD
EXPO_NO_DOTENV=1 npx --yes eas-cli@23.2.0 build \
  --platform ios --profile testflight --non-interactive
```

Wait for success and record the commit, EAS build ID, version/build number and artifact URL. Submit that exact build:

```sh
npx --yes eas-cli@23.2.0 submit \
  --platform ios --profile production \
  --id '<finished-testflight-build-id>' --non-interactive
```

The **submission** profile `production` selects the App Store Connect destination; it does not change the binary's QA analytics configuration. Upload, Apple processing, beta review and tester-group assignment are separate steps. See [Expo's submission guide](https://docs.expo.dev/submit/ios/).

## Accounts and tester groups

The deployed production backend scopes Sandbox access using `APPLE_SANDBOX_TESTER_ACCOUNTS`, a comma-separated allowlist of canonical **Plastic Brains app account IDs** or app-login emails. Prefer IDs. Include the dedicated review account and intended beta accounts, and verify every entry resolves before testing purchases. Empty or mismatched entries deny Sandbox access. Keep this gate narrow; normal production transactions remain eligible and Xcode transactions remain denied in production.

TestFlight invitation addresses, Apple/Sandbox Apple Accounts and Plastic Brains logins serve different purposes. An Apple or invitation email does not automatically identify the backend app account. Supply the dedicated review login in App Store Connect's private review fields and share tester app credentials privately. Never put identities, passwords or tokens in repository files or release notes.

Complete beta test information and required review/compliance fields, then assign the processed build to the intended internal or external groups. Internal testers require App Store Connect access; external testers may need beta review before receiving a build. Verify actual group assignments and invite status. See [Apple's TestFlight workflow](https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview/).

## What to test

Use synthetic notes. This beta uses the production API, so its accounts and schedules are real records there.

1. **Account/onboarding:** create or sign into the assigned app account; complete dated and sample plans. Check the login transition, large text and plan/price summary. Switch between two accounts, verify notes and analytics identities stay separate, then return to the first account.
2. **Purchase/restore on an iPhone:** check Apple's offer, complete a Sandbox purchase, cancel an attempt, relaunch and restore under the correct app account. Check pending/failed states when available. Another app account must not inherit that purchase. Follow [Apple's TestFlight purchase guidance](https://developer.apple.com/help/app-store-connect/test-a-beta-version/testing-subscriptions-and-in-app-purchases-in-testflight/).
3. **Notes/notifications:** save, edit and reopen a note; complete a due review once and check duplicate taps. Allow/deny notification permission, change reminder times, background the app and tap a real delivered reminder to check its destination.
4. **Offline recovery:** disconnect the test device, save/reopen a note, then reconnect. Local work should remain usable and retries should recover. Same-account analytics retries preserve action times without duplicates; logout and account switch deliberately discard unsent events. Failed account-consent synchronization should retry on login or foreground entry after reconnecting.
5. **Analytics/deletion:** confirm the usage control is absent, anonymous onboarding is collected as QA after auth hydration, and account identities remain stable. Check that old false or unknown local values become true and old pending choices are cleared. Verify an authenticated account whose server consent is false or unknown synchronizes to true. The `analytics-qa` profile exercises the same behavior against staging. Inspect only `environment=qa` events for allowed properties. Use a disposable account for deletion and distinguish local cleanup, server acceptance and completed remote erasure.

Report build number, device/iOS version, steps, expected/actual result and approximate time. Remove personal information from screenshots. Record untested physical StoreKit, notification and offline scenarios explicitly; simulator mocks do not establish device success.

## Public release

After beta approval, rebuild the reviewed SHA with `--profile production`, keep demo flags off and verify the resolved analytics environment is `production`. Confirm automatic consent initialization and account synchronization work without a usage question or control. Check that exact binary, then submit its build ID using the same submission profile. **Do not promote this QA-tagged beta binary directly to the public App Store:** its bundled QA value would exclude customer activity from production metrics. Changing an EAS profile or submission destination does not rewrite an existing binary.
