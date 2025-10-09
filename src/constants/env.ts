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

export const BASE_URL = (process.env.EXPO_PUBLIC_API_URL as string) ?? 'http://localhost:3000';

const normalizeEndpointBase = (input?: string | null): string | null => {
    if (!input) {
        return null;
    }

    const trimmed = input.trim();
    if (!trimmed) {
        return null;
    }

    if (trimmed.startsWith('http')) {
        return trimmed.replace(/\/+$/, '');
    }

    const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    const normalized = withLeadingSlash.replace(/\/+$/, '');
    return normalized || '/';
};

const FALLBACK_OAUTH_BASE_PATHS = [
    process.env.EXPO_PUBLIC_OAUTH_ENDPOINT as string | undefined,
    '/api/auth/oauth',
    '/auth/oauth',
    '/auth/oauth2',
    '/oauth',
    '/auth',
];

const oauthBaseSet = new Set<string>();
for (const base of FALLBACK_OAUTH_BASE_PATHS) {
    const normalized = normalizeEndpointBase(base);
    if (normalized) {
        oauthBaseSet.add(normalized);
    }
}

if (oauthBaseSet.size === 0) {
    oauthBaseSet.add('/api/auth/oauth');
}

export const OAUTH_ENDPOINT_CANDIDATES = Array.from(oauthBaseSet);

export const GOOGLE_CLIENT_IDS = {
    expo: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID as string | undefined,
    ios: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID as string | undefined,
    android: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID as string | undefined,
    web: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID as string | undefined,
} as const;

export const APPLE_SERVICE_ID = process.env.EXPO_PUBLIC_APPLE_SERVICE_ID as string | undefined;
export const APPLE_REDIRECT_URI =
    process.env.EXPO_PUBLIC_APPLE_REDIRECT_URI as string | undefined;

export const STORE_URLS = {
    ios: requireEnv('EXPO_PUBLIC_APP_STORE_URL'),
    android: requireEnv('EXPO_PUBLIC_PLAY_STORE_URL'),
    web: process.env.EXPO_PUBLIC_WEB_STORE_URL ?? '',
} as const;
