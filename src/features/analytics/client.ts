import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { analyticsConfig } from './config';
import { createAnalytics } from './core';
import { clearAnalyticsStorage } from './storage';

const config = analyticsConfig();
let localSequence = 0;
const localVisitId = () => {
    try { return Crypto.randomUUID(); } catch {
        // This token stays on device; analytics must not break app startup if
        // the native randomness module is unavailable.
        return `local-${Date.now()}-${++localSequence}-${Math.random().toString(36).slice(2)}`;
    }
};
export const analytics = createAnalytics({
    config,
    storage: AsyncStorage,
    createTransport: (maySend, identity, isCurrent) => {
        const { createPostHogTransport } = require('./runtime') as typeof import('./runtime');
        return createPostHogTransport(config, maySend, identity, isCurrent);
    },
    clearTransportStorage: clearAnalyticsStorage,
    now: Date.now,
    newId: localVisitId,
});
export type { AnalyticsOperation, AnalyticsSnapshot } from './core';
