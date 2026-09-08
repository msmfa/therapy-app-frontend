# Provision the meaningful-use dashboard

The reviewed definitions live in [`meaningful-use.manifest.mjs`](../scripts/posthog/meaningful-use.manifest.mjs). They create **Plastic Brains — meaningful use**, the seven main insights in the analytics guide, and **Power users — 60 days** / **Activated — 60 days**. Descriptions in PostHog explain each denominator, window, and limitation. Ancillary checkout outcome/restore and notification setup explorations mentioned in the analytics guide are not additional saved tiles in this seven-insight manifest.

The target is **Plastic Brains**, EU project **260159**. The script verifies the project ID and name before writing. To target another project, first edit and review the manifest's target; an accidental environment override cannot redirect it.

## Credentials

Use Node 20 or later. Supply a **personal API key** through the `POSTHOG_PERSONAL_API_KEY` environment variable, preferably injected from a secret manager. Scope it to this project with:

- `project:read`
- `dashboard:read`, `dashboard:write`
- `insight:read`, `insight:write`
- `cohort:read`, `cohort:write`

The public `phc_…` project token cannot administer dashboards. Never put a personal key into an `EXPO_PUBLIC_*` variable, source file, command argument, or committed `.env` file. The script does not load `.env` files, print credentials, or echo server response bodies.

Optional environment variables:

| Variable | Meaning |
| --- | --- |
| `POSTHOG_APP_HOST` | Must match the manifest: `https://eu.posthog.com`. This is the administrative host, not the `.i.posthog.com` ingestion host. |
| `POSTHOG_PROJECT_ID` | Must match the manifest: `260159`. |
| `POSTHOG_EXCLUDE_COHORT_IDS` | Comma-separated IDs of existing internal/test cohorts to exclude explicitly. IDs must exist and cannot refer to either managed engagement cohort. |

Every insight includes `environment=production` and the project's internal/test filter. Each dynamic cohort applies the production condition to **each** behavioral event and explicitly excludes the existing **Internal / Test users** cohort **223892**. The hosted cohort editor disables its global filter switch because the project exclusion itself references that cohort, so the managed cohorts use `filterTestAccounts:false` plus the explicit exclusion. The required ID is in the reviewed manifest and is checked before any write; optional IDs add exclusions without removing or duplicating it. The seven insights keep `filterTestAccounts:true`. No project filter settings are changed by the script.

The dashboard and seven insights were created through the hosted UI on 2026-09-08 at [Plastic Brains — meaningful use](https://eu.posthog.com/project/260159/dashboard/939805). Each exact query was inspected and ran without error; the app dataset was empty. The onboarding funnel uses `onboarding_step` because the shared website project already assigns numeric meaning to `step`. Empty results are expected before opted-in production usage; they are not evidence that ingestion has been verified.

## Review and apply

Print the complete definitions locally, without credentials or network access:

```sh
node scripts/posthog/provision.mjs --print-manifest
```

With the personal key available in the environment, run the default read-only plan:

```sh
node scripts/posthog/provision.mjs
```

Apply the reviewed definitions:

```sh
node scripts/posthog/provision.mjs --apply
```

Rerun the read-only plan after applying. Unchanged managed definitions should report `unchanged`. The applied run also reads each created/updated object back and verifies its managed fields. It prints the dashboard URL when an ID is available. The key can be revoked after provisioning if no ongoing automation needs it.

Only run one provisioner at a time. PostHog does not make names unique across simultaneous creates. If a write times out, the script stops; rerun the read-only plan so it can discover whether the write succeeded. Do not blindly replay a POST. Existing duplicate exact names or a returned deleted match stop preflight without writes.

Updates replace the seven named queries/descriptions and the two named cohort definitions. They preserve unrelated objects, existing dashboard tiles, other dashboard memberships, sharing settings, and fields outside the manifest. The script never deletes, captures events, changes billing, executes test captures, or changes retention/project settings. Cohort recalculation and the saved insights' own results may take time after PostHog accepts their definitions.

## Metric interpretation

- Funnels count unique people, with all observed first-step people as the denominator. Their 14-day / 1-hour / 60-day / 30-minute conversion windows are separate from the displayed 180-day lookback. Recent entrants have incomplete follow-up.
- Repeat use combines new-note saves and reviews with **OR before unique-person aggregation**. It does not add two unique-user counts. Weekly buckets cover the moving last 60 days; edge buckets can be partial.
- Retention uses recurring weekly cohorts of all observed new-note savers, including non-returners, and nine intervals (start plus eight follow-up weeks). Compare equally mature cells. It does not claim therapy-cycle eligibility or clinical benefit.
- Notification follow-through follows the documented reader/review funnel. It is based on opens, not sends/delivery, and does not count composer saves. The `reminder_kind` breakdown keeps those paths visible.
- Failure volume has no implied success-rate denominator. Power-user and activation cohorts use observed opted-in actions, not the entire customer population. Local activation provenance can undercount cross-device and reinstalled histories.

## Local verification

```sh
node --test scripts/posthog/provision.test.mjs
```

Tests cover dry-run behavior, idempotent reruns, read-back verification, name ambiguity, preservation of unrelated content, recovery after an uncertain create, cohort/query definitions, safe pagination, and credential redaction. No live production calls or events are made by these tests.

The seven native query payloads were additionally validated against PostHog's official generated [query JSON schema](https://github.com/PostHog/posthog/blob/master/frontend/src/queries/schema.json). Cohort shapes were checked against its [cohort API validator](https://github.com/PostHog/posthog/blob/master/posthog/api/cohort.py), including behavioral count thresholds and event-property filters. These validate payload structure; they do not replace inspecting the hosted results after real opted-in usage arrives.

Official API references: [insights](https://posthog.com/docs/api/insights), [dashboards](https://posthog.com/docs/api/dashboards), [cohorts](https://posthog.com/docs/api/cohorts), and [personal API keys](https://posthog.com/docs/api/personal-api-keys).
