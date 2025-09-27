// app/_layout.tsx
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '../src/auth/AuthContext';
import { OnboardingProvider, useOnboarding } from '../src/context/OnboardingContext';

function Gate() {
	const { user } = useAuth();
	const { hasOnboarded } = useOnboarding();
	console.log('hasOnboarded', hasOnboarded);
	return (
		<Stack screenOptions={{ headerShown: false }}>
			<Stack.Protected guard={!user}>
				<Stack.Screen name="(auth)" />
			</Stack.Protected>
			<Stack.Protected guard={Boolean(user) && !hasOnboarded}>
				<Stack.Screen name="(onboarding)" />
			</Stack.Protected>

			<Stack.Protected guard={Boolean(user)}>
				<Stack.Screen name="(tabs)" />
			</Stack.Protected>

			<Stack.Screen name="index" />
		</Stack>
	);
}

export default function RootLayout() {
	return (
		<AuthProvider>
			<OnboardingProvider>
				<SafeAreaProvider>
					<Gate />
				</SafeAreaProvider>
			</OnboardingProvider>
		</AuthProvider>
	);
}
