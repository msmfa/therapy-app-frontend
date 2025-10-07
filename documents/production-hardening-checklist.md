# Production Hardening Checklist

Use this checklist to reduce the risk of runtime failures when promoting the Expo client to production. Adapt the items based on release scope and business constraints.

## 1. Branch Discipline & CI/CD
- Enforce a protected `main` branch with required checks (lint, unit tests, type check, and build). Use GitHub branch protection rules with required status checks.
- Require pull request reviews with a deployment checklist before merging.
- Automate release builds (EAS Build or Expo Application Services) in CI using reproducible build scripts.

## 2. Automated Quality Gates
- **Static analysis**: Add a `lint` script (e.g., `"lint": "eslint ."`) and run `yarn lint` plus `yarn typecheck` on every PR to catch issues before runtime.
- **Unit tests**: Ensure `yarn test --ci` runs headlessly in CI, collecting coverage to identify risk areas. Add test cases for edge conditions in scheduling flows and reminders.
- **UI / end-to-end tests**: Integrate Detox or Maestro scripts covering onboarding, session booking, notifications opt-in, and calendar synchronization.
- **Bundle validation**: Run `expo export --platform ios,android` (or `eas build --profile preview`) in CI to ensure production bundles compile.

## 3. Release Branch Validation
- Create a release candidate branch. Run full regression testing on physical devices (iOS/Android) and simulators with production config (`EXPO_PUBLIC_API_BASE_URL`).
- Smoke test critical paths with production-like accounts: login, onboarding, scheduling, reminder configuration, and settings updates.
- Verify deep links (`expo-linking`) and push notification handling (`expo-notifications`) in staging.

## 4. Monitoring & Observability
- Confirm Sentry (`@sentry/react-native`) is initialized at app start with release/environment tags. Upload source maps for each build.
- Add logging around API failures in `src/api/client.ts` to surface unexpected error payloads.
- Track client performance metrics (app start time, screen transition durations). Consider Expo App Performance or custom analytics events.

## 5. Configuration & Secrets
- Store secrets in secure config (`expo-constants`, `expo-secure-store`) and use `.env` files managed via Expo Secrets / EAS secrets.
- Validate fallback behavior when config values are missing. Provide defaults in `src/const.ts` and log warnings instead of crashing.
- Review feature flag rollout strategy (e.g., using remote config) to enable staged releases.

## 6. Offline & Error Handling
- Ensure key views render graceful fallback UIs when API calls fail. Add retry/backoff logic in API hooks.
- Test offline flows for reminders and calendar screens. Cache responses with `AsyncStorage` to display last-known data.
- Provide user-visible error boundaries. Wrap tab navigator roots with an error boundary component that offers restart/report actions.

## 7. Performance & Memory
- Audit bundle size using `expo bundle:analyze`. Split large dependencies and lazy-load rarely used screens.
- Profile memory usage on low-end devices. Watch for large image assets or unbounded timers in reminders components.
- Optimize re-renders by memoizing expensive components (calendar, charts) and using FlatList virtualization.

## 8. Security & Compliance
- Implement biometric/secure lock for sensitive data using `expo-local-authentication` or `expo-secure-store`.
- Review data handling against HIPAA/GDPR as applicable. Ensure network requests use HTTPS endpoints and certificate pinning if required.
- Keep dependencies updated via `npx expo install --fix` and Dependabot. Patch vulnerabilities promptly.

## 9. Deployment Runbook
- Document release steps: bump version, update changelog, run automated checks, create signed builds, smoke test, submit to stores.
- Configure staged rollout (e.g., phased release on App Store / Play Store) and monitor crash analytics before 100% rollout.
- Maintain rollback plan (previous binary, feature flags, hotfix branch).

## 10. Post-Release Verification
- Monitor Sentry, Expo Updates, and store reviews for 48 hours post-release.
- Schedule a post-release review to capture incidents, update runbooks, and assign follow-up tasks.

Keep this checklist in the repository and evolve it alongside the codebase. Regularly audit the list to reflect new features and dependencies.
