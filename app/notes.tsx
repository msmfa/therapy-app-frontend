import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Notes() {
	return (
		<SafeAreaView style={styles.root}>
			<View style={{ padding: 16 }}></View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	root: { flex: 1, backgroundColor: 'transparent' },
	container: { flex: 1, padding: 16, alignItems: 'center', justifyContent: 'center' },
	title: { fontSize: 22, fontWeight: '700' },
	subtitle: { marginTop: 8 },
});
