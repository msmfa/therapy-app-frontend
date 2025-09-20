import { Tabs } from 'expo-router';

export default function RootLayout() {
	return (
		<Tabs screenOptions={{ headerShown: false }}>
			<Tabs.Screen name="index" options={{ title: 'Message' }} />
			<Tabs.Screen name="calendar" options={{ title: 'Calendar' }} />
		</Tabs>
	);
}
