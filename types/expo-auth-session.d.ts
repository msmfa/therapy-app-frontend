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
