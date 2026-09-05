# Full application audit fixes

Implemented on 5 September 2026, following the audit of the complete React Native
frontend and Express/MongoDB backend. This covers the nine high-priority and six
medium-priority findings, in addition to the earlier branch review fixes.

## Changes

| Audit finding | Corrected behavior |
| --- | --- |
| P1-01: Apple links an unverified password account | Password recovery must verify the mailbox before linking. Recovery replaces the password and revokes existing sessions. |
| P1-02: Refresh survives password reset | Refresh credentials retain their session generation; late successors cannot restore a revoked login. Compromised rotation families also have durable revocation records. |
| P1-03: Sensitive Sentry request data | Both apps remove HTTP bodies, credentials, query values and account context before sending error events. HTTP tracing and automatic failed-request capture are disabled. |
| P1-04: Extreme appointment dates stall scheduling | API writes enforce date/count limits; scheduling and database reads stay bounded even for old outliers. |
| P1-05: Stale saves delete other-device appointments | Calendar saves send the snapshot the person edited. The backend preserves unseen additions and rejects conflicting changes with a refresh action in the app. |
| P1-06: Same-day appointments collapse | Appointments retain stable IDs. The day sheet lists every appointment and edits or deletes only the selected one. |
| P1-07: Old refund replaces current subscription | Renewal purchase dates determine period ordering. Signing dates order updates to the same transaction. |
| P1-08: Temporary Apple verification error rejects purchase | Retryable verifier failures return 503, preserving the client's temporary-failure/retry behavior. |
| P1-09: Apple authorization survives deletion | Deletion requests fresh Apple confirmation, verifies the account, and revokes Apple access before removing app data. Apple failures keep the account available for retry. |
| P2-01: Failed calendar save partially deletes data | All calendar writers use a per-account MongoDB transaction. A failed write rolls back the entire save. |
| P2-02: Refresh outage deletes saved login | Only credential rejection invalidates the session; network errors and server outages preserve saved credentials. |
| P2-03: Expired access token prevents logout cleanup | Logout permits a bounded refresh before authenticated device cleanup, then invalidates any late completion. |
| P2-04: Changing history erases review completion | Reviews match their occurrence timestamp, with day-based compatibility for legacy records, rather than a shifting gap index. |
| P2-05: No permission request after skipped onboarding | Reminder settings requests notification access when the OS still permits a prompt, then registers the device. Denied access routes to Settings. |
| P2-06: Failed review save silently closes | Failed writes propagate an error; the review sheet stays open for retry and prevents duplicate submissions. |

## Rollout

Deploy the backend before distributing this frontend. Older clients attempting
destructive replacement saves without a baseline receive 428 and must update.
Deploying the frontend against the old backend would not provide conflict protection.

MongoDB must support transactions (replica set or sharded cluster). A read-only check
confirmed transaction support for the locally configured database. New user/session
fields default to zero, so existing documents do not require a bulk migration. Ensure
model indexes are present, including the new revoked refresh family collection.

The required Apple deletion configuration is present locally; this does not prove the
keys are valid or that the intended deployment has the same settings. Existing local
password accounts need mailbox recovery once before Apple linking. Existing Apple
accounts reauthorize at deletion, so the change does not require stored Apple tokens.

The backend already had uncommitted changes to `.env.example`, `src/server.ts`,
`src/subscription/environment.ts`, and `tests/subscriptionEnvironment.test.ts`, plus
`.claude/`. Those remain untouched and are excluded from these audit-fix commits.
In particular, confirm the intended sandbox/App Review access policy when deploying.

## Verification

- Frontend: 92 Jest suites, 564 tests passed; TypeScript passed.
- Backend: 24 Jest suites, 231 tests passed in an isolated copy of the exact commit; production TypeScript build passed. The original working tree, including your separate environment-policy edits, also passed all 228 of its tests.
- Calendar integration tests use a disposable MongoDB replica set, including an injected write failure to prove rollback.
- Authentication tests exercise the actual API and deterministically pause database insertion around password reset.
- Apple transaction and deletion tests mock Apple boundaries; no production purchases, account deletions, email, or push deliveries are used in the tests.
- An actual Sentry SDK envelope captured through a local transport contains only request method and URL, with no credentials or body.
- Production iOS JavaScript/Hermes export passed with dotenv disabled and the production API URL supplied explicitly.
- The updated JavaScript loaded in the installed development client on the iPhone 15 Pro Max simulator (iOS 17.4), launched through Terminal using Metro on port 8082. This reuses the installed native binary; it is not a new signed release archive.

## Release checks still required

Before production release, build and install the exact signed release/TestFlight
candidate, then verify Apple login, deletion/revocation, purchases, renewal, restore,
refunds, notifications, password-reset delivery and two-device calendar conflicts
against the intended backend. Check supported iPad layouts as well as iPhone.

The dependency advisories recorded in the audit still need reachability review and
remediation decisions; this patch does not upgrade dependencies. Confirm deployed
secrets, backup restoration, indexes, alerting, rollback, App Store configuration and
approved privacy/terms text. Removing draft labels is not evidence of legal approval.
