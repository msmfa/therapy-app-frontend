#!/usr/bin/env bash
#
# Boots an iOS simulator, installs the built app, and runs the Maestro smoke
# test against it.
#
# Usage:
#   E2E_APP_PATH=/path/to/Build/Products/Release-iphonesimulator/App.app \
#   E2E_EMAIL=... E2E_PASSWORD=... \
#   scripts/e2e/run-ios-sim.sh
#
# Optional:
#   E2E_SIMULATOR      device name to boot (default "iPhone 16")
#   E2E_ARTIFACTS_DIR  where Maestro writes screenshots/logs (default build/e2e-artifacts)
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"

: "${E2E_APP_PATH:?E2E_APP_PATH must point at the built .app}"
: "${E2E_EMAIL:?E2E_EMAIL must be set (dedicated staging test account)}"
: "${E2E_PASSWORD:?E2E_PASSWORD must be set}"

SIMULATOR_NAME="${E2E_SIMULATOR:-iPhone 16}"
ARTIFACTS_DIR="${E2E_ARTIFACTS_DIR:-$REPO_ROOT/build/e2e-artifacts}"
APP_ID="com.plastic-brains.app"

if [ ! -d "$E2E_APP_PATH" ]; then
    echo "error: no app bundle at $E2E_APP_PATH" >&2
    exit 1
fi

mkdir -p "$ARTIFACTS_DIR"

echo "==> Selecting a simulator (preferring \"$SIMULATOR_NAME\")"
# Pinning an exact device name makes the run reproducible, but Xcode versions
# ship different device sets and a CI image bump should not break the job. So:
# take the requested device if it exists, otherwise the newest available
# iPhone. Booting is a no-op if the device is already running.
export SIM_NAME="$SIMULATOR_NAME"
UDID="$(xcrun simctl list devices available -j | python3 -c '
import json, sys, os

preferred = os.environ["SIM_NAME"]
runtimes = json.load(sys.stdin)["devices"]

fallback = None
# Sorting by runtime key descending puts the newest iOS version first.
for runtime, devices in sorted(runtimes.items(), reverse=True):
    if "iOS" not in runtime:
        continue
    for device in devices:
        if not device.get("isAvailable"):
            continue
        if device.get("name") == preferred:
            print(device["udid"])
            sys.exit(0)
        if fallback is None and device.get("name", "").startswith("iPhone"):
            fallback = device

if fallback is None:
    sys.exit(1)

sys.stderr.write(
    "note: \"" + preferred + "\" not available, using " + fallback["name"] + "\n"
)
print(fallback["udid"])
')" || {
    echo "error: no available iOS simulator to run on" >&2
    xcrun simctl list devices available >&2
    exit 1
}

xcrun simctl boot "$UDID" 2>/dev/null || true
xcrun simctl bootstatus "$UDID" -b

echo "==> Installing $APP_ID"
xcrun simctl install "$UDID" "$E2E_APP_PATH"

echo "==> Running Maestro smoke test"
# The credentials are passed as Maestro env vars rather than being written into
# the flows, so nothing secret is committed and CI can supply them from secrets.
#
# `--debug-output` captures the per-command log and view hierarchies, but
# `takeScreenshot` resolves its path against the working directory instead, so
# Maestro is run from the artifacts directory to keep both together. Flow paths
# are absolute because of that, and `runFlow` inside a flow resolves relative
# to the flow file, not the working directory, so the subflows still load.
set +e
( cd "$ARTIFACTS_DIR" && maestro --device "$UDID" test "$REPO_ROOT/.maestro/smoke.yaml" \
    --debug-output "$ARTIFACTS_DIR" \
    -e E2E_EMAIL="$E2E_EMAIL" \
    -e E2E_PASSWORD="$E2E_PASSWORD" )
STATUS=$?
set -e

echo "==> Maestro exited with $STATUS; artifacts in $ARTIFACTS_DIR"
exit $STATUS
