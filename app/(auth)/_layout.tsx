// app/(auth)/_layout.tsx
import React from 'react';
import { Stack, Redirect } from 'expo-router';
import { useAuth } from '../../src/auth/AuthContext';
import { useTheme } from '@react-navigation/native';

export default function AuthLayout() {
    const { hydrated, isAuthenticated } = useAuth();
    const { colors } = useTheme();

    if (!hydrated) return null;
    if (isAuthenticated) return <Redirect href="/" />;

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
