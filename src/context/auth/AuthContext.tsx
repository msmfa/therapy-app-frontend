import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';
import * as SecureStore from 'expo-secure-store';

import { configureApiClient } from '../../api/client';
import { refreshAuthToken } from '../../api/auth';

const normalizeToken = (value: string | null | undefined): string | null => {
    if (!value) {
        return null;
    }
    const normalized = value.replace(/^Bearer\s+/i, '').trim();
    return normalized.length > 0 ? normalized : null;
};

type AuthUser = {
    id: string;
    email: string;
    name: string;
} | null;

export type SignOutTask = () => Promise<void>;

export type SignOutOptions = {
    /**
     * Skip the registered cleanup tasks. Used when the session is already
     * known to be rejected by the server, so calling it again is pointless.
     */
    skipCleanup?: boolean;
};

type AuthContextValue = {
    token: string | null;
    refreshToken: string | null;
    user: AuthUser;
    isAuthenticated: boolean;
    hydrated: boolean;
    setAuth: (token: string, user: AuthUser, refreshToken?: string | null) => Promise<void>;
    refreshSession: () => Promise<boolean>;
    signOut: (options?: SignOutOptions) => Promise<void>;
    /**
     * Registers work that must happen while the session is still valid, such
     * as telling the backend to stop pushing to this device. Returns an
     * unregister function.
     */
    registerSignOutTask: (task: SignOutTask) => () => void;
};

// Sign-out must not hang on a dead network, so cleanup gets a bounded window.
const SIGN_OUT_CLEANUP_TIMEOUT_MS = 4000;

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [token, setToken] = useState<string | null>(null);
    const [refreshToken, setRefreshToken] = useState<string | null>(null);
    const [user, setUser] = useState<AuthUser>(null);
    const [hydrated, setHydrated] = useState(false);

    const isHydrating = useRef(false);
    const hasHydrated = useRef(false);
    const refreshInFlight = useRef<Promise<boolean> | null>(null);
    const tokenRef = useRef<string | null>(null);
    const refreshTokenRef = useRef<string | null>(null);
    const signOutTasksRef = useRef<Set<SignOutTask>>(new Set());

    useEffect(() => {
        tokenRef.current = token;
    }, [token]);

    useEffect(() => {
        refreshTokenRef.current = refreshToken;
    }, [refreshToken]);

    useEffect(() => {
        if (isHydrating.current || hasHydrated.current) {
            return;
        }
        isHydrating.current = true;

        (async () => {
            try {
                const [storedToken, storedRefreshToken, storedUser] = await Promise.all([
                    SecureStore.getItemAsync('token'),
                    SecureStore.getItemAsync('refreshToken'),
                    SecureStore.getItemAsync('user'),
                ]);

                if (storedToken) {
                    const normalized = normalizeToken(storedToken);
                    if (normalized) {
                        tokenRef.current = normalized;
                        setToken(normalized);

                        if (normalized !== storedToken) {
                            await SecureStore.setItemAsync('token', normalized);
                        }
                    } else {
                        await SecureStore.deleteItemAsync('token');
                    }
                }

                if (storedRefreshToken) {
                    refreshTokenRef.current = storedRefreshToken;
                    setRefreshToken(storedRefreshToken);
                }

                if (storedUser) {
                    setUser(JSON.parse(storedUser));
                }
            } catch (error) {
                console.error('[AuthProvider] hydration error:', error);
                setToken(null);
                setUser(null);
            } finally {
                hasHydrated.current = true;
                isHydrating.current = false;
                setHydrated(true);
            }
        })();
    }, []);

    const setAuth = useCallback(async (t: string, u: AuthUser, refresh?: string | null) => {
        const normalizedToken = normalizeToken(t);
        const cleanedRefreshToken = refresh?.trim() || null;

        tokenRef.current = normalizedToken;
        refreshTokenRef.current = cleanedRefreshToken;
        setToken(normalizedToken);
        setRefreshToken(cleanedRefreshToken);
        setUser(u);

        try {
            if (normalizedToken) {
                await SecureStore.setItemAsync('token', normalizedToken);
            } else {
                await SecureStore.deleteItemAsync('token');
            }

            if (cleanedRefreshToken) {
                await SecureStore.setItemAsync('refreshToken', cleanedRefreshToken);
            } else {
                await SecureStore.deleteItemAsync('refreshToken');
            }

            if (u) {
                await SecureStore.setItemAsync('user', JSON.stringify(u));
            } else {
                await SecureStore.deleteItemAsync('user');
            }
        } catch (error) {
            console.error('[AuthProvider] setAuth storage error:', error);
        }
    }, []);

    const refreshSession = useCallback(async (): Promise<boolean> => {
        if (refreshInFlight.current) {
            return refreshInFlight.current;
        }

        const currentRefreshToken = refreshTokenRef.current;
        if (!currentRefreshToken) {
            return false;
        }

        refreshInFlight.current = (async () => {
            try {
                const result = await refreshAuthToken(currentRefreshToken);
                const nextToken = normalizeToken(result.token);
                if (!nextToken) {
                    return false;
                }

                const nextRefresh = result.refreshToken ?? currentRefreshToken;
                const nextUser = result.user ?? user;

                await setAuth(nextToken, nextUser, nextRefresh ?? null);
                return true;
            } catch (error) {
                console.warn('[AuthProvider] refreshSession failed:', error);
                return false;
            } finally {
                refreshInFlight.current = null;
            }
        })();

        return refreshInFlight.current;
    }, [setAuth, user]);

    const registerSignOutTask = useCallback((task: SignOutTask) => {
        signOutTasksRef.current.add(task);
        return () => {
            signOutTasksRef.current.delete(task);
        };
    }, []);

    const signOut = useCallback(async (options?: SignOutOptions) => {
        // Cleanup runs FIRST, while the token is still live. Clearing
        // credentials up front meant the push de-registration went out
        // unauthenticated, failed with a 401, and left the device row on the
        // server — so the cron kept pushing therapy reminders to a phone that
        // had logged out.
        if (!options?.skipCleanup && signOutTasksRef.current.size > 0) {
            const tasks = Array.from(signOutTasksRef.current);
            try {
                await Promise.race([
                    Promise.allSettled(tasks.map((task) => task())),
                    new Promise((resolve) =>
                        setTimeout(resolve, SIGN_OUT_CLEANUP_TIMEOUT_MS),
                    ),
                ]);
            } catch (error) {
                console.warn('[AuthProvider] signOut cleanup error:', error);
            }
        }

        tokenRef.current = null;
        refreshTokenRef.current = null;
        setToken(null);
        setRefreshToken(null);
        setUser(null);

        try {
            await Promise.all([
                SecureStore.deleteItemAsync('token'),
                SecureStore.deleteItemAsync('refreshToken'),
                SecureStore.deleteItemAsync('user'),
            ]);
        } catch (error) {
            console.error('[AuthProvider] signOut storage error:', error);
        }
    }, []);

    useEffect(() => {
        configureApiClient({
            getToken: () => tokenRef.current,
            refreshAuth: refreshSession,
            onAuthFailure: () => {
                // The server has already rejected this session, so calling it
                // again during cleanup would only produce another 401.
                void signOut({ skipCleanup: true }).catch((error) => {
                    console.warn('[AuthProvider] signOut after auth failure failed:', error);
                });
            },
        });
    }, [refreshSession, signOut]);

    const value: AuthContextValue = {
        token,
        refreshToken,
        user,
        isAuthenticated: Boolean(token),
        hydrated,
        setAuth,
        refreshSession,
        signOut,
        registerSignOutTask,
    };

    return <AuthContext.Provider value={ value }>{ children }</AuthContext.Provider>;
}

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error('useAuth must be used inside <AuthProvider>');
    }
    return ctx;
};
