// Signs the demo account in without going through the login form.
//
// Only exists to make screenshot runs repeatable. Driving the simulator's
// keyboard to fill the form is flaky enough that a mistyped character or a
// bundle reload lands you in a half-filled state, and the point of the demo
// account is that it can be brought up the same way every time.
//
// It is not a shortcut around auth: it calls `loginWithPassword` and `setAuth`,
// the exact two calls app/(auth)/login.tsx makes, so the session it produces is
// a real one with a real token from the real endpoint.
//
// Inert unless EXPO_PUBLIC_DEMO_AUTOLOGIN=1 in a dev build.
import * as React from 'react';

import { loginWithPassword } from '../../api/auth';
import { useAuth } from '../../context/auth/AuthContext';

const DEFAULT_EMAIL = 'sarah@demo.plastic-brains.com';
const DEFAULT_PASSWORD = 'Sarah!123';

export function isDemoAutoLoginEnabled(): boolean {
    return __DEV__ && process.env.EXPO_PUBLIC_DEMO_AUTOLOGIN === '1';
}

export function DemoAutoLogin(): null {
    const { isAuthenticated, hydrated, setAuth } = useAuth();

    // One attempt per launch. Without this a failed login retries on every
    // render, which turns a wrong password into a request loop.
    const attemptedRef = React.useRef(false);

    React.useEffect(() => {
        // `hydrated` matters: before the stored session has been read back,
        // isAuthenticated is false for a user who is in fact already signed in,
        // and logging in again would replace a good session for no reason.
        if (!isDemoAutoLoginEnabled() || !hydrated || isAuthenticated) return;
        if (attemptedRef.current) return;

        attemptedRef.current = true;

        void (async () => {
            const email = process.env.EXPO_PUBLIC_DEMO_EMAIL ?? DEFAULT_EMAIL;
            const password = process.env.EXPO_PUBLIC_DEMO_PASSWORD ?? DEFAULT_PASSWORD;

            try {
                const { token, user, refreshToken } = await loginWithPassword(email, password);
                await setAuth(token, user, refreshToken ?? null);
                console.log(`[DemoAutoLogin] Signed in as ${email}.`);
            } catch (error) {
                console.warn('[DemoAutoLogin] Failed:', error);
            }
        })();
    }, [hydrated, isAuthenticated, setAuth]);

    return null;
}
