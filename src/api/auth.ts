import { BASE_URL } from '../const';
import { readApiError } from './utils';

export type AuthenticatedUser = {
    id: string;
    email: string;
    name: string;
};

export type OAuthProvider = 'google' | 'apple';

export type OAuthPayloadMap = {
    google: {
        idToken: string;
    };
    apple: {
        identityToken: string;
        authorizationCode?: string | null;
        email?: string | null;
        user?: string | null;
        fullName?: Record<string, unknown> | null;
    };
};

export type OAuthExchangeSuccess = {
    token: string;
    user: AuthenticatedUser;
};

export async function requestPasswordReset(email: string): Promise<void> {
    const response = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
    });

    if (!response.ok) {
        throw new Error(await readApiError(response));
    }
}

export async function resetPassword(token: string, password: string): Promise<void> {
    const response = await fetch(`${BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim(), password }),
    });

    if (!response.ok) {
        throw new Error(await readApiError(response));
    }
}

export async function exchangeOAuthToken<P extends OAuthProvider>(
    provider: P,
    payload: OAuthPayloadMap[P],
): Promise<OAuthExchangeSuccess> {
    const response = await fetch(`${BASE_URL}/api/auth/oauth/${provider}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        throw new Error(await readApiError(response));
    }

    return (await response.json()) as OAuthExchangeSuccess;
}
