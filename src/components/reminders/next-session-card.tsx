import { View, StyleSheet, Text } from 'react-native';

interface Props {
	timestamp: string;
	sessionInterval: string;
}

export function NextSessionCard({ timestamp, sessionInterval }: Props) {
	return (
		<View style={styles.sessionInfoCard}>
			<View style={styles.sessionInfoRow}>
				<Text style={styles.sessionInfoLabel}>Next session</Text>
				<Text style={styles.sessionInfoValue}>{timestamp}</Text>
			</View>
			<Text style={styles.sessionInterval}>{sessionInterval}</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	sessionInfoCard: {
		backgroundColor: '#f8f9fa',
		padding: 16,
		borderRadius: 12,
		marginBottom: 24,
		borderWidth: 1,
		borderColor: '#e9ecef',
	},
	sessionInfoRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	sessionInfoLabel: {
		fontSize: 14,
		color: '#666',
		fontWeight: '500',
	},
	sessionInfoValue: {
		fontSize: 14,
		color: '#111',
		fontWeight: '600',
	},
	sessionInterval: {
		fontSize: 12,
		color: '#28a745',
		marginTop: 8,
		fontWeight: '600',
		textTransform: 'uppercase',
		letterSpacing: 0.5,
	},
});
