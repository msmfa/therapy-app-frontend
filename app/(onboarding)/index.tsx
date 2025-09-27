// app/(onboarding)/index.tsx
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WelcomeScreen() {
	const router = useRouter();

	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.content}>
				<Text style={styles.title}>Welcome!</Text>
				<Text style={styles.subtitle}>Let's get you set up in just a few steps</Text>
			</View>
			<Pressable style={styles.button} onPress={() => router.push('/(onboarding)/sessions')}>
				<Text style={styles.buttonText}>Get Started</Text>
			</Pressable>
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
	button: {
		backgroundColor: '#007AFF',
		padding: 16,
		borderRadius: 8,
		alignItems: 'center',
	},
	buttonText: {
		color: '#fff',
		fontSize: 18,
		fontWeight: '600',
	},
});
