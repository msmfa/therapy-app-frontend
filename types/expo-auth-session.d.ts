declare module 'expo-auth-session' {
    export interface MakeRedirectUriOptions {
        native?: string;
        useProxy?: boolean;
        scheme?: string;
        preferLocalhost?: boolean;
    }

    export function makeRedirectUri(options?: MakeRedirectUriOptions): string;

    export interface AuthRequestPromptOptions {
        useProxy?: boolean;
        showInRecents?: boolean;
    }
}

declare module 'expo-auth-session/providers/google' {
    import type { AuthRequestPromptOptions } from 'expo-auth-session';

    export interface AuthSessionResult {
        type: 'success' | 'cancel' | 'dismiss' | 'locked' | 'error';
        errorCode?: string;
        error?: string;
        params?: Record<string, string>;
        authentication?: {
            accessToken?: string;
            tokenType?: string;
            idToken?: string;
            refreshToken?: string | null;
            expiresIn?: number;
            issuedAt?: number;
            scope?: string;
        } | null;
        url?: string;
    }

    export interface AuthRequest {
        state?: string;
        codeVerifier?: string;
        url?: string;
        shouldAutoAuth?: boolean;
    }

    export interface GoogleIdTokenAuthRequestConfig {
        clientId: string;
        iosClientId?: string;
        androidClientId?: string;
        webClientId?: string;
        expoClientId?: string;
        redirectUri?: string;
        extraParams?: Record<string, string>;
        prompt?: string;
    }

    export function useIdTokenAuthRequest(
        config: GoogleIdTokenAuthRequestConfig,
    ): [AuthRequest | null, AuthSessionResult | null, (options?: AuthRequestPromptOptions) => Promise<AuthSessionResult>];
}
