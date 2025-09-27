// app/(onboarding)/_layout.tsx
import { Stack } from 'expo-router';

export function OnboardingLayout() {
	return (
		<Stack
			screenOptions={{
				headerShown: false,
			}}
		>
			<Stack.Screen name="index" />
			<Stack.Screen name="sessions" />
			<Stack.Screen name="reminders" />
			<Stack.Screen name="success" />
		</Stack>
	);
}
