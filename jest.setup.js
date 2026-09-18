require('@testing-library/jest-native/extend-expect');

// AsyncStorage is a native module, so anything that reaches it (the reminder
// schedule cache) fails to even import under Jest without this. Registered
// globally rather than per suite: the cache sits behind the therapy-sessions
// context, so suites pull it in without naming it.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

// Same reasoning: the reminder schedule is fetched behind the therapy-sessions
// context, so any suite that renders the provider issues a request without
// naming it. Unmocked, that is a real fetch to the placeholder API URL whose
// rejection lands after the suite has finished, which fails the run under --ci
// with "Cannot log after tests are done" even though every test passed.
// Suites that care about the schedule mock this module themselves.
jest.mock('./src/api/reminders', () => ({
  getReminders: jest.fn(async () => ({
    timeZone: 'UTC',
    morningReminderMinutes: 420,
    eveningReminderMinutes: 1200,
    reminders: [],
  })),
}));

process.env.EXPO_PUBLIC_API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://example.com/api';
process.env.EXPO_PUBLIC_APPLE_SERVICE_ID = process.env.EXPO_PUBLIC_APPLE_SERVICE_ID ?? 'com.example.service';
process.env.EXPO_PUBLIC_APPLE_REDIRECT_URI = process.env.EXPO_PUBLIC_APPLE_REDIRECT_URI ?? 'https://example.com/auth/callback';
process.env.EXPO_PUBLIC_APP_STORE_URL = process.env.EXPO_PUBLIC_APP_STORE_URL ?? 'https://apps.apple.com/app/id123456789';
process.env.EXPO_PUBLIC_PLAY_STORE_URL = process.env.EXPO_PUBLIC_PLAY_STORE_URL ?? 'https://play.google.com/store/apps/details?id=com.example.app';
process.env.EXPO_PUBLIC_WEB_STORE_URL = process.env.EXPO_PUBLIC_WEB_STORE_URL ?? 'https://example.com/download';

jest.mock(
  '@sentry/react-native',
  () => {
    const createScopeMock = () => ({
      setTag: jest.fn(),
      setContext: jest.fn(),
      setExtra: jest.fn(),
      setExtras: jest.fn(),
      setUser: jest.fn(),
      setTags: jest.fn(),
      setFingerprint: jest.fn(),
    });

    const noop = jest.fn();
    const sharedScope = createScopeMock();

    const withScope = (callback) => {
      if (typeof callback === 'function') {
        callback(createScopeMock());
      }
    };

    const withActiveSpan = (_options, callback) => {
      if (typeof callback === 'function') {
        return callback();
      }

      return undefined;
    };

    return {
      init: noop,
      configureScope: noop,
      withScope,
      addBreadcrumb: noop,
      addIntegration: noop,
      captureException: noop,
      captureEvent: jest.fn(),
      captureFeedback: noop,
      captureMessage: noop,
      setContext: noop,
      setExtra: noop,
      setExtras: noop,
      setTag: noop,
      setTags: noop,
      setUser: noop,
      startInactiveSpan: noop,
      startSpan: noop,
      startSpanManual: noop,
      getActiveSpan: noop,
      getRootSpan: noop,
      withActiveSpan,
      suppressTracing: noop,
      spanToJSON: noop,
      spanIsSampled: () => false,
      setMeasurement: noop,
      getCurrentScope: () => sharedScope,
      getGlobalScope: () => sharedScope,
      getIsolationScope: () => sharedScope,
      getClient: noop,
      setCurrentClient: noop,
      addEventProcessor: noop,
      metrics: {},
      lastEventId: () => null,
      Hub: function Hub() {},
      Scope: function Scope() {},
    };
  },
  { virtual: true },
);

// OnboardingScreen reads the safe-area insets to pin artwork to the physical
// bottom edge. The real hook throws without a provider, which no test should
// have to arrange, so use the library's own mock (insets all zero).
jest.mock('react-native-safe-area-context', () =>
    require('react-native-safe-area-context/jest/mock').default);

// A fixed device locale, so no assertion depends on the machine running it.
//
// `formattingLocale()` composes the app's language with the device's region,
// and the only place that knows the region is expo-localization. Left
// unmocked it reports nothing under Jest, so the region is dropped and dates
// format as "Mon, Sep 14" rather than "Mon 14 Sep". Before that composition
// existed the region came from Node's own ICU default, which is the developer's
// machine: the onboarding-account suite asserted UK date order and passed here
// only because this laptop is set to en-GB. It would have failed on a US one.
jest.mock('expo-localization', () => ({
    getLocales: () => [{
        languageTag: 'en-GB',
        languageCode: 'en',
        regionCode: 'GB',
        textDirection: 'ltr',
    }],
    getCalendars: () => [{ timeZone: 'Europe/London', calendar: 'gregory' }],
}));

// i18next is initialised at import time, and in the app that happens through
// app/_layout.tsx before any screen mounts. A component test renders a single
// component with no root layout above it, so without this the instance never
// exists and react-i18next's useTranslation returns the key itself: an
// assertion on "Back" fails against the string "action.back".
require('./src/i18n');
