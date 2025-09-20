import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CalendarScreen() {
	return (
		<SafeAreaView style={{ flex: 1 }}>
			<View style={{ flex: 1, padding: 16, alignItems: 'center', justifyContent: 'center' }}>
				<Text style={{ fontSize: 22, fontWeight: '700' }}>Calendar</Text>
				<Text style={{ marginTop: 8 }}>This is your Calendar page.</Text>
			</View>
		</SafeAreaView>
	);
}
