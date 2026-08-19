#!/usr/bin/env bash
#
# Builds a simulator .app for the Maestro smoke test.
#
# `ios/` is gitignored (Expo continuous native generation), so the native
# project is generated first and then built with xcodebuild. The result is a
# self-contained Release build with the JS bundle baked in, which means Maestro
# does not need Metro running and the run is not sensitive to a dev server
# dropping out mid-flow.
#
# The API URL is inlined into the bundle at build time by Expo, so the same
# binary is permanently pointed at whichever backend was configured here. That
# is why the URL is validated before anything is compiled.
#
# Usage:
#   EXPO_PUBLIC_API_URL=https://staging.plastic-brains.com scripts/e2e/build-ios-sim.sh
#
# Writes the built app path to stdout on the last line, and to $GITHUB_OUTPUT
# as `app_path` when running in GitHub Actions.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"

: "${EXPO_PUBLIC_API_URL:?EXPO_PUBLIC_API_URL must be set (the staging backend URL)}"

# Refuse to bake production into an E2E build. This mirrors the guard in
# staging-api.mjs; a test build must never be able to talk to real user data.
case "$EXPO_PUBLIC_API_URL" in
    *//plastic-brains.com*|*//www.plastic-brains.com*)
        echo "error: refusing to build an E2E app against production ($EXPO_PUBLIC_API_URL)" >&2
        exit 1
        ;;
esac

CONFIGURATION="${E2E_BUILD_CONFIGURATION:-Release}"
DERIVED_DATA="${E2E_DERIVED_DATA:-$REPO_ROOT/build/e2e-derived-data}"

# Regenerating the native project and reinstalling pods takes several minutes
# and is only needed when native config changes. E2E_SKIP_PREBUILD=1 reuses an
# existing ios/ directory, which makes local iteration on the flows bearable.
# CI always does the full generation, since it starts from a clean checkout.
if [ "${E2E_SKIP_PREBUILD:-0}" = "1" ] && [ -d ios ]; then
    echo "==> Reusing the existing ios/ project (E2E_SKIP_PREBUILD=1)"
else
    echo "==> Generating the native iOS project"
    # --no-install: pods are installed explicitly below so a failure there is
    # distinguishable from a prebuild failure.
    npx expo prebuild --platform ios --clean --no-install

    echo "==> Installing pods"
    ( cd ios && pod install )
fi

WORKSPACE="$(find ios -maxdepth 1 -name '*.xcworkspace' -print -quit)"
if [ -z "$WORKSPACE" ]; then
    echo "error: no .xcworkspace found under ios/ after prebuild" >&2
    exit 1
fi

# The scheme name is derived from the Expo app name, so read it rather than
# hard-coding it: renaming the app in app.json should not break the build.
#
# The workspace lists a scheme for every CocoaPods dependency as well, and they
# sort ahead of the app's own scheme, so picking the first one builds a pod
# library and produces no .app. The app scheme is the one matching the
# workspace filename.
export WORKSPACE_NAME="$(basename "$WORKSPACE" .xcworkspace)"
SCHEME="$(xcodebuild -list -json -workspace "$WORKSPACE" | python3 -c '
import json, os, sys

expected = os.environ["WORKSPACE_NAME"]
schemes = json.load(sys.stdin)["workspace"]["schemes"]

if expected in schemes:
    print(expected)
    sys.exit(0)

available = ", ".join(schemes)
sys.stderr.write("error: no scheme named " + repr(expected) + " in the workspace.\n")
sys.stderr.write("available: " + available + "\n")
sys.exit(1)
')"

echo "==> Building $SCHEME ($CONFIGURATION) for the simulator"
echo "    workspace: $WORKSPACE"
echo "    api url:   $EXPO_PUBLIC_API_URL"

# SENTRY_DISABLE_AUTO_UPLOAD keeps the Release build from trying to upload
# source maps, which needs a token CI does not have and is meaningless for a
# throwaway simulator binary.
#
# Signing: ad hoc (CODE_SIGN_IDENTITY="-"), not disabled. Turning signing off
# entirely leaves the app with only a linker-generated signature and *no
# embedded entitlements*, and iOS then refuses every Keychain call with
# "A required entitlement isn't present." That breaks expo-secure-store, which
# is where the auth tokens and the note encryption key live, so notes could
# never be saved and the smoke test could never pass. Ad hoc signing embeds
# PlasticBrains.entitlements and needs no Apple account or provisioning
# profile, so CI still requires no Apple credentials.
SENTRY_DISABLE_AUTO_UPLOAD=true \
xcodebuild \
    -workspace "$WORKSPACE" \
    -scheme "$SCHEME" \
    -configuration "$CONFIGURATION" \
    -sdk iphonesimulator \
    -destination 'generic/platform=iOS Simulator' \
    -derivedDataPath "$DERIVED_DATA" \
    CODE_SIGNING_ALLOWED=YES \
    CODE_SIGNING_REQUIRED=NO \
    CODE_SIGN_IDENTITY="-" \
    CODE_SIGN_STYLE=Manual \
    DEVELOPMENT_TEAM="" \
    PROVISIONING_PROFILE_SPECIFIER="" \
    build \
    | (xcpretty 2>/dev/null || cat)

APP_PATH="$(find "$DERIVED_DATA/Build/Products/$CONFIGURATION-iphonesimulator" -maxdepth 1 -name '*.app' -print -quit)"
if [ -z "$APP_PATH" ]; then
    echo "error: build succeeded but no .app was produced" >&2
    exit 1
fi

if [ -n "${GITHUB_OUTPUT:-}" ]; then
    echo "app_path=$APP_PATH" >> "$GITHUB_OUTPUT"
fi

echo "==> Built $APP_PATH"
echo "$APP_PATH"
