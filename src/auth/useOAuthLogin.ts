import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';

import { useAuth } from '../context/auth/AuthContext';
import { APPLE_REDIRECT_URI, APPLE_SERVICE_ID } from '../constants/env';
import { handleError } from '../utils';
import { exchangeOAuthToken, OAuthPayloadMap, OAuthProvider } from '../api/auth';
import { useAppAlert } from '../context/alert';

WebBrowser.maybeCompleteAuthSession();

interface UseOAuthLoginResult {
    appleAvailable: boolean;
    loadingProvider: OAuthProvider | null;
    signInWithApple: () => Promise<void>;
}

export const useOAuthLogin = (onSuccess?: () => void): UseOAuthLoginResult => {
    const { setAuth } = useAuth();
    const { showAlert } = useAppAlert();

    const [appleAvailable, setAppleAvailable] = useState(false);
    const [loadingProvider, setLoadingProvider] = useState<OAuthProvider | null>(null);

    const shouldUseProxy = Platform.OS !== 'web';

    const redirectUri = useMemo(
        () =>
            AuthSession.makeRedirectUri({
                useProxy: shouldUseProxy,
            }),
        [shouldUseProxy],
    );

    useEffect(() => {
        AppleAuthentication.isAvailableAsync()
            .then(setAppleAvailable)
            .catch(() => setAppleAvailable(false));
    }, []);

    const exchangeToken = useCallback(
        async <P extends OAuthProvider>(provider: P, payload: OAuthPayloadMap[P]) => {
            try {
                const data = await exchangeOAuthToken(provider, payload);
                console.log("OAuth exchange success:", data);
                await setAuth(data.token, data.user, data.refreshToken ?? null);
                onSuccess?.();
            } catch (error) {
                showAlert('Authentication failed!', handleError(error));
            } finally {
                setLoadingProvider(null);
            }
        },
        [onSuccess, setAuth, showAlert],
    );

    const signInWithApple = useCallback(async () => {
        if (!appleAvailable) {
            showAlert('Apple sign-in unavailable', 'This device does not support Sign in with Apple.');
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

            if (Platform.OS !== 'ios') {
                if (APPLE_SERVICE_ID) {
                    appleOptions.clientId = APPLE_SERVICE_ID;
                }
                appleOptions.redirectUri = APPLE_REDIRECT_URI ?? redirectUri;
            }

            const credential = await AppleAuthentication.signInAsync(appleOptions);

            if (!credential.identityToken) {
                throw new Error('Missing Apple identity token.');
            }

            const trimToValue = (value?: string | null) => {
                const trimmed = value?.trim();
                return trimmed && trimmed.length > 0 ? trimmed : undefined;
            };

            const applePayload: OAuthPayloadMap['apple'] = {
                idToken: credential.identityToken,
            };

            const authorizationCode = trimToValue(credential.authorizationCode);
            if (authorizationCode) {
                applePayload.authorizationCode = authorizationCode;
            }
            await exchangeToken('apple', applePayload);
        } catch (error) {
            if ((error as { code?: string } | null)?.code === 'ERR_REQUEST_CANCELED') {
                setLoadingProvider(null);
                return;
            }

            setLoadingProvider(null);
            showAlert('Apple sign-in failed', handleError(error));
        }
    }, [appleAvailable, exchangeToken, redirectUri, showAlert]);

    return {
        appleAvailable,
        loadingProvider,
        signInWithApple,
    };
};
