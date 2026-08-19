# Therapy App Frontend

React Native + Expo client for scheduling sessions and delivering reminders.

## Prerequisites

- Node 18+ (Expo SDK 54 and Jest require modern Node)
- `yarn` or `npm`
- Watchman on macOS for fast file watching

## Getting Started

```bash
git clone <repo-url>
cd therapy-app-frontend
yarn install # or npm install
```

Run the development server:

```bash
yarn start
```

Use the Expo CLI prompt to launch iOS, Android, or web targets.

## Testing

```bash
yarn test
```

Upgrade Node if Jest exits with optional-chaining syntax errors.

### End-to-end

A Maestro smoke test drives the real app on an iOS simulator against the
staging backend, and runs on every pull request. See
[docs/E2E_TESTING.md](docs/E2E_TESTING.md) for the required CI secrets, how to
run it locally, and how it cleans up after itself.

```bash
EXPO_PUBLIC_API_URL=https://staging.plastic-brains.com yarn e2e:build:ios
yarn e2e:run:ios   # needs E2E_APP_PATH, E2E_EMAIL, E2E_PASSWORD
```

## Routes

- Expo Router maps everything in `app/`.
- Tabs are in `app/(tabs)/` (calendar, settings, etc.).
- Onboarding flow is under `app/(onboarding)/`.
- Standalone screens such as `forgot-password.tsx`, `privacy-policy.tsx`, and guides sit at the top of `app/`.

## API Layer

- `src/api/client.ts` centralizes fetch configuration, auth headers, retries, and error parsing.
- Helper wrappers (`apiGet`, `apiPost`, etc.) share base URL and timeout defaults from `src/constants/env.ts`.
- Feature-specific endpoints are grouped per domain (e.g. `src/api/users.ts`, reminder utilities under `src/features/reminders/`).

## Project Notes

- Environment config is split between `app.json` and `src/constants/env.ts`.

## Infra

### Local dev

npx expo start
192.168.0.241:3000
Local MongoDB

### Staging

eas build --profile staging
staging.plastic-brains.com

Staging MongoDB

### Production

eas build --profile production
www.plastic-brains.com
Production MongoDB
