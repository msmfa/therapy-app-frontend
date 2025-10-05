// app/(auth)/_layout.tsx
import React from 'react';
import { Stack, Redirect } from 'expo-router';
import { useAuth } from '../../src/context/auth/AuthContext';
import { useTheme } from '@react-navigation/native';

export default function AuthLayout() {
    const { isAuthenticated } = useAuth();
    const { colors } = useTheme();

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
