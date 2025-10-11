const requireEnv = (name: string): string => {
    const value = process.env[name];
    if (!value) {
        const message = `[config] Missing required environment variable: ${name}`;
        if (process.env.NODE_ENV === 'production') {
            throw new Error(message);
        }
        console.error(message);
    }
    return value ?? '';
};

// Check all required environment variables at startup
const checkRequiredEnvVars = () => {
    const required = [
        'EXPO_PUBLIC_API_URL',
        'EXPO_PUBLIC_APPLE_SERVICE_ID',
        'EXPO_PUBLIC_APPLE_REDIRECT_URI',
        'EXPO_PUBLIC_APP_STORE_URL',
        'EXPO_PUBLIC_PLAY_STORE_URL',
        'EXPO_PUBLIC_WEB_STORE_URL',
    ];

    const missing: string[] = [];

    required.forEach((varName) => {
        if (!process.env[varName]) {
            missing.push(varName);
        }
    });

    if (missing.length > 0) {
        const message = `[config] Missing required environment variables:\n${missing.map(v => `  - ${v}`).join('\n')}`;
        if (process.env.NODE_ENV === 'production') {
            throw new Error(message);
        }
        console.error(message);
        console.error('[config] Please create a .env file with all required variables.');
    }
};

// Run validation on module load
checkRequiredEnvVars();

export const BASE_URL = requireEnv('EXPO_PUBLIC_API_URL');

export const APPLE_SERVICE_ID = requireEnv('EXPO_PUBLIC_APPLE_SERVICE_ID');
export const APPLE_REDIRECT_URI = requireEnv('EXPO_PUBLIC_APPLE_REDIRECT_URI');

const parseEndpointCandidates = (raw: string | undefined): string[] =>
    raw
        ?.split(',')
        .map(candidate => candidate.trim())
        .filter(candidate => candidate.length > 0) ?? [];

export const OAUTH_ENDPOINT_CANDIDATES = parseEndpointCandidates(process.env.EXPO_PUBLIC_OAUTH_ENDPOINT);

export const STORE_URLS = {
    ios: requireEnv('EXPO_PUBLIC_APP_STORE_URL'),
    android: requireEnv('EXPO_PUBLIC_PLAY_STORE_URL'),
    web: requireEnv('EXPO_PUBLIC_WEB_STORE_URL'),
} as const;
