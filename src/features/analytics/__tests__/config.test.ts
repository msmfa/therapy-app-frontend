import { analyticsConfig } from '../config';
const originalDev = __DEV__;
const keys = ['EXPO_PUBLIC_POSTHOG_HOST', 'EXPO_PUBLIC_POSTHOG_KEY', 'EXPO_PUBLIC_ANALYTICS_ENVIRONMENT', 'EXPO_PUBLIC_ANALYTICS_INTERNAL_USER', 'EXPO_PUBLIC_SEED_DEMO', 'EXPO_PUBLIC_DEV_SUBSCRIPTION_FIXTURE'] as const;
const originals = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
beforeEach(() => {
    Object.assign(global, { __DEV__: false });
    keys.forEach((key) => { delete process.env[key]; });
    process.env.EXPO_PUBLIC_POSTHOG_KEY = 'phc_test';
    process.env.EXPO_PUBLIC_POSTHOG_HOST = 'https://eu.i.posthog.com';
});
afterAll(() => {
    Object.assign(global, { __DEV__: originalDev });
    keys.forEach((key) => { if (originals[key] === undefined) delete process.env[key]; else process.env[key] = originals[key]; });
});
test('release capture requires a project key and an explicit regional ingestion host', () => {
    expect(analyticsConfig().allowed).toBe(true);
    delete process.env.EXPO_PUBLIC_POSTHOG_KEY;
    expect(analyticsConfig().allowed).toBe(false);
    process.env.EXPO_PUBLIC_POSTHOG_KEY = 'phc_test';
    delete process.env.EXPO_PUBLIC_POSTHOG_HOST;
    expect(analyticsConfig().allowed).toBe(false);
    process.env.EXPO_PUBLIC_POSTHOG_HOST = 'https://arbitrary.example';
    expect(analyticsConfig().allowed).toBe(false);
});
test.each([
    ['EXPO_PUBLIC_ANALYTICS_INTERNAL_USER', 'true'],
    ['EXPO_PUBLIC_SEED_DEMO', '1'],
    ['EXPO_PUBLIC_DEV_SUBSCRIPTION_FIXTURE', '1'],
])('disables %s builds despite valid project config', (flag, value) => {
    process.env[flag] = value;
    expect(analyticsConfig().allowed).toBe(false);
});
test('development never sends analytics', () => {
    Object.assign(global, { __DEV__: true });
    expect(analyticsConfig().allowed).toBe(false);
});

test('explicit QA releases have separate storage and a non-production event label', () => {
    expect(analyticsConfig().environment).toBe('production');
    process.env.EXPO_PUBLIC_ANALYTICS_ENVIRONMENT = 'qa';
    expect(analyticsConfig()).toMatchObject({ environment: 'qa', allowed: true });
    jest.isolateModules(() => {
        const qa = require('../config');
        expect(qa.CONSENT_KEY).toBe('plastic_brains.analytics_consent.v1.qa');
        expect(qa.SDK_STORAGE_KEY).toBe('plastic_brains.analytics_sdk.v1.qa');
    });
    Object.assign(global, { __DEV__: true });
    expect(analyticsConfig().allowed).toBe(false);
});

test('production storage remains separate from QA storage', () => {
    jest.isolateModules(() => {
        const production = require('../config');
        expect(production.CONSENT_KEY).toBe('plastic_brains.analytics_consent.v1');
        expect(production.SDK_STORAGE_KEY).toBe('plastic_brains.analytics_sdk.v1');
    });
    process.env.EXPO_PUBLIC_ANALYTICS_ENVIRONMENT = 'qa';
    jest.isolateModules(() => {
        const qa = require('../config');
        expect(qa.CONSENT_KEY).toBe('plastic_brains.analytics_consent.v1.qa');
        expect(qa.SDK_STORAGE_KEY).toBe('plastic_brains.analytics_sdk.v1.qa');
    });
});
