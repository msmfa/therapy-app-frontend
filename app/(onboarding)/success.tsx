// app/(onboarding)/success.tsx
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOnboarding } from '../../src/context/OnboardingContext';

export default function SuccessScreen() {
	const router = useRouter();
	const { finishOnboarding } = useOnboarding();

	const handleComplete = async () => {
		await finishOnboarding();
		// Navigation will be handled automatically by the Stack.Protected guards
		// The app will redirect to (tabs) once hasOnboarded becomes true
		router.push('/(tabs)/notes');
	};

	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.content}>
				<Text style={styles.title}>All Set! 🎉</Text>
				<Text style={styles.subtitle}>You're ready to start using the app</Text>
			</View>
			<View style={styles.buttons}>
				<Pressable style={[styles.button, styles.backButton]} onPress={() => router.back()}>
					<Text style={styles.backButtonText}>Back</Text>
				</Pressable>
				<Pressable style={styles.button} onPress={handleComplete}>
					<Text style={styles.buttonText}>Start Using App</Text>
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
