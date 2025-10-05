export const spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
};

export const radius = {
    sm: 6,
    md: 10,
    lg: 14,
    xl: 20,
};

export const typography = {
    h1: { fontSize: 28, fontWeight: '700' as const },
    h2: { fontSize: 20, fontWeight: '600' as const },
    h3: { fontSize: 16, fontWeight: '600' as const },
    body: { fontSize: 14, fontWeight: '400' as const },
    caption: { fontSize: 12, fontWeight: '500' as const },
    button: { fontSize: 16, fontWeight: '600' as const },
};

export const BASE_URL = (process.env.EXPO_PUBLIC_API_URL as string) ?? 'http://localhost:3000';

export const GOOGLE_CLIENT_IDS = {
    expo: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID as string | undefined,
    ios: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID as string | undefined,
    android: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID as string | undefined,
    web: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID as string | undefined,
} as const;

export const APPLE_SERVICE_ID = process.env.EXPO_PUBLIC_APPLE_SERVICE_ID as string | undefined;
export const APPLE_REDIRECT_URI =
    process.env.EXPO_PUBLIC_APPLE_REDIRECT_URI as string | undefined;

const requireEnv = (name: string): string => {
    const value = process.env[name];
    if (!value) {
        const message = `[config] Missing ${name}. Update your Expo env vars before shipping.`;
        if (process.env.NODE_ENV === 'production') {
            throw new Error(message);
        }
        console.warn(message);
    }
    return value ?? '';
};

export const STORE_URLS = {
    ios: requireEnv('EXPO_PUBLIC_APP_STORE_URL'),
    android: requireEnv('EXPO_PUBLIC_PLAY_STORE_URL'),
    web: process.env.EXPO_PUBLIC_WEB_STORE_URL ?? '',
} as const;
