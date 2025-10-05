import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import * as SecureStore from 'expo-secure-store';

const normalizeToken = (value: string | null | undefined): string | null => {
    if (!value) return null;
    const normalized = value.replace(/^Bearer\s+/i, '').trim();
    return normalized.length ? normalized : null;
};

type AuthUser = {
    id: string;
    email: string;
    name: string;
} | null;

type AuthContextValue = {
    token: string | null;
    user: AuthUser;
    isAuthenticated: boolean;
    hydrated: boolean;
    setAuth: (token: string, user: AuthUser) => Promise<void>;
    signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<AuthUser>(null);
    const [hydrated, setHydrated] = useState(false);

    // Prevent multiple concurrent hydrations
    const isHydrating = useRef(false);
    const hasHydrated = useRef(false);


    // Hydrate auth state on mount - runs ONCE
    useEffect(() => {
        // Guard: prevent duplicate hydrations
        if (isHydrating.current || hasHydrated.current) {
            return;
        }
        isHydrating.current = true;

        (async () => {
            try {
                const [storedToken, storedUser] = await Promise.all([
                    SecureStore.getItemAsync('token'),
                    SecureStore.getItemAsync('user'),
                ]);

                // Process token
                if (storedToken) {
                    const normalized = normalizeToken(storedToken);
                    if (normalized) {
                        setToken(normalized);

                        // Normalize stored token if needed
                        if (normalized !== storedToken) {
                            await SecureStore.setItemAsync('token', normalized);
                        }
                    } else {
                        await SecureStore.deleteItemAsync('token');
                    }
                }

                // Process user
                if (storedUser) {
                    setUser(JSON.parse(storedUser));
                }
            } catch (error) {
                console.error('[AuthProvider] hydration error:', error);
                // On error, clear potentially corrupted state
                setToken(null);
                setUser(null);
            } finally {
                hasHydrated.current = true;
                isHydrating.current = false;
                setHydrated(true);
            }
        })();
    }, []); // Empty deps - hydrate exactly ONCE on mount

    const setAuth = async (t: string, u: AuthUser) => {
        const normalizedToken = normalizeToken(t);

        // Update state immediately
        setToken(normalizedToken);
        setUser(u);

        // Persist to storage
        try {
            if (normalizedToken) {
                await SecureStore.setItemAsync('token', normalizedToken);
            } else {
                await SecureStore.deleteItemAsync('token');
            }

            if (u) {
                await SecureStore.setItemAsync('user', JSON.stringify(u));
            } else {
                await SecureStore.deleteItemAsync('user');
            }
        } catch (error) {
            console.error('[AuthProvider] setAuth storage error:', error);
        }
    };

    const signOut = async () => {
        // Clear state immediately
        setToken(null);
        setUser(null);

        // Clear storage
        try {
            await Promise.all([
                SecureStore.deleteItemAsync('token'),
                SecureStore.deleteItemAsync('user'),
            ]);
        } catch (error) {
            console.error('[AuthProvider] signOut storage error:', error);
        }
    };

    const value: AuthContextValue = {
        token,
        user,
        isAuthenticated: !!token,
        hydrated,
        setAuth,
        signOut,
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
