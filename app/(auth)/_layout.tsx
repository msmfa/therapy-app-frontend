// app/(auth)/_layout.tsx
import React from 'react';
import { Stack, Redirect } from 'expo-router';
import { useAuth } from '../../src/auth/AuthContext';

export default function AuthLayout() {
	const { hydrated, isAuthenticated } = useAuth();
	if (!hydrated) return null;
	if (isAuthenticated) return <Redirect href="/" />;
	return (
		<Stack screenOptions={{ headerShown: false }}>
			<Stack.Screen name="login" />
		</Stack>
	);
}
