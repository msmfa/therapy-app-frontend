import React from 'react';
import { Tabs } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';

export default function RootLayout() {
	return (
		<SafeAreaProvider>
			<Tabs
				screenOptions={{
					headerTitleAlign: 'center',
					tabBarStyle: styles.tabBar,
					tabBarLabelStyle: styles.tabLabel,
				}}
			>
				<Tabs.Screen name="index" options={{ title: 'Message' }} />
				<Tabs.Screen name="calendar" options={{ title: 'Calendar' }} />
			</Tabs>
		</SafeAreaProvider>
	);
}

const styles = StyleSheet.create({
	tabBar: {
		borderTopWidth: StyleSheet.hairlineWidth,
		borderTopColor: '#eee',
		paddingVertical: 6,
		height: 56,
	},
	tabLabel: { fontSize: 12, fontWeight: '600' },
});
