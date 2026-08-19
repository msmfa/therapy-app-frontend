/**
 * Stable element identifiers for end-to-end tests.
 *
 * These are a contract with the Maestro flows in `.maestro/`, which reference
 * the same literal strings. Renaming a value here breaks a flow, so treat them
 * the same way you would a public API: add freely, rename deliberately.
 *
 * Keep the values kebab-case and scoped by screen so a failing selector points
 * at the screen it came from.
 */
export const TEST_IDS = {
    auth: {
        loginScreen: 'login-screen',
        loginEmail: 'login-email',
        loginPassword: 'login-password',
        loginSubmit: 'login-submit',
        loginForgotPassword: 'login-forgot-password',
        loginSignupLink: 'login-signup-link',
        signupScreen: 'signup-screen',
        signupName: 'signup-name',
        signupEmail: 'signup-email',
        signupPassword: 'signup-password',
        signupSubmit: 'signup-submit',
    },
    onboarding: {
        welcomeScreen: 'onboarding-welcome-screen',
        welcomeGetStarted: 'onboarding-get-started',
        sessionsScreen: 'onboarding-sessions-screen',
        sessionsAdd: 'onboarding-sessions-add',
        sessionsClear: 'onboarding-sessions-clear',
        scheduleModal: 'schedule-modal',
        scheduleModeWeekly: 'schedule-mode-weekly',
        scheduleModeSingle: 'schedule-mode-single',
        scheduleConfirm: 'schedule-confirm',
        scheduleDelete: 'schedule-delete',
        loadingScreen: 'onboarding-loading-screen',
        remindersScreen: 'onboarding-reminders-screen',
        remindersNext: 'onboarding-reminders-next',
        remindersBack: 'onboarding-reminders-back',
        notificationsScreen: 'onboarding-notifications-screen',
        notificationsEnable: 'onboarding-notifications-enable',
        notificationsMaybeLater: 'onboarding-notifications-maybe-later',
        successScreen: 'onboarding-success-screen',
        successNext: 'onboarding-success-next',
    },
    tabs: {
        newNote: 'tab-new-note',
        calendar: 'tab-calendar',
        notes: 'tab-notes',
        settings: 'tab-settings',
    },
    newNote: {
        screen: 'new-note-screen',
        input: 'new-note-input',
        submit: 'new-note-submit',
    },
    notes: {
        screen: 'notes-screen',
        list: 'notes-list',
        emptyScreen: 'notes-empty-screen',
        /** Per-row id; index 0 is the most recent note. */
        card: (index: number): string => `note-card-${index}`,
        cardPrefix: 'note-card-',
        previewModal: 'note-preview-modal',
        previewText: 'note-preview-text',
        previewClose: 'note-preview-close',
        previewDelete: 'note-preview-delete',
    },
    calendar: {
        screen: 'calendar-screen',
        /**
         * Root id handed to react-native-calendars, which derives a per-day id
         * of `${root}.day_${YYYY-MM-DD}` for every rendered cell.
         */
        root: 'therapy-calendar',
        day: (isoDate: string): string => `therapy-calendar.day_${isoDate}`,
    },
    settings: {
        screen: 'settings-screen',
        logout: 'settings-logout',
        deleteAccount: 'settings-delete-account',
        privacyPolicy: 'settings-privacy-policy',
        termsOfService: 'settings-terms-of-service',
        rateApp: 'settings-rate-app',
    },
    alert: {
        container: 'app-alert',
        primaryAction: 'app-alert-primary-action',
        dismiss: 'app-alert-dismiss',
    },
} as const;
