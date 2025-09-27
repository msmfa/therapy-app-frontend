// app/(onboarding)/sessions.tsx
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SessionsScreen() {
	const router = useRouter();

	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.content}>
				<Text style={styles.title}>Pick Your Sessions</Text>
				<Text style={styles.subtitle}>How many sessions would you like per week?</Text>
				{/* Add your session picker UI here */}
				<Text style={styles.placeholder}>[Session options will go here]</Text>
			</View>
			<View style={styles.buttons}>
				<Pressable style={[styles.button, styles.backButton]} onPress={() => router.back()}>
					<Text style={styles.backButtonText}>Back</Text>
				</Pressable>
				<Pressable
					style={styles.button}
					onPress={() => router.push('/(onboarding)/reminders')}
				>
					<Text style={styles.buttonText}>Next</Text>
				</Pressable>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fff',
		padding: 20,
	},
	content: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	title: {
		fontSize: 32,
		fontWeight: 'bold',
		marginBottom: 10,
	},
	subtitle: {
		fontSize: 18,
		color: '#666',
		textAlign: 'center',
		marginBottom: 40,
	},
	placeholder: {
		fontSize: 16,
		color: '#999',
		fontStyle: 'italic',
	},
	buttons: {
		flexDirection: 'row',
		gap: 10,
	},
	button: {
		flex: 1,
		backgroundColor: '#007AFF',
		padding: 16,
		borderRadius: 8,
		alignItems: 'center',
	},
	backButton: {
		backgroundColor: '#f0f0f0',
	},
	buttonText: {
		color: '#fff',
		fontSize: 18,
		fontWeight: '600',
	},
	backButtonText: {
		color: '#333',
		fontSize: 18,
		fontWeight: '600',
	},
});
