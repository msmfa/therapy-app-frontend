// app/(auth)/_layout.tsx
import React from 'react';
import { Stack, Redirect, useGlobalSearchParams } from 'expo-router';
import { useAuth } from '../../src/context/auth/AuthContext';
import { useTheme } from '@react-navigation/native';
import {
    resolveAuthEntrySource,
    resolveAuthReturnRoute,
} from '../../src/features/onboarding/authReturn';

export default function AuthLayout() {
    const { isAuthenticated } = useAuth();
    const { colors } = useTheme();
    const { returnTo, source } = useGlobalSearchParams<{
        returnTo?: string | string[];
        source?: string | string[];
    }>();
    const returnRoute = resolveAuthReturnRoute(returnTo);
    const entrySource = resolveAuthEntrySource(source);

    // The signed-in redirect honours the same allow-listed return route the auth
    // screens use. Both fire on a successful sign-in and this one can win the
    // race; sending it to '/' unconditionally would drop a user who authenticated
    // from the account step back at the start of onboarding.
    if (isAuthenticated) return <Redirect href={ returnRoute ?? '/' } />;

    // Signed-out users should normally enter through the value-first
    // onboarding story. A bare login path can be restored after Fast Refresh
    // or a navigator remount; without an explicit source it is stale state, not
    // user intent. Account and restore handoffs carry returnTo, while Welcome
    // and password reset carry an allow-listed source.
    if (returnRoute === null && entrySource === null) {
        return <Redirect href="/(onboarding)" />;
    }

    return (
        <Stack
            screenOptions={ {
                headerShown: false,
                contentStyle: { backgroundColor: colors.background },
            } }
        >
            <Stack.Screen name="login" />
        </Stack>
    );
}
