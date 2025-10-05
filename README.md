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

## Routes

- Expo Router maps everything in `app/`.
- Tabs are in `app/(tabs)/` (calendar, settings, etc.).
- Onboarding flow is under `app/(onboarding)/`.
- Standalone screens such as `forgot-password.tsx`, `privacy-policy.tsx`, and guides sit at the top of `app/`.

## API Layer

- `src/api/client.ts` centralizes fetch configuration, auth headers, retries, and error parsing.
- Helper wrappers (`apiGet`, `apiPost`, etc.) share base URL and timeout defaults from `src/const.ts`.
- Feature-specific endpoints are grouped per domain (e.g. `src/api/users.ts`, reminder utilities under `src/components/reminders/`).

## Project Notes

- Environment config is split between `app.json` and `src/const.ts`.
- In-progress work is tracked in `TODO.md` (gitignored locally).
