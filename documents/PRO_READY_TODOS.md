# TODO

## Pro Ready
- [ ] Replace the placeholder App Store / Play Store URLs and fallback link before shipping so that “Rate this App” deep links succeed. 【F:app/(tabs)/settings.tsx†L154-L170】
- [ ] Update the privacy policy contact section with the real support email address (the current copy is still marked as a placeholder). 【F:app/privacy-policy.tsx†L155-L160】
- [ ] Remove the seeded test email and password from the login form defaults so production builds never leak test credentials. 【F:app/(auth)/login.tsx†L27-L46】
- [ ] Provide real OAuth client IDs and service IDs (Google & Apple) in Expo config and gate the buttons until configuration is validated at startup. 【F:src/constants/env.ts†L15-L29】【F:src/auth/useOAuthLogin.ts†L30-L122】
- [ ] Add centralized error and crash reporting (e.g. Sentry) instead of only logging to the console when authentication, notification, or storage calls fail. 【F:src/context/auth/AuthContext.tsx†L97-L205】【F:app/_layout.tsx†L105-L110】【F:src/services/notifications/index.ts†L1-L52】
- [ ] Encrypt or otherwise harden local note storage; sensitive therapy notes are currently stored as plain text inside the on-device SQLite database. 【F:src/features/notes/useNotes.ts†L22-L170】
- [ ] Add user-facing confirmation or toast after account deletion so people know the operation succeeded before being redirected. 【F:app/(tabs)/settings.tsx†L24-L80】
- [ ] Validate push-notification permissions and surface fallbacks when `initNotifications` fails instead of silently warning. 【F:app/_layout.tsx†L105-L110】【F:src/services/notifications/index.ts†L1-L52】
- [ ] Surface therapy-session loading and error states in the calendar tab so users don’t interact with stale data. 【F:app/(tabs)/calendar.tsx†L24-L176】【F:src/context/therapy-sessions/TherapySessionsContext.tsx†L18-L83】
- [ ] Populate the reminder science modals with real explanatory copy and vetted resources before shipping. 【F:src/features/reminders/ReminderRow.tsx†L18-L46】【F:src/components/ScienceTextModal.tsx†L11-L30】
- [ ] Track and cancel previously scheduled therapy-session notifications before creating new ones to avoid duplicate reminders. 【F:src/context/therapy-sessions/TherapySessionsContext.tsx†L45-L83】【F:src/features/reminders/add-note-reminder/index.ts†L1-L25】
- [ ] Update the privacy policy copy—or implement encryption—so it accurately reflects how note data is stored. 【F:app/privacy-policy.tsx†L46-L104】【F:src/features/notes/useNotes.ts†L31-L166】
- [ ] Add a Terms of Service screen (and settings link) to cover required legal disclosures. 【F:app/(tabs)/settings.tsx†L64-L96】
