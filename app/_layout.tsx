import React from 'react';
import { Tabs } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { ThemeProvider, DefaultTheme } from '@react-navigation/native';
import FullAppBackground from '../src/components/full-app-background';

const TransparentTheme = {
	...DefaultTheme,
	colors: {
		...DefaultTheme.colors,
		background: 'transparent',
		card: 'transparent',
	},
};

export default function RootLayout() {
	return (
		<SafeAreaProvider style={{ flex: 1, backgroundColor: 'transparent' }}>
			<View style={{ flex: 1 }}>
				<FullAppBackground />
				<ThemeProvider value={TransparentTheme}>
					<Tabs
						screenOptions={{
							headerTitleAlign: 'center',
							headerTransparent: true,
							headerStyle: { backgroundColor: 'transparent' },
							headerShadowVisible: false,
							tabBarStyle: {
								backgroundColor: 'transparent',
								borderTopWidth: 0,
								elevation: 0,
								shadowOpacity: 0,
								paddingVertical: 6,
								height: 56,
							},
							tabBarActiveTintColor: '#111',
							tabBarInactiveTintColor: '#888',
							tabBarShowLabel: false,
						}}
					>
						<Tabs.Screen
							name="index"
							options={{
								title: 'New Note',
								tabBarIcon: ({ color, size }) => (
									<Ionicons name="add" color={color} size={size ?? 24} />
								),
							}}
						/>
						<Tabs.Screen
							name="calendar"
							options={{
								title: 'Calendar',
								tabBarIcon: ({ color, size, focused }) => (
									<Ionicons
										name={focused ? 'calendar' : 'calendar-outline'}
										color={color}
										size={size ?? 24}
									/>
								),
							}}
						/>
						<Tabs.Screen
							name="notes"
							options={{
								title: 'Notes',
								tabBarIcon: ({ color, size }) => (
									<Ionicons name="book-outline" color={color} size={size ?? 24} />
								),
							}}
						/>
					</Tabs>
				</ThemeProvider>

				<StatusBar translucent backgroundColor="transparent" style="dark" />
			</View>
		</SafeAreaProvider>
	);
}
