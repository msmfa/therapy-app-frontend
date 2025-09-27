// app/_layout.tsx
import React from 'react';
import { Slot } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, DefaultTheme } from '@react-navigation/native';
import { AuthProvider } from '../src/auth/AuthContext';

const TransparentTheme = {
	...DefaultTheme,
	colors: { ...DefaultTheme.colors, background: 'transparent', card: 'transparent' },
};

export default function RootLayout() {
	return (
		<SafeAreaProvider style={{ flex: 1, backgroundColor: 'transparent' }}>
			<View style={{ flex: 1 }}>
				<AuthProvider>
					<ThemeProvider value={TransparentTheme}>
						<Slot />
					</ThemeProvider>
				</AuthProvider>
				<StatusBar translucent backgroundColor="transparent" style="dark" />
			</View>
		</SafeAreaProvider>
	);
}
