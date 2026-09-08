jest.mock('expo-crypto', () => ({ randomUUID: () => { throw new Error('Native module unavailable'); } }));
jest.mock('../runtime', () => { throw new Error('SDK must not load before consent'); });

test('app can import analytics with unavailable native randomness and no consent without loading SDK', () => {
    const { analytics } = require('../client') as typeof import('../client');
    expect(analytics.getSnapshot().enabled).toBe(false);
    expect(analytics.getVisitId()).toMatch(/^local-/);
});
