import React, { useState } from 'react';
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	StyleSheet,
	KeyboardAvoidingView,
	Platform,
	ActivityIndicator,
	Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/auth/AuthContext';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export default function LoginScreen() {
	const router = useRouter();
	const { setAuth, signOut, isAuthenticated, user } = useAuth();

	const [email, setEmail] = useState<string>('test@example.com');
	const [password, setPassword] = useState<string>('Passw0rd!');
	const [loading, setLoading] = useState<boolean>(false);
	const [showPw, setShowPw] = useState<boolean>(false);

	const onSubmit = async () => {
		if (!email || !password) {
			Alert.alert('Missing info', 'Please enter email and password.');
			return;
		}
		setLoading(true);
		try {
			const res = await fetch(`${BASE_URL}/api/auth/login`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: email.trim(), password }),
			});
			const json = await res.json();
			if (!res.ok) throw new Error(json?.error || json?.message || 'Login failed');

			await setAuth(json.token, json.user);
			router.replace('/'); // goes to (tabs)/index
		} catch (e: any) {
			Alert.alert('Error', e?.message ?? 'Login failed');
		} finally {
			setLoading(false);
		}
	};

	const onLogout = async () => {
		await signOut();
	};

	return (
		<SafeAreaView style={styles.root}>
			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : undefined}
				style={styles.kav}
			>
				<View style={styles.card}>
					<Text style={styles.title}>Sign in</Text>

					{isAuthenticated ? (
						<>
							<Text style={styles.subtitle}>Signed in as</Text>
							<Text style={styles.userEmail}>{user?.email}</Text>

							<TouchableOpacity
								onPress={() => router.replace('/')}
								style={styles.button}
							>
								<Text style={styles.buttonText}>Go to Home</Text>
							</TouchableOpacity>

							<TouchableOpacity
								onPress={onLogout}
								style={[styles.buttonOutline, { marginTop: 8 }]}
							>
								<Text style={styles.buttonOutlineText}>Log out</Text>
							</TouchableOpacity>
						</>
					) : (
						<>
							<Text style={styles.label}>Email</Text>
							<TextInput
								value={email}
								onChangeText={setEmail}
								autoCapitalize="none"
								autoCorrect={false}
								keyboardType="email-address"
								placeholder="you@example.com"
								style={styles.input}
								textContentType="username"
							/>

							<Text style={styles.label}>Password</Text>
							<View style={styles.passwordRow}>
								<TextInput
									value={password}
									onChangeText={setPassword}
									secureTextEntry={!showPw}
									placeholder="••••••••"
									style={[styles.input, { flex: 1 }]}
									textContentType="password"
								/>
								<TouchableOpacity
									onPress={() => setShowPw((s) => !s)}
									style={styles.toggleBtn}
								>
									<Text style={styles.toggleText}>
										{showPw ? 'Hide' : 'Show'}
									</Text>
								</TouchableOpacity>
							</View>

							<TouchableOpacity
								disabled={loading}
								onPress={onSubmit}
								style={[styles.button, loading && { opacity: 0.6 }]}
							>
								{loading ? (
									<ActivityIndicator />
								) : (
									<Text style={styles.buttonText}>Log in</Text>
								)}
							</TouchableOpacity>

							<TouchableOpacity
								onPress={onLogout}
								style={[styles.buttonGhost, { marginTop: 8 }]}
							>
								<Text style={styles.buttonGhostText}>Log out</Text>
							</TouchableOpacity>

							<Text style={styles.hint}>
								Server: {BASE_URL.replace(/^https?:\/\//, '')}
							</Text>
						</>
					)}
				</View>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	root: { flex: 1, backgroundColor: 'transparent' },
	kav: { flex: 1, justifyContent: 'center', paddingHorizontal: 20 },
	card: { backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 16, padding: 16, gap: 10 },
	title: { fontSize: 24, fontWeight: '700', textAlign: 'center', marginBottom: 4 },
	subtitle: { textAlign: 'center', color: '#555' },
	userEmail: { textAlign: 'center', fontWeight: '700', marginBottom: 8 },
	label: { fontWeight: '600', marginTop: 6 },
	input: {
		borderWidth: 1,
		borderColor: '#ddd',
		borderRadius: 10,
		paddingHorizontal: 12,
		paddingVertical: 10,
		backgroundColor: 'white',
	},
	passwordRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
	toggleBtn: {
		paddingHorizontal: 10,
		paddingVertical: 8,
		borderRadius: 10,
		borderWidth: 1,
		borderColor: '#ddd',
	},
	toggleText: { fontWeight: '600' },
	button: {
		marginTop: 10,
		paddingVertical: 12,
		borderRadius: 12,
		backgroundColor: '#111',
		alignItems: 'center',
	},
	buttonText: { color: 'white', fontWeight: '700' },
	buttonOutline: {
		paddingVertical: 12,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: '#111',
		alignItems: 'center',
	},
	buttonOutlineText: { color: '#111', fontWeight: '700' },
	buttonGhost: { paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
	buttonGhostText: { color: '#666', fontWeight: '600' },
	hint: { marginTop: 8, textAlign: 'center', color: '#666' },
});
