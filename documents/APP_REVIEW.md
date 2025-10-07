# App Review Notes

## UI / UX gaps
- **Notes tab shows empty state while data is still loading or if load fails.** The screen immediately renders the empty placeholder whenever the local array is empty, even when `useNotes` is still hydrating or has set an error. There is no way for the `error` returned by the hook to surface to the UI, so users just see an empty list after a failure. 【F:app/(tabs)/notes.tsx†L26-L40】【F:src/features/notes/useNotes.ts†L55-L123】
- **Note list lacks visible error feedback.** `useNotes` records error messages, but the list screen never renders them (e.g. toast/banner), so recoverable failures are silent. 【F:src/features/notes/useNotes.ts†L55-L123】
- **New note composer does not show progress or success confirmation.** Submitting a note reuses `addNote` but there is no loading affordance and failure just sets a small inline error, which is easy to miss under the large text area. Consider showing a toast or disabling the field until the write succeeds. 【F:app/(tabs)/index.tsx†L17-L66】
- **Settings screen hard-blocks while user data hydrates.** If the auth context has not hydrated yet, the tab just shows a blocking loader instead of a skeleton or redirect, which feels broken during slow starts. 【F:app/(tabs)/settings.tsx†L16-L22】
- **Calendar tab ignores loading/error states.** `useTherapySessions` exposes `loading` and `error`, but the calendar screen only consumes the raw session list, so the user never sees a spinner or failure message and just stares at stale data. 【F:app/(tabs)/calendar.tsx†L24-L176】【F:src/context/therapy-sessions/TherapySessionsContext.tsx†L18-L83】
- **“Learn more” modals ship empty.** Tapping the reminder rows opens a modal that only renders the heading text with no descriptive copy or outbound links, so the call-to-action currently feels broken. 【F:src/features/reminders/ReminderRow.tsx†L18-L48】【F:src/components/ScienceTextModal.tsx†L11-L30】
- **Global error boundary offers no recovery affordance.** Crashes surface as unstyled body text with a tappable “Try Again?” string, which is easy to miss and fails accessibility expectations for a production blocker screen. 【F:src/components/ErrorBoundary.tsx†L6-L22】

## Navigation & links
- **“Rate this App” uses placeholder store deep links.** The iOS, Android, and default URLs are dummy values and will 404 in production. 【F:app/(tabs)/settings.tsx†L154-L170】
- **Privacy policy contact information still references a placeholder email.** The inline comment explicitly marks it as temporary. 【F:app/privacy-policy.tsx†L155-L160】

## Notifications & reminders
- **Therapy session reminders stack up on every refresh.** Each hydration pass reschedules all post-session notifications without cancelling previously scheduled ones, so users can receive duplicate pings for the same session. 【F:src/context/therapy-sessions/TherapySessionsContext.tsx†L45-L83】【F:src/features/reminders/add-note-reminder/index.ts†L1-L25】
- **Failed notification setup is silent.** `initNotifications` throws when permissions are missing, but the initializer just logs a warning—there’s no UI telling users why reminder features stopped working. 【F:app/_layout.tsx†L105-L113】【F:src/services/notifications/index.ts†L1-L52】

## Content & state coverage gaps
- **Authentication forms ship with test credentials pre-filled.** The login form defaults to `test@example.com` / `Passw0rd!`, which is confusing for users and unsafe for release builds. 【F:app/(auth)/login.tsx†L27-L46】
- **OAuth buttons surface configuration issues only at runtime.** Google sign-in remains tappable until after the config check completes, and when IDs are missing the helper text is subtle. Consider gating the whole section behind a clearer setup state. 【F:src/auth/useOAuthLogin.ts†L30-L122】【F:src/components/auth/SocialAuthButtons.tsx†L17-L54】
- **Settings lacks confirmation/feedback after destructive actions.** Account deletion kicks the user back to the login gate with no confirmation or undo, and errors only appear in alerts; consider a dedicated success state and progress indicator. 【F:app/(tabs)/settings.tsx†L24-L80】
- **Privacy copy over-promises storage security.** The policy claims notes are kept in “encrypted secure storage,” but the implementation writes plain text entries into an on-device SQLite table, which is misleading until encryption ships. 【F:app/privacy-policy.tsx†L46-L104】【F:src/features/notes/useNotes.ts†L31-L166】
- **No Terms of Service entry point.** The settings screen only links to privacy, rate, and account options; there’s no obvious route to legal terms that app stores require. 【F:app/(tabs)/settings.tsx†L64-L96】
