require('@testing-library/jest-native/extend-expect');

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
      captureEvent: noop,
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
