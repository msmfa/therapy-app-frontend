import { apiPost } from './client';

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
    refreshToken?: string | null;
};

export async function requestPasswordReset(email: string): Promise<void> {
    await apiPost<void>(
        '/api/auth/forgot-password',
        { email: email.trim() },
        { auth: false, parseJson: false },
    );
}

export async function resetPassword(token: string, password: string): Promise<void> {
    await apiPost<void>(
        '/api/auth/reset-password',
        { token: token.trim(), password },
        { auth: false, parseJson: false },
    );
}

export async function exchangeOAuthToken<P extends OAuthProvider>(
    provider: P,
    payload: OAuthPayloadMap[P],
): Promise<OAuthExchangeSuccess> {
    return apiPost<OAuthExchangeSuccess>(`/api/auth/oauth/${provider}`, payload, {
        auth: false,
    });
}

export type RefreshAuthResponse = {
    token: string;
    refreshToken?: string | null;
    user?: AuthenticatedUser | null;
};

export const refreshAuthToken = async (refreshToken: string): Promise<RefreshAuthResponse> =>
    apiPost<RefreshAuthResponse>(
        '/api/auth/refresh',
        { refreshToken },
        { auth: false },
    );

export type LoginResponse = {
    token: string;
    refreshToken?: string | null;
    user: AuthenticatedUser;
};

export const loginWithPassword = async (email: string, password: string): Promise<LoginResponse> =>
    apiPost<LoginResponse>(
        '/api/auth/login',
        { email: email.trim(), password },
        { auth: false },
    );

export type RegisterPayload = {
    name: string;
    email: string;
    password: string;
};

export const registerAccount = async (payload: RegisterPayload): Promise<LoginResponse> =>
    apiPost<LoginResponse>(
        '/api/auth/register',
        {
            name: payload.name.trim(),
            email: payload.email.trim().toLowerCase(),
            password: payload.password,
        },
        { auth: false },
    );
