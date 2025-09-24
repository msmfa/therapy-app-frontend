// app/(tabs)/note/_layout.tsx
import React from 'react';
import { Stack } from 'expo-router';

export default function NoteStackLayout() {
	return (
		<Stack
			screenOptions={{
				// keep your transparent look
				headerTransparent: true,
				headerStyle: { backgroundColor: 'transparent' },
				headerShadowVisible: false,
				contentStyle: { backgroundColor: 'transparent' },

				// stop previous-screen flash with native-stack settings
				// detachPreviousScreen: false, // keep prev screen attached during transition
				freezeOnBlur: true, // freeze prev screen once blurred

				// you can keep animations; if flash persists, switch these to 'none'
				animationTypeForReplace: 'push',
			}}
		>
			<Stack.Screen
				name="index"
				options={{
					title: 'New note',
					animation: 'none', // or 'none' to eliminate flash entirely
				}}
			/>
			<Stack.Screen
				name="reminder"
				options={{
					title: 'Pick reminder',
					animation: 'none', // or 'none'
				}}
			/>
			<Stack.Screen
				name="success"
				options={{
					headerShown: false,
					animation: 'none', // or 'none'
				}}
			/>
		</Stack>
	);
}
