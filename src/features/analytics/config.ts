import Constants from 'expo-constants';
import { Platform } from 'react-native';

export const CONSENT_KEY = 'plastic_brains.analytics_consent.v1';
export const SDK_STORAGE_KEY = 'plastic_brains.analytics_sdk.v1';
export type AnalyticsConfig = {
    apiKey: string;
    host: string;
    allowed: boolean;
    appVersion: string;
    platform: 'ios' | 'android' | 'web' | 'other';
};

export function analyticsConfig(): AnalyticsConfig {
    const configuredHost: unknown = process.env.EXPO_PUBLIC_POSTHOG_HOST;
    const configuredKey: unknown = process.env.EXPO_PUBLIC_POSTHOG_KEY;
    const host = typeof configuredHost === 'string' ? configuredHost : '';
    const apiKey = typeof configuredKey === 'string' ? configuredKey : '';
    const allowedHost = host === 'https://eu.i.posthog.com' || host === 'https://us.i.posthog.com';
    return {
        apiKey,
        host,
        allowed: Boolean(apiKey && allowedHost)
            && !__DEV__
            && process.env.EXPO_PUBLIC_ANALYTICS_INTERNAL_USER !== 'true'
            && process.env.EXPO_PUBLIC_SEED_DEMO !== '1'
            && process.env.EXPO_PUBLIC_DEV_SUBSCRIPTION_FIXTURE !== '1',
        appVersion: Constants.expoConfig?.version ?? 'unknown',
        platform: Platform.OS === 'ios' || Platform.OS === 'android' || Platform.OS === 'web' ? Platform.OS : 'other',
    };
}
