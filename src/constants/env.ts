export const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? '';
export const APPLE_SERVICE_ID = process.env.EXPO_PUBLIC_APPLE_SERVICE_ID ?? '';
export const APPLE_REDIRECT_URI = process.env.EXPO_PUBLIC_APPLE_REDIRECT_URI ?? '';

const parseEndpointCandidates = (raw: string | undefined): string[] =>
    raw
        ?.split(',')
        .map(candidate => candidate.trim())
        .filter(candidate => candidate.length > 0) ?? [];

export const OAUTH_ENDPOINT_CANDIDATES = parseEndpointCandidates(process.env.EXPO_PUBLIC_OAUTH_ENDPOINT);

export const STORE_URLS = {
    ios: process.env.EXPO_PUBLIC_APP_STORE_URL ?? '',
    android: process.env.EXPO_PUBLIC_PLAY_STORE_URL ?? '',
    web: process.env.EXPO_PUBLIC_WEB_STORE_URL ?? '',
} as const;
