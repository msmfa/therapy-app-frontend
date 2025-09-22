// app/(tabs)/_layout.tsx
import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/auth/AuthContext';

export default function TabsLayout() {
	const { hydrated, isAuthenticated } = useAuth();

	if (!hydrated) return null;
	if (!isAuthenticated) return <Redirect href="/login" />;

	return (
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
			<Tabs.Screen
				name="settings"
				options={{
					title: 'Settings',
					tabBarIcon: ({ color, size, focused }) => (
						<Ionicons
							name={focused ? 'settings-outline' : 'settings-outline'}
							color={color}
							size={size ?? 24}
						/>
					),
				}}
			/>
		</Tabs>
	);
}
