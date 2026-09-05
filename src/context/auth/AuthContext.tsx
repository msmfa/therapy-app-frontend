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

const STORED_SESSION_KEYS = ['token', 'refreshToken', 'user'] as const;

/**
 * A persisted user is only usable if it actually round-tripped. A truncated or
 * corrupted record must not become a `null` user attached to a live token.
 */
const parseStoredUser = (raw: string | null): AuthUser => {
    if (!raw) return null;

    try {
        const parsed: unknown = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return null;

        const candidate = parsed as Record<string, unknown>;
        if (
            typeof candidate.id !== 'string' || !candidate.id ||
            typeof candidate.email !== 'string' || !candidate.email ||
            typeof candidate.name !== 'string'
        ) {
            return null;
        }

        return {
            id: candidate.id,
            email: candidate.email,
            name: candidate.name,
        };
    } catch {
        return null;
    }
};

const clearPersistedSession = async (): Promise<void> => {
    await Promise.all(
        STORED_SESSION_KEYS.map((key) => SecureStore.deleteItemAsync(key)),
    );
};

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
    const userRef = useRef<AuthUser>(null);
    const signOutTasksRef = useRef<Set<SignOutTask>>(new Set());
    const sessionVersionRef = useRef(0);
    const signingOutRef = useRef(false);
    const storageQueueRef = useRef<Promise<void>>(Promise.resolve());

    // A late keychain write must never land after a newer login or logout.
    const enqueueSessionWrite = useCallback((operation: () => Promise<void>) => {
        const pending = storageQueueRef.current.then(operation);
        storageQueueRef.current = pending.catch(() => undefined);
        return pending;
    }, []);

    useEffect(() => {
        if (isHydrating.current || hasHydrated.current) {
            return;
        }
        isHydrating.current = true;
        const version = sessionVersionRef.current;

        (async () => {
            try {
                const [storedToken, storedRefreshToken, storedUser] = await Promise.all([
                    SecureStore.getItemAsync('token'),
                    SecureStore.getItemAsync('refreshToken'),
                    SecureStore.getItemAsync('user'),
                ]);
                if (version !== sessionVersionRef.current) return;

                const normalized = normalizeToken(storedToken);
                const hydratedUser = parseStoredUser(storedUser);

                // A token without a user (or vice versa) is a half-written
                // session — setAuth persists the two separately, so a crash or
                // a failed write between them leaves one behind. Restoring it
                // would route into the app with a null userId, where
                // onboarding reports incomplete and finishOnboarding() is a
                // no-op: the user is stuck with no path back to login. Discard
                // it and start clean instead.
                if (!normalized || !hydratedUser) {
                    if (storedToken || storedRefreshToken || storedUser) {
                        console.warn(
                            '[AuthProvider] Discarding incomplete persisted session',
                        );
                        await enqueueSessionWrite(async () => {
                            if (version === sessionVersionRef.current) await clearPersistedSession();
                        });
                    }
                    return;
                }

                // The refresh token is published first, and nothing may await
                // between here and the block below. `isAuthenticated` is
                // derived from token + user, so the moment those land every
                // effect keyed on it fires a request. Publishing the refresh
                // token afterwards left a window in which a 401 found
                // `refreshTokenRef` still empty: `refreshSession()` read it,
                // returned false without ever calling /api/auth/refresh, and
                // the api client went straight to `onAuthFailure()` and tore
                // the session down, discarding a refresh token that was on
                // disk the whole time. A single keychain write was enough to
                // open it.
                if (storedRefreshToken) {
                    refreshTokenRef.current = storedRefreshToken;
                    setRefreshToken(storedRefreshToken);
                }

                tokenRef.current = normalized;
                userRef.current = hydratedUser;
                setToken(normalized);
                setUser(hydratedUser);

                // Housekeeping, so it happens once the session is coherent
                // rather than in the middle of announcing it.
                if (normalized !== storedToken) {
                    await enqueueSessionWrite(async () => {
                        if (version === sessionVersionRef.current && tokenRef.current === normalized) {
                            await SecureStore.setItemAsync('token', normalized);
                        }
                    });
                }
            } catch (error) {
                if (version !== sessionVersionRef.current) return;
                console.error('[AuthProvider] hydration error:', error);
                tokenRef.current = null;
                refreshTokenRef.current = null;
                userRef.current = null;
                setToken(null);
                setRefreshToken(null);
                setUser(null);
                await enqueueSessionWrite(async () => {
                    if (version === sessionVersionRef.current) await clearPersistedSession();
                }).catch(() => undefined);
            } finally {
                hasHydrated.current = true;
                isHydrating.current = false;
                setHydrated(true);
            }
        })();
    }, [enqueueSessionWrite]);

    const commitAuth = useCallback(async (
        t: string, u: AuthUser, refresh: string | null | undefined, version: number,
    ) => {
        if (version !== sessionVersionRef.current) return;
        const normalizedToken = normalizeToken(t);
        const cleanedRefreshToken = refresh?.trim() || null;

        tokenRef.current = normalizedToken;
        refreshTokenRef.current = cleanedRefreshToken;
        userRef.current = u;
        setToken(normalizedToken);
        setRefreshToken(cleanedRefreshToken);
        setUser(u);

        await enqueueSessionWrite(async () => {
            if (version !== sessionVersionRef.current) return;
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
                // The writes are not atomic, so a failure part-way through can
                // leave a token on disk with no user. The next queued operation
                // will persist a newer session if a login superseded this one.
                await clearPersistedSession().catch(() => undefined);
            }
        });
    }, [enqueueSessionWrite]);

    const setAuth = useCallback(async (t: string, u: AuthUser, refresh?: string | null) => {
        const version = ++sessionVersionRef.current;
        signingOutRef.current = false;
        refreshInFlight.current = null;
        await commitAuth(t, u, refresh, version);
    }, [commitAuth]);

    const refreshSession = useCallback(async (): Promise<boolean> => {
        if (signingOutRef.current) return false;
        if (refreshInFlight.current) {
            return refreshInFlight.current;
        }

        const currentRefreshToken = refreshTokenRef.current;
        if (!currentRefreshToken) {
            return false;
        }

        const version = sessionVersionRef.current;
        const currentUser = userRef.current;
        const request = (async () => {
            try {
                const result = await refreshAuthToken(currentRefreshToken);
                if (version !== sessionVersionRef.current) return false;
                const nextToken = normalizeToken(result.token);
                if (!nextToken) {
                    return false;
                }

                const nextRefresh = result.refreshToken ?? currentRefreshToken;
                const nextUser = result.user ?? currentUser;

                await commitAuth(nextToken, nextUser, nextRefresh ?? null, version);
                return version === sessionVersionRef.current;
            } catch (error) {
                console.warn('[AuthProvider] refreshSession failed:', error);
                return false;
            }
        })().finally(() => {
            if (refreshInFlight.current === request) refreshInFlight.current = null;
        });

        refreshInFlight.current = request;
        return request;
    }, [commitAuth]);

    const registerSignOutTask = useCallback((task: SignOutTask) => {
        signOutTasksRef.current.add(task);
        return () => {
            signOutTasksRef.current.delete(task);
        };
    }, []);

    const signOut = useCallback(async (options?: SignOutOptions) => {
        const version = ++sessionVersionRef.current;
        signingOutRef.current = true;
        refreshInFlight.current = null;
        // Cleanup runs FIRST, while the token is still live. Clearing
        // credentials up front meant the push de-registration went out
        // unauthenticated, failed with a 401, and left the device row on the
        // server — so the cron kept pushing therapy reminders to a phone that
        // had logged out.
        if (!options?.skipCleanup && signOutTasksRef.current.size > 0) {
            const tasks = Array.from(signOutTasksRef.current);
            let cancelCleanupTimeout: (() => void) | undefined;
            try {
                await Promise.race([
                    Promise.allSettled(tasks.map((task) => task())),
                    new Promise((resolve) => {
                        const cleanupTimeout = setTimeout(resolve, SIGN_OUT_CLEANUP_TIMEOUT_MS);
                        cancelCleanupTimeout = () => clearTimeout(cleanupTimeout);
                    }),
                ]);
            } catch (error) {
                console.warn('[AuthProvider] signOut cleanup error:', error);
            } finally {
                cancelCleanupTimeout?.();
            }
        }

        // Cleanup may finish after another account has signed in.
        if (version !== sessionVersionRef.current) return;
        tokenRef.current = null;
        refreshTokenRef.current = null;
        userRef.current = null;
        setToken(null);
        setRefreshToken(null);
        setUser(null);

        try {
            await enqueueSessionWrite(async () => {
                if (version === sessionVersionRef.current) await clearPersistedSession();
            });
        } catch (error) {
            console.error('[AuthProvider] signOut storage error:', error);
        }
    }, [enqueueSessionWrite]);

    useEffect(() => {
        configureApiClient({
            getToken: () => tokenRef.current,
            getSessionVersion: () => sessionVersionRef.current,
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
        // Both halves are required. A token on its own cannot drive the app:
        // downstream providers key off user.id, so "signed in with no user" is
        // an unroutable state rather than a degraded one.
        isAuthenticated: Boolean(token && user),
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
