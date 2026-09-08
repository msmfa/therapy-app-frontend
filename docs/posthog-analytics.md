# Plastic Brains product analytics

Measure whether people save something useful, return to review it, and keep doing so. App analytics consent is recorded automatically in every build after authentication state has hydrated. Welcome and Account settings have no consent question or control. This implementation collects a small explicit event vocabulary, without screen/tap autocapture or session replay.

## Deployment and configuration

1. Deploy the companion backend analytics changes first. `GET /api/users/me` returns optional `analyticsConsent`; `PATCH /api/users/me` accepts a strict boolean. The app synchronizes `analyticsConsent: true` for authenticated accounts whose server value is false or unknown. The backend also supplies verified subscription events and durable analytics deletion. See the backend analytics guide for its worker and environment configuration.
2. Set `EXPO_PUBLIC_POSTHOG_KEY` to the PostHog **project token**, and `EXPO_PUBLIC_POSTHOG_HOST` to exactly `https://eu.i.posthog.com` or `https://us.i.posthog.com`, matching the project region. These values are intentionally public in the app bundle. Never put a personal API key in an `EXPO_PUBLIC_*` variable.
3. Install dependencies and rebuild the native app: the React Native SDK uses Expo application, file-system, device and localization modules. This change does not add replay or a PostHog native plugin. A Metro export alone does not install native dependencies on a device.
4. The `analytics-qa` EAS profile is a Release simulator build against the staging API. The `testflight` profile is a physical-device Release build with store distribution against the production API and production EAS environment. Both set `EXPO_PUBLIC_ANALYTICS_ENVIRONMENT=qa`; beta/test events carry `environment=qa`, and their local analytics storage is separate from production. The `production` profile explicitly sets `environment=production`. All profiles use the same automatic consent behavior and synchronize authenticated accounts with their configured API. The current PostHog plan allows one project, so both beta profiles share project 260159 while every production insight/cohort explicitly excludes QA events. Development builds, demo seeding, subscription fixtures, and builds with `EXPO_PUBLIC_ANALYTICS_INTERNAL_USER=true` cannot collect.
5. Follow the [TestFlight release procedure](testflight-release.md) for build/upload commands, scoped Sandbox access and tester priorities. Verify automatic consent initialization, logout/login, account switching, offline retry and account deletion on a device. Inspect raw events filtered to `environment=qa` to confirm only the dictionary below arrives. Native StoreKit behaviour still needs device/sandbox verification; sandbox billing is excluded from production lifecycle analytics. Before public release, rebuild with the `production` profile and verify production analytics configuration; do not promote the QA-tagged beta binary directly.
6. The production EAS profile is configured for the existing [Plastic Brains EU project 260159](https://eu.posthog.com/project/260159). Provision the dashboard/cohorts with the idempotent script in the [provisioning guide](posthog-provisioning.md). The script defaults to a read-only plan; `--apply` updates only its named objects. Administrative keys belong only on the backend or in the provisioning environment. Project retention remains an administrator-controlled PostHog setting.

Missing or invalid configuration disables client collection. An unavailable analytics service must not prevent authentication, a saved note, onboarding completion or checkout.

## Identity, consent and deletion

The existing backend account ID is the canonical PostHog distinct ID. Login, session restoration and token refresh identify the same account. Do not use an email, name, device ID or a new random account ID on every login. PostHog joins the consented anonymous onboarding identity to the first authenticated account.

Logout resets the SDK's device identity; it does not erase already uploaded account history. The same account ID on the next login lets power-user and retention cohorts span visits and devices. Account switches invalidate unfinished asynchronous actions so their results cannot be attributed to the next account.

After authentication resolves, consent is saved as true for the anonymous identity or canonical signed-in account. Existing local false or unknown values migrate to true, and old pending preference choices are cleared. This applies to QA and production builds. Each account retains its own storage and identity; account switching does not attribute one account's events to another. Storage failure leaves capture disabled.

For an authenticated account, synchronization reads the server value and sends `analyticsConsent: true` if it is false or unknown. Failed synchronization retries on login and foreground entry. Local analytics can initialize before the request succeeds; backend delivery remains subject to the current server value until synchronization completes. There is no consent question, preference toggle or pending-choice message in the app.

Account deletion clears device analytics state and invokes the companion backend's durable PostHog erasure flow. Server-only deletion credentials and a running worker are required for remote erasure; do not claim remote deletion is complete just because the local app reset.

An account ID and the fact of using this app are still personal information. Pseudonymous analytics is not anonymous data.

## Event dictionary

All client events allow only the properties listed here, plus `app_version`, `platform`, `environment=production` (`qa` for the `analytics-qa` and `testflight` profiles), and necessary PostHog identity/session metadata. Unknown events are rejected; unknown properties and SDK device enrichment are stripped. Event timestamps describe the action, not a later retry. No note text, title, therapy goal, appointment time, email, notification payload, raw error, note ID or review ID enters an event. PostHog geographic enrichment is disabled.

| Event | When it is recorded | Properties |
| --- | --- | --- |
| `onboarding_step_viewed` | An actual focused onboarding screen is visible; once per step per local visit. Loading and redirect branches do not count. | `onboarding_step`, `flow_version=1` |
| `onboarding_completed` | Onboarding persistence and completion succeed. | `plan_mode=real/sample` |
| `checkout_started` | The canonical purchase/restore operation begins. | `operation=purchase/restore`, `plan=monthly/annual/unknown`, `entry_point` |
| `checkout_result` | That operation resolves. A client outcome describes checkout UX, not a subscription lifecycle transition. | Above plus `outcome=purchased/cancelled/pending/failed/restored/unlinked/no_entitlement` |
| `note_saved` | An encrypted note insert or changed update succeeds. Unchanged edits, hydration, migration and demo data do not count. | `operation=new/edit`, `is_first_note`, `entry_point` |
| `note_opened` | A person intentionally opens a note from the list. | `entry_point=notes`, optional `note_age_bucket=same_day/1_7_days/8_30_days/over_30_days` |
| `review_completed` | A new review record is successfully persisted; duplicate reviews do not count. | `review_kind=post_session/post_sleep/mid_session/pre_session/unprompted`, `first_review`, `entry_point=notes`, `is_first_review_for_note`, `note_saved_on_previous_visit` |
| `notification_setup_result` | A permission request resolves or push registration makes a real attempt. Cached registration is not another success. | `stage=permission/registration`, normalized `outcome`, `entry_point=onboarding/settings/app_start` |
| `notification_opened` | A notification response can be handled after app readiness; deduplicated locally. | `reminder_kind=log_note/review_note/unknown`, `destination=notes/note_editor` |
| `critical_action_failed` | A tracked important operation fails. | `operation=note_save/review_save/checkout/onboarding_save/notification_registration`, `error_code=network/storage/auth/store/unknown` |

`onboarding_step` is one of: `welcome`, `goal`, `session_date`, `session_cadence`, `reminder_times`, `plan_preview`, `reviews_preview`, `note_preview`, `subscription_preview`, `account_preview`, `notifications_preview`, `success`. It identifies the page, never the person's answer.

Subscription starts, renewals, trial conversions, auto-renew changes, expiry and refunds come from verified backend billing transitions. Never infer these from paywall taps, a restored purchase, a frontend entitlement refresh or an unverified Apple payload. The backend guide defines its separate event properties and delivery guarantees.

## Reproducible dashboard and cohorts

Create a dashboard named **Plastic Brains — meaningful use**, use unique people where indicated, filter to production, and exclude designated internal/test cohorts. Product metrics represent successfully collected events and can undercount customers because of initialization or delivery failures. Billing records remain authoritative for revenue and subscriber totals.

| Insight | PostHog definition | Decision it supports |
| --- | --- | --- |
| Onboarding completion | Ordered funnel: `onboarding_step_viewed(onboarding_step=welcome)` → `onboarding_step_viewed(onboarding_step=subscription_preview)` → `onboarding_completed`; conversion window 14 days. Inspect completion `plan_mode` separately to preserve the full funnel denominator. Use separate step funnels for optional paths. | Where the onboarding journey loses people. Earlier steps missed before analytics initialization are not backfilled. |
| Checkout reliability | `checkout_started(operation=purchase)` → `checkout_result(operation=purchase,outcome=purchased)` within 1 hour. Adjacent outcome trend with cancelled/pending/failed separated; separate restore funnel. | Friction in checkout, distinct from verified recurring revenue. |
| First meaningful return | `note_saved(operation=new)` → `review_completed(is_first_review_for_note=true,note_saved_on_previous_visit=true)` within 60 days, unique people. | Whether users return to review a note they previously saved. The second event establishes its own note's provenance locally; the funnel cannot join a specific first-step note without exporting note IDs. |
| Repeat meaningful use | Weekly unique people performing `note_saved(operation=new)` OR `review_completed`, plus a rolling 60-day trend. | How many people keep doing the core actions. Avoid treating app opens or edits as the primary value measure. |
| Meaningful return retention | Retention insight: start `note_saved(operation=new)`, return `review_completed`, weekly intervals. Read alongside 60-day results and only compare cohorts with equally mature follow-up windows. | Return behaviour over time; it is not a measure of attendance or clinical benefit. |
| Notification follow-through | `notification_opened` → `note_opened` OR `review_completed` within 30 minutes; break down the first event by `reminder_kind`. Also track permission/registration outcomes separately. | Whether opened reminders are followed by useful actions. This is association, not proof the reminder caused the action. |
| Important failures | Count `critical_action_failed`, broken down by operation and safe error code; compare with the corresponding successful action volumes. | Which product failures deserve investigation. |

Create an initial **Power users — 60 days** behavioural cohort requiring both at least **2** `note_saved(operation=new)` events and at least **4** `review_completed` events during the last **60 days**. This is a starting threshold to tune after observing real usage, not a definition of therapeutic success. Create **Activated — 60 days** from at least one review with both `is_first_review_for_note=true` and `note_saved_on_previous_visit=true`. Compare the cohorts by activation and verified subscription outcomes, using stable account identities.

Do not classify someone as churned because they missed a daily or seven-day usage target. Session cadence varies. Accurate retention per therapy cycle requires a separate backend eligibility model covering all eligible accounts, including those who never return, and only completed observation windows. That model is not supplied by these events; do not substitute returning users as its denominator.

## Accuracy and delivery limits

- A local visit starts on app launch, account change, or return after at least 30 minutes in the background. It is not an appointment or a therapy session.
- First-note/review flags reflect available local records. Use PostHog's first observed event analysis for analytics-lifetime activation; neither proves a person's first-ever action across imports, devices or reinstallations.
- The same-note/later-visit check uses a bounded encrypted local sidecar (32 notes, 64 action keys). Raw note/review IDs stay on the device. Missing or evicted history is conservative: it does not invent a known prior visit. Cross-device follow-through is therefore undercounted.
- Notes opened following a notification still use the actual notes UI entry point. Use the notification funnel for attribution rather than attaching stale notification context to later actions. The existing payload exposes only `log_note` or `review_note`, so no finer reminder classification is guessed.
- Client SDK buffering is bounded to 100 events and preserves occurrence timestamps and UUIDs on ordinary same-account offline retries. Logout, account switch and deletion deliberately discard unsent events. Device loss, process/storage failure and queue eviction can lose events; this is product analytics, not an audit ledger.
- There is no historical event backfill when automatic consent initializes or migrates an existing preference. Billing delivery must also pass the current server consent and production-account checks.
- An automatic checkout after authentication waits up to one second for that account's local consent and SDK initialization before the checkout starts. Initialization failure or timeout proceeds with billing and permanently omits that attempt's client analytics; activity before analytics is ready is not buffered. An account change during the wait cancels the old attempt. Use verified backend billing for subscription totals, since slow initialization can still undercount the client funnel.

## Maintenance

Event names, enums and the final payload sanitizer live in `src/features/analytics/events.ts` and `runtime.ts`. Add new properties there deliberately, with a concrete product question and sanitization tests. Keep capture calls beside confirmed state transitions; do not instrument render effects as saves or classify raw exceptions into free-text analytics properties.

Official references: [React Native SDK](https://posthog.com/docs/libraries/react-native), [identity](https://posthog.com/docs/product-analytics/identify), [funnels](https://posthog.com/docs/product-analytics/funnels), [retention](https://posthog.com/docs/product-analytics/retention), [cohorts](https://posthog.com/docs/data/cohorts).
