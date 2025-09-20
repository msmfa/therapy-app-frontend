import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CalendarScreen() {
	return (
		<SafeAreaView style={styles.root}>
			<View style={styles.container}>
				<Text style={styles.title}>Calendar</Text>
				<Text style={styles.subtitle}>This is your Calendar page.</Text>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	root: { flex: 1 },
	container: { flex: 1, padding: 16, alignItems: 'center', justifyContent: 'center' },
	title: { fontSize: 22, fontWeight: '700' },
	subtitle: { marginTop: 8 },
});
