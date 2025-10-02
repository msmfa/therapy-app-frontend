import { useCallback, useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

import { useAuth } from './AuthContext';
import {
    APPLE_REDIRECT_URI,
    APPLE_SERVICE_ID,
    BASE_URL,
    GOOGLE_CLIENT_IDS,
} from '../const';
import { handleError } from '../utils/utils';

WebBrowser.maybeCompleteAuthSession();

type OAuthProvider = 'google' | 'apple';

interface UseOAuthLoginResult {
    appleAvailable: boolean;
    googleConfigured: boolean;
    loadingProvider: OAuthProvider | null;
    signInWithGoogle: () => Promise<void>;
    signInWithApple: () => Promise<void>;
}

const DUMMY_GOOGLE_CLIENT_ID = 'DUMMY_GOOGLE_CLIENT_ID';

export const useOAuthLogin = (onSuccess?: () => void): UseOAuthLoginResult => {
    const { setAuth } = useAuth();

    const [appleAvailable, setAppleAvailable] = useState(false);
    const [loadingProvider, setLoadingProvider] = useState<OAuthProvider | null>(null);

    useEffect(() => {
        AppleAuthentication.isAvailableAsync()
            .then(setAppleAvailable)
            .catch(() => setAppleAvailable(false));
    }, []);

    const resolvedGoogleClientId =
        GOOGLE_CLIENT_IDS.expo ??
        GOOGLE_CLIENT_IDS.web ??
        GOOGLE_CLIENT_IDS.ios ??
        GOOGLE_CLIENT_IDS.android;

    const googleConfigured = Boolean(resolvedGoogleClientId);

    const [googleRequest, googleResponse, promptGoogle] = Google.useIdTokenAuthRequest({
        clientId: resolvedGoogleClientId ?? DUMMY_GOOGLE_CLIENT_ID,
        iosClientId: GOOGLE_CLIENT_IDS.ios,
        androidClientId: GOOGLE_CLIENT_IDS.android,
        expoClientId: GOOGLE_CLIENT_IDS.expo,
        webClientId: GOOGLE_CLIENT_IDS.web,
        extraParams: { prompt: 'select_account' },
    });

    const exchangeToken = useCallback(
        async (provider: OAuthProvider, payload: Record<string, unknown>) => {
            try {
                const response = await fetch(`${BASE_URL}/api/auth/oauth/${provider}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });

                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data?.error ?? data?.message ?? 'Unable to authenticate');
                }

                await setAuth(data.token, data.user);
                onSuccess?.();
            } catch (error) {
                Alert.alert('Authentication failed', handleError(error));
            } finally {
                setLoadingProvider(null);
            }
        },
        [onSuccess, setAuth],
    );

    useEffect(() => {
        if (!googleResponse) return;

        if (googleResponse.type === 'success') {
            const idToken =
                googleResponse.params?.id_token ?? googleResponse.authentication?.idToken ?? null;

            if (!idToken) {
                setLoadingProvider(null);
                Alert.alert('Google sign-in failed', 'Missing Google identity token.');
                return;
            }

            exchangeToken('google', { idToken });
            return;
        }

        setLoadingProvider(null);

        if (googleResponse.type === 'error') {
            Alert.alert('Google sign-in failed', 'Unable to sign in with Google. Please try again.');
        }
    }, [exchangeToken, googleResponse]);

    const signInWithGoogle = useCallback(async () => {
        if (!googleConfigured) {
            Alert.alert(
                'Google sign-in unavailable',
                'Add your Google OAuth client IDs to enable Google sign-in.',
            );
            return;
        }

        if (!googleRequest) {
            Alert.alert('Please try again', 'Google sign-in is still initializing.');
            return;
        }

        try {
            setLoadingProvider('google');
            const result = await promptGoogle();

            if (!result || result.type !== 'success') {
                setLoadingProvider(null);

                if (result?.type === 'error') {
                    Alert.alert(
                        'Google sign-in failed',
                        'Unable to sign in with Google. Please try again.',
                    );
                }
            }
        } catch (error) {
            setLoadingProvider(null);
            Alert.alert('Google sign-in failed', handleError(error));
        }
    }, [googleConfigured, googleRequest, promptGoogle]);

    const signInWithApple = useCallback(async () => {
        if (!appleAvailable) {
            Alert.alert('Apple sign-in unavailable', 'This device does not support Sign in with Apple.');
            return;
        }

        try {
            setLoadingProvider('apple');

            const appleOptions: AppleAuthentication.AppleAuthenticationSignInOptions = {
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
            };

            if (APPLE_SERVICE_ID && Platform.OS !== 'ios') {
                appleOptions.clientId = APPLE_SERVICE_ID;
            }

            if (APPLE_REDIRECT_URI && Platform.OS !== 'ios') {
                appleOptions.redirectUri = APPLE_REDIRECT_URI;
            }

            const credential = await AppleAuthentication.signInAsync(appleOptions);

            if (!credential.identityToken) {
                throw new Error('Missing Apple identity token.');
            }

            await exchangeToken('apple', {
                identityToken: credential.identityToken,
                authorizationCode: credential.authorizationCode,
                email: credential.email,
                user: credential.user,
                fullName: credential.fullName,
            });
        } catch (error: any) {
            if (error?.code === 'ERR_REQUEST_CANCELED') {
                setLoadingProvider(null);
                return;
            }

            setLoadingProvider(null);
            Alert.alert('Apple sign-in failed', handleError(error));
        }
    }, [appleAvailable, exchangeToken]);

    return {
        appleAvailable,
        googleConfigured,
        loadingProvider,
        signInWithGoogle,
        signInWithApple,
    };
};

