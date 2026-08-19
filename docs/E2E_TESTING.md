# End-to-end tests (Maestro, iOS simulator)

A single smoke test drives the app the way a first-time user would, on a real
iOS simulator, against the **staging** backend. It runs on every pull request.

- Flows: [`.maestro/`](../.maestro)
- Support scripts: [`scripts/e2e/`](../scripts/e2e)
- CI job: [`.github/workflows/e2e-ios.yml`](../.github/workflows/e2e-ios.yml)

---

## What it covers

`.maestro/smoke.yaml` runs five phases in order. Each is its own file so a
failure names the phase it happened in.

| Phase | File | What it proves |
|---|---|---|
| 00 | `subflows/00-login.yaml` | Cold launch, sign in with the staging test account |
| 01 | `subflows/01-onboarding.yaml` | Schedule therapy sessions, reminder plan renders, onboarding completes |
| 02 | `subflows/02-notes.yaml` | Write a note, it appears in the list, it opens and decrypts |
| 03 | `subflows/03-navigation.yaml` | Calendar and settings tabs load for the signed-in account |
| 04 | `subflows/04-logout.yaml` | Sign out returns to the login screen |

Phase 01 is the only one that writes to the backend (it POSTs to
`/api/therapy-sessions/sync`). Notes are stored in an encrypted SQLite database
on the device, so phase 02 never leaves the simulator.

---

## Required CI secrets

Set these under **Settings → Secrets and variables → Actions** on
`msmfa/therapy-app-frontend`.

| Secret | Example | What it is |
|---|---|---|
| `STAGING_API_URL` | `https://staging.plastic-brains.com` | Staging backend base URL. Baked into the test build and used by the cleanup script. Must not be a production hostname; the build refuses if it is. |
| `STAGING_E2E_EMAIL` | `maestro-e2e@plastic-brains.com` | The dedicated staging test account. Not a real person's account. |
| `STAGING_E2E_PASSWORD` | *(generated)* | That account's password. |

The workflow checks all three are present before it builds anything, so a
missing secret fails in seconds with a message naming it, rather than twenty
minutes later inside xcodebuild.

Nothing else is needed: the build is signed ad hoc (simulator only), so no
Apple credentials, team, or provisioning profile are involved, and Sentry
upload is disabled for E2E builds.

Ad hoc rather than unsigned, deliberately. `CODE_SIGNING_ALLOWED=NO` leaves the
app with only a linker-generated signature and no embedded entitlements, and
iOS then rejects every Keychain call with "A required entitlement isn't
present." expo-secure-store holds the auth tokens and the note encryption key,
so on an unsigned build no note can be saved at all.

---

## Creating the test account

The account must exist on staging before the first CI run. This is idempotent,
so it is safe to re-run at any time:

```bash
E2E_API_URL=https://staging.plastic-brains.com \
E2E_EMAIL=maestro-e2e@plastic-brains.com \
E2E_PASSWORD='<the password>' \
yarn e2e:ensure-account
```

It creates the account if missing, confirms the password if it already exists,
and fails with a clear message if the address exists under a different
password. It never deletes anything.

Rerun it if the staging database is ever rebuilt. CI deliberately does not run
it: a PR should fail loudly on a missing account rather than silently recreate
one.

---

## Running it locally

Requires Xcode with an iOS simulator, CocoaPods, and a JDK (Maestro needs one).

```bash
# once
brew install openjdk
curl -fsSL "https://get.maestro.mobile.dev" | bash

# build a simulator app pointed at staging
EXPO_PUBLIC_API_URL=https://staging.plastic-brains.com yarn e2e:build:ios

# run the flows against it
E2E_APP_PATH="$(find build/e2e-derived-data/Build/Products/Release-iphonesimulator -name '*.app' -maxdepth 1)" \
E2E_EMAIL=maestro-e2e@plastic-brains.com \
E2E_PASSWORD='<the password>' \
yarn e2e:run:ios

# remove the sessions the run created
E2E_API_URL=https://staging.plastic-brains.com \
E2E_EMAIL=maestro-e2e@plastic-brains.com \
E2E_PASSWORD='<the password>' \
yarn e2e:cleanup
```

Useful environment variables:

| Variable | Default | Effect |
|---|---|---|
| `E2E_SKIP_PREBUILD` | `0` | `1` reuses an existing `ios/` directory instead of regenerating it. Saves several minutes when iterating on flows; do not use after changing native config. |
| `E2E_SIMULATOR` | `iPhone 16` | Which simulator to boot. |
| `E2E_ARTIFACTS_DIR` | `build/e2e-artifacts` | Where Maestro writes screenshots and its command log. |
| `E2E_BUILD_CONFIGURATION` | `Release` | Release bundles the JS, so Metro is not needed while the flows run. |

You can also point everything at a local backend (`http://localhost:3000`) for
faster iteration; the guards allow localhost and private LAN addresses.

Homebrew's `openjdk` is keg-only, so `maestro` fails with "Unable to locate a
Java Runtime" until it is on the path:

```bash
export JAVA_HOME=/opt/homebrew/opt/openjdk/libexec/openjdk.jdk/Contents/Home
export PATH="$JAVA_HOME/bin:$PATH"
```

`E2E_SIMULATOR` matters more than it looks. The default is `iPhone 16`, and
when that device is not installed the run script falls back to the newest
available iPhone — which may be one another process is already driving. Name a
device explicitly when anything else is using a simulator.

---

## Repeatability and data safety

**Never production.** Two independent guards, because a typo in a secret is the
likeliest way it would happen:

- `scripts/e2e/staging-api.mjs` rejects known production hostnames outright,
  and rejects any host that is neither recognisably staging nor local unless
  `E2E_ALLOW_UNKNOWN_HOST=1` is set.
- `scripts/e2e/build-ios-sim.sh` refuses to bake a production URL into a test
  build.

**Repeatable.** Each run launches with `clearState` and `clearKeychain`, so the
app always starts logged out and never-onboarded regardless of what the last
run left on the device. Both are simulator-local.

**Backend state is not covered by `clearState`.** The sessions phase 01 creates
live on the backend and outlive the device wipe. If today already has a
session, tapping today opens the schedule modal in edit mode, which offers
delete and confirm instead of the "every week" option, and phase 01 fails on a
missing `schedule-mode-weekly` that gives no hint of the real cause. CI
therefore runs the cleanup *before* the flows as well as after, so a run never
depends on the previous run having tidied up. Do the same locally after an
interrupted run.

**Cleans up only what it creates.** `yarn e2e:cleanup` signs in as the test
account and clears therapy sessions in a bounded date window
(`E2E_CLEANUP_FROM_DAYS`..`E2E_CLEANUP_TO_DAYS`, default -30..+70 days around
today). It is scoped to that one account and that one window. It does not reset
shared staging data, does not drop collections, and does not delete the
account. CI runs it with `always()` so a failed or cancelled run still tidies
up.

The smoke test also never taps **Delete account** in settings, and never
presses save on the calendar tab. Both are addressed by `testID` rather than by
position, so a layout change cannot make a tap land on the wrong row.

---

## Artifacts on failure

When the job fails it uploads `maestro-ios-artifacts-<run>-<attempt>`,
containing the screenshots each phase takes at its checkpoints, Maestro's
per-command debug log, and a simulator log archive. Download it from the run's
summary page. Artifacts are kept 14 days, and are only uploaded on failure.

---

## The testID contract

Every selector the flows use is declared in
[`src/constants/testIDs.ts`](../src/constants/testIDs.ts) and referenced from
the components by that constant. The YAML repeats the same literal strings,
since Maestro cannot import TypeScript.

Renaming a value there breaks a flow. Treat it like a public API: add freely,
rename deliberately, and grep `.maestro/` before changing one.

Calendar day cells are the one exception: `react-native-calendars` derives
their ids itself as `therapy-calendar.day_<YYYY-MM-DD>` from the root `testID`
passed to `<Calendar>`.

---

## Known issue: the staging hostname

As of this writing `staging.plastic-brains.com` does not serve the staging
backend. The Railway service is running (branch `staging`, connected to the
`cluster0.gdoqwtt` staging cluster), but its public hostname is not resolvable:

- `www.plastic-brains-staging.com`, the domain registered on the service, has
  no DNS record at all and its certificate is stuck issuing.
- `staging.plastic-brains.com` resolves through Cloudflare to Railway's edge
  but returned Railway's fallback 404, because no service claimed that
  hostname.

`staging.plastic-brains.com` has since been registered on the staging service,
which is the hostname `ALLOWED_ORIGINS`, `APPLE_REDIRECT_URI` and the `staging`
profile in `eas.json` already expect. Railway still needs ownership proof
before it will serve, so add these two records in Cloudflare for
`plastic-brains.com`:

| Type | Name | Value | Proxy |
|---|---|---|---|
| CNAME | `staging` | `w68izoi3.up.railway.app` | DNS only |
| TXT | `_railway-verify.staging` | `railway-verify=008ba60dc126d0c1bf7b9ff7ed2757e2650660524e532b94e1f7f6eb8eb37e56` | n/a |

Then confirm with:

```bash
railway domain status 7afa15bc-73a7-4b75-bb02-c380d8796ad5
curl -s -o /dev/null -w '%{http_code}\n' https://staging.plastic-brains.com/health   # expect 200
```

Until that resolves, run the flows against a local backend pointed at the
staging database, which is how they were verified:

```bash
cd ../therapy-app-backend && npm run dev     # its .env already targets staging Mongo
EXPO_PUBLIC_API_URL=http://localhost:3000 yarn e2e:build:ios
```

The `eas.json` `staging` profile still points at `https://staging.plastic-brains.com`,
so it will start working as soon as the DNS records land. No app change needed.
