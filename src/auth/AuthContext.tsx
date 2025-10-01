import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

const normalizeToken = (value: string | null | undefined): string | null => {
    if (!value) return null;
    const normalized = value.replace(/^Bearer\s+/i, '').trim();
    return normalized.length ? normalized : null;
};

type AuthUser = { id: string; email: string } | null;

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

    useEffect(() => {
        (async () => {
            try {
                const t = await SecureStore.getItemAsync('token');
                const u = await SecureStore.getItemAsync('user');

                if (t) {
                    const normalized = normalizeToken(t);
                    if (normalized) {
                        setToken(normalized);
                        if (normalized !== t) {
                            await SecureStore.setItemAsync('token', normalized);
                        }
                    } else {
                        setToken(null);
                        await SecureStore.deleteItemAsync('token');
                    }
                }
                if (u) setUser(JSON.parse(u));
            } finally {
                setHydrated(true);
            }
        })();
    }, []);

    const setAuth = async (t: string, u: AuthUser) => {
        const normalizedToken = normalizeToken(t);

        setToken(normalizedToken);
        setUser(u);
        if (normalizedToken) {
            await SecureStore.setItemAsync('token', normalizedToken);
        } else {
            await SecureStore.deleteItemAsync('token');
        }
        await SecureStore.setItemAsync('user', JSON.stringify(u));
    };

    const signOut = async () => {
        setToken(null);
        setUser(null);
        await SecureStore.deleteItemAsync('token');
        await SecureStore.deleteItemAsync('user');
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
    if (!ctx) throw new Error('useAuth must be used inside! <AuthProvider>');
    return ctx;
};
