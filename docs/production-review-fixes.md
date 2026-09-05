# Production review fixes

Validated on 5 September 2026.

| Finding | Result |
| --- | --- |
| Failed note saves discard drafts | Encryption and database errors reject; drafts remain available for retry. Pending saves block duplicate submissions. |
| Token refresh restores an old session after logout | Session changes invalidate pending refreshes and API retries. Credential writes are ordered, and old logout cleanup cannot erase a new login. |
| Appointments leak across accounts | Sessions, pending requests, reminder state, and caches are scoped by account. Stale responses and pending edits cannot cross accounts. |
| A single appointment edit changes an eight-week series | Existing appointments use single-session edits. |
| Server outage looks like an inactive subscription | An inconclusive account check with no local receipt returns unknown, preserving the existing outage access policy. |
| Account controls require payment | The paywall links to account settings in ready, loading, and unavailable states. Logout and account deletion remain accessible. |
| Deletion omits Apple billing information | The confirmation explains continued billing, offers subscription management, and still permits immediate deletion. Long alerts scroll so actions remain reachable. |
| Calendar creates appointments beyond its loaded range | Date selection, weekly generation, and submission share the one-year window. Near the limit, the sheet displays the actual repeat count. |
| Travel leaves stale reminder times cached | Successful time-zone updates invalidate and refresh reminders. Older requests and native storage writes cannot restore the invalidated schedule. Zone updates are serialized per account. |
| Time-label test assumes one locale | Tests explicitly cover en-GB and en-US while preserving device-local formatting. |

The visible draft notices were removed from Privacy Policy and Terms. Removing those labels does not establish completed legal review.

The deletion flow follows [Apple's guidance on account deletion and subscriptions](https://developer.apple.com/support/offering-account-deletion-in-your-app/).

## Validation

- `yarn test --ci --runInBand`: 87 suites and 552 tests passed.
- `yarn typecheck`: passed.
- `git diff --check`: passed.
- Production iOS Hermes export with dotenv disabled and the production API URL supplied: passed.

These checks do not replace signed-device purchase/restore, push notification, and backend integration testing or the appropriate legal review.
