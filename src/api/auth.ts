import { OAUTH_ENDPOINT_CANDIDATES } from '../constants/env';
import { apiPost, ApiError } from './client';

export type AuthenticatedUser = {
    id: string;
    email: string;
    name: string;
};

export type OAuthProvider = 'apple';

export interface OAuthPayloadMap {
  apple: {
    idToken: string;
    authorizationCode?: string;
  };
}

export type OAuthExchangeSuccess = {
    token: string;
    user: AuthenticatedUser;
    refreshToken?: string | null;
};

export async function requestPasswordReset(email: string): Promise<string> {
    const response = await apiPost<{ message: string }>(
        '/api/auth/forgot-password',
        { email: email.trim() },
        { auth: false },
    );

    if (!response || typeof response.message !== 'string' || response.message.length === 0) {
        throw new Error('Unexpected response from password reset endpoint.');
    }

    return response.message;
}

/**
 * `email` is required by the backend: the 6-digit code is only valid for the
 * account it was issued to, so the reset has to name that account.
 */
export async function resetPassword(
    email: string,
    token: string,
    password: string,
): Promise<void> {
    await apiPost<void>(
        '/api/auth/reset-password',
        { email: email.trim(), token: token.trim(), password },
        { auth: false, parseJson: false },
    );
}

export async function exchangeOAuthToken<P extends OAuthProvider>(
    provider: P,
    payload: OAuthPayloadMap[P],
): Promise<OAuthExchangeSuccess> {
    const candidates = OAUTH_ENDPOINT_CANDIDATES.length > 0
        ? OAUTH_ENDPOINT_CANDIDATES
        : ['/api/auth/oauth'];
    const tried: string[] = [];
    let lastEndpointError: ApiError | null = null;

    for (const base of candidates) {
        const normalizedBase = base.replace(/\/+$/, '');
        const normalizedProvider = String(provider).replace(/^\/+/, '');
        const endpoint = normalizedBase === '' || normalizedBase === '/'
            ? `/${normalizedProvider}`
            : `${normalizedBase}/${normalizedProvider}`;

        tried.push(endpoint);

        try {
            return await apiPost<OAuthExchangeSuccess>(endpoint, payload, {
                auth: false,
            });
        } catch (error) {
            if (error instanceof ApiError && (error.status === 404 || error.status === 405)) {
                lastEndpointError = error;
                continue;
            }

            throw error;
        }
    }

    const message = `OAuth endpoint not found. Tried: ${tried.join(', ')}`;
    if (lastEndpointError) {
        throw new ApiError(lastEndpointError.status, { message });
    }

    throw new ApiError(404, { message });
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
