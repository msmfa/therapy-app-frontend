// app/_layout.tsx
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '../src/auth/AuthContext';
import { OnboardingProvider, useOnboarding } from '../src/context/OnboardingContext';
import { TherapySessionsProvider } from '../src/context/TherapySessionsContext';
import { View } from 'react-native';

function Gate() {
	const { user, hydrated } = useAuth();
	const { hasOnboarded } = useOnboarding();

	console.log('Gate render:', {
		user: !!user,
		hasOnboarded,
		hydrated,
	});

	// Wait for auth to hydrate
	if (!hydrated) {
		return null; // Or a loading screen
	}
	return (
		<Stack screenOptions={{ headerShown: false }}>
			<Stack.Protected guard={(console.log('Auth guard:', !user), !user)}>
				<Stack.Screen name="(auth)" />
			</Stack.Protected>
			<Stack.Protected
				guard={
					(console.log('Onboarding guard:', Boolean(user) && !hasOnboarded),
					Boolean(user) && !hasOnboarded)
				}
			>
				<Stack.Screen name="(onboarding)" />
			</Stack.Protected>
			<Stack.Protected
				guard={
					(console.log('Tabs guard:', Boolean(user) && hasOnboarded),
					Boolean(user) && hasOnboarded)
				}
			>
				<Stack.Screen name="(tabs)" />
				<Stack.Protected guard={true}>
					<Stack.Screen name="index" />
				</Stack.Protected>
			</Stack.Protected>
		</Stack>
	);
}

export default function RootLayout() {
	return (
		<AuthProvider>
			<TherapySessionsProvider>
				<OnboardingProvider>
					<SafeAreaProvider>
						<Gate />
					</SafeAreaProvider>
				</OnboardingProvider>
			</TherapySessionsProvider>
		</AuthProvider>
	);
}
