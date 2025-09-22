import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/auth/AuthContext';

export default function SettingsScreen() {
	const { user, signOut } = useAuth();

	const onLogout = async () => {
		try {
			await signOut(); // clears SecureStore + context
		} catch (e: any) {
			Alert.alert('Error', e?.message ?? 'Could not log out. Try again.');
		}
	};

	return (
		<SafeAreaView style={styles.root}>
			<View style={styles.container}>
				<Text style={styles.title}>Settings</Text>

				<View style={styles.section}>
					<Text style={styles.label}>Signed in as</Text>
					<Text style={styles.value}>{user?.email ?? '—'}</Text>
				</View>

				<TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
					<Text style={styles.logoutText}>Log out</Text>
				</TouchableOpacity>
				<Text style={styles.footer}>v1.0.0</Text>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	root: { flex: 1, backgroundColor: 'transparent' },
	container: { flex: 1, padding: 16, gap: 16, justifyContent: 'space-between' },
	title: { fontSize: 22, fontWeight: '700' },
	section: { gap: 4 },
	label: { color: '#666', fontWeight: '600' },
	value: { fontSize: 16, fontWeight: '600' },
	logoutBtn: {
		marginTop: 'auto',
		paddingVertical: 14,
		borderRadius: 12,
		backgroundColor: '#111',
		alignItems: 'center',
	},
	logoutText: { color: '#fff', fontWeight: '700' },
	footer: { textAlign: 'center', color: '#888', marginTop: 12 },
});
