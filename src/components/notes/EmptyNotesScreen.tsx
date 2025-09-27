import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

// Color palette
const colors = {
	warningBg: '#fff3cd',
	warningBorder: '#ffeeba',
	warningText: '#856404',
	scienceBg: '#e8f4fd',
	blueText: '#0066cc',
	darkBlueText: '#004085',
	primaryBtn: '#111',
};

export default function EmptyNotesScreen() {
	const router = useRouter();

	return (
		<SafeAreaView style={styles.root} edges={['left', 'right', 'bottom']}>
			<View style={styles.emptyContainer}>
				<View style={styles.emptyCard}>
					<Text style={styles.emptyEmoji}>📝</Text>
					<Text style={styles.emptyTitle}>No therapy notes yet</Text>
					<Text style={styles.emptySubtext}>
						Start capturing insights from your sessions to track your journey
					</Text>
				</View>

				<View style={styles.tipCard}>
					<Text style={styles.tipIcon}>💡</Text>
					<View style={styles.tipContent}>
						<Text style={styles.tipTitle}>Pro tip</Text>
						<Text style={styles.tipText}>
							Add notes right after your therapy session while insights are fresh
						</Text>
					</View>
				</View>

				<Pressable style={styles.createButton} onPress={() => router.push('/(tabs)/note')}>
					<Text style={styles.createButtonText}>Create your first note</Text>
				</Pressable>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	root: {
		flex: 1,
		backgroundColor: '#fff',
	},
	emptyContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 20,
	},
	emptyCard: {
		backgroundColor: colors.warningBg,
		padding: 32,
		borderRadius: 12,
		alignItems: 'center',
		borderWidth: 1,
		borderColor: colors.warningBorder,
		marginBottom: 24,
		width: '100%',
	},
	emptyEmoji: {
		fontSize: 48,
		marginBottom: 16,
	},
	emptyTitle: {
		fontSize: 18,
		fontWeight: '600',
		color: colors.warningText,
		marginBottom: 8,
		textAlign: 'center',
	},
	emptySubtext: {
		fontSize: 14,
		color: colors.warningText,
		textAlign: 'center',
		lineHeight: 20,
		opacity: 0.9,
	},
	tipCard: {
		flexDirection: 'row',
		backgroundColor: colors.scienceBg,
		padding: 14,
		borderRadius: 10,
		marginBottom: 24,
		alignItems: 'center',
		gap: 12,
		width: '100%',
	},
	tipIcon: {
		fontSize: 20,
	},
	tipContent: {
		flex: 1,
	},
	tipTitle: {
		fontSize: 12,
		fontWeight: '700',
		color: colors.blueText,
		textTransform: 'uppercase',
		letterSpacing: 0.5,
		marginBottom: 2,
	},
	tipText: {
		fontSize: 13,
		color: colors.darkBlueText,
		lineHeight: 18,
	},
	createButton: {
		backgroundColor: colors.primaryBtn,
		paddingVertical: 16,
		paddingHorizontal: 32,
		borderRadius: 12,
		alignItems: 'center',
	},
	createButtonText: {
		fontSize: 16,
		fontWeight: '700',
		color: '#fff',
	},
});
