// app/signup.tsx
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
	ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/auth/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

// Password validation rules
const validatePassword = (password: string) => {
	const errors = [];
	if (password.length < 8) errors.push('At least 8 characters');
	if (!/[A-Z]/.test(password)) errors.push('One uppercase letter');
	if (!/[a-z]/.test(password)) errors.push('One lowercase letter');
	if (!/[0-9]/.test(password)) errors.push('One number');
	if (!/[!@#$%^&*]/.test(password)) errors.push('One special character');
	return errors;
};

// Email validation
const validateEmail = (email: string) => {
	const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return re.test(email.toLowerCase());
};

export default function SignUpScreen() {
	const router = useRouter();
	const { setAuth } = useAuth();

	// Form state
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [name, setName] = useState('');

	// UI state
	const [loading, setLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [acceptedTerms, setAcceptedTerms] = useState(false);
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

	// Validate form on change
	const validateForm = () => {
		const newErrors: Record<string, string> = {};

		if (!name.trim()) newErrors.name = 'First name is required';

		if (!email.trim()) {
			newErrors.email = 'Email is required';
		} else if (!validateEmail(email)) {
			newErrors.email = 'Invalid email format';
		}

		const pwErrors = validatePassword(password);
		if (password && pwErrors.length > 0) {
			setPasswordErrors(pwErrors);
		} else {
			setPasswordErrors([]);
		}

		if (!password) {
			newErrors.password = 'Password is required';
		}

		if (!confirmPassword) {
			newErrors.confirmPassword = 'Please confirm your password';
		} else if (password !== confirmPassword) {
			newErrors.confirmPassword = 'Passwords do not match';
		}

		if (!acceptedTerms) {
			newErrors.terms = 'You must accept the terms';
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0 && pwErrors.length === 0;
	};

	const onSubmit = async () => {
		if (!validateForm()) {
			Alert.alert('Validation Error', 'Please fix all errors before continuing');
			return;
		}

		setLoading(true);
		try {
			// Create account
			const signupRes = await fetch(`${BASE_URL}/api/auth/register`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				// Backend ignores name if your User model only has email/password
				body: JSON.stringify({
					email: email.trim().toLowerCase(),
					password,
					name: name.trim(),
				}),
			});

			const signupData = await signupRes.json();
			if (!signupRes.ok) {
				throw new Error(signupData?.error || signupData?.message || 'Signup failed');
			}

			// Auto-login after successful signup
			if (signupData.token) {
				await setAuth(signupData.token, signupData.user);

				// 👇 Send first-time users to schedule their therapy sessions
				router.replace('/onboarding/welcome'); // Go to welcome screen
			} else {
				Alert.alert(
					'Success',
					'Account created successfully. Please check your email to verify your account.',
					[{ text: 'OK', onPress: () => router.replace('/login') }],
				);
			}
		} catch (e: any) {
			Alert.alert('Error', e?.message ?? 'Signup failed');
		} finally {
			setLoading(false);
		}
	};

	return (
		<SafeAreaView style={styles.root}>
			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : undefined}
				style={styles.kav}
			>
				<ScrollView
					contentContainerStyle={styles.scrollContent}
					showsVerticalScrollIndicator={false}
				>
					<View style={styles.card}>
						{/* Header */}
						<View style={styles.header}>
							<TouchableOpacity
								onPress={() => router.back()}
								style={styles.backButton}
							>
								<Ionicons name="arrow-back" size={24} color="#111" />
							</TouchableOpacity>
							<Text style={styles.title}>Create Account</Text>
							<View style={{ width: 24 }} />
						</View>

						<Text style={styles.subtitle}>Join us to start your therapy journey</Text>

						{/* Name */}
						<View style={styles.row}>
							<View style={styles.halfField}>
								<Text style={styles.label}>First Name</Text>
								<TextInput
									value={name}
									onChangeText={setName}
									placeholder="John"
									style={[styles.input, errors.name && styles.inputError]}
									autoCapitalize="words"
									textContentType="givenName"
								/>
								{errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
							</View>
						</View>

						{/* Email */}
						<View>
							<Text style={styles.label}>Email</Text>
							<TextInput
								value={email}
								onChangeText={(text) => {
									setEmail(text);
									if (errors.email) validateForm();
								}}
								autoCapitalize="none"
								autoCorrect={false}
								keyboardType="email-address"
								placeholder="you@example.com"
								style={[styles.input, errors.email && styles.inputError]}
								textContentType="emailAddress"
							/>
							{errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
						</View>

						{/* Password */}
						<View>
							<Text style={styles.label}>Password</Text>
							<View style={styles.passwordRow}>
								<TextInput
									value={password}
									onChangeText={(text) => {
										setPassword(text);
										setPasswordErrors(validatePassword(text));
									}}
									secureTextEntry={!showPassword}
									placeholder="••••••••"
									style={[
										styles.input,
										styles.passwordInput,
										errors.password && styles.inputError,
									]}
									textContentType="newPassword"
								/>
								<TouchableOpacity
									onPress={() => setShowPassword(!showPassword)}
									style={styles.eyeButton}
								>
									<Ionicons
										name={showPassword ? 'eye-off' : 'eye'}
										size={20}
										color="#666"
									/>
								</TouchableOpacity>
							</View>

							{/* Password requirements */}
							{password.length > 0 && (
								<View style={styles.requirements}>
									{[
										'At least 8 characters',
										'One uppercase letter',
										'One lowercase letter',
										'One number',
										'One special character',
									].map((req) => {
										const isMet = !passwordErrors.includes(req);
										return (
											<View key={req} style={styles.requirement}>
												<Ionicons
													name={
														isMet ? 'checkmark-circle' : 'close-circle'
													}
													size={16}
													color={isMet ? '#059669' : '#DC2626'}
												/>
												<Text
													style={[
														styles.requirementText,
														isMet && styles.requirementMet,
													]}
												>
													{req}
												</Text>
											</View>
										);
									})}
								</View>
							)}
						</View>

						{/* Confirm Password */}
						<View>
							<Text style={styles.label}>Confirm Password</Text>
							<View style={styles.passwordRow}>
								<TextInput
									value={confirmPassword}
									onChangeText={setConfirmPassword}
									secureTextEntry={!showConfirmPassword}
									placeholder="••••••••"
									style={[
										styles.input,
										styles.passwordInput,
										errors.confirmPassword && styles.inputError,
									]}
									textContentType="newPassword"
								/>
								<TouchableOpacity
									onPress={() => setShowConfirmPassword(!showConfirmPassword)}
									style={styles.eyeButton}
								>
									<Ionicons
										name={showConfirmPassword ? 'eye-off' : 'eye'}
										size={20}
										color="#666"
									/>
								</TouchableOpacity>
							</View>
							{errors.confirmPassword && (
								<Text style={styles.errorText}>{errors.confirmPassword}</Text>
							)}
						</View>

						{/* Terms */}
						<TouchableOpacity
							onPress={() => setAcceptedTerms(!acceptedTerms)}
							style={styles.termsRow}
						>
							<View
								style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}
							>
								{acceptedTerms && (
									<Ionicons name="checkmark" size={16} color="white" />
								)}
							</View>
							<Text style={styles.termsText}>
								I agree to the <Text style={styles.link}>Terms of Service</Text> and{' '}
								<Text style={styles.link}>Privacy Policy</Text>
							</Text>
						</TouchableOpacity>
						{errors.terms && <Text style={styles.errorText}>{errors.terms}</Text>}

						{/* Submit */}
						<TouchableOpacity
							disabled={loading}
							onPress={onSubmit}
							style={[styles.button, loading && styles.buttonDisabled]}
						>
							{loading ? (
								<ActivityIndicator color="white" />
							) : (
								<Text style={styles.buttonText}>Create Account</Text>
							)}
						</TouchableOpacity>

						{/* Footer */}
						<View style={styles.footer}>
							<Text style={styles.footerText}>Already have an account?</Text>
							<TouchableOpacity onPress={() => router.replace('/login')}>
								<Text style={styles.link}> Sign In</Text>
							</TouchableOpacity>
						</View>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	root: { flex: 1, backgroundColor: 'transparent' },
	kav: { flex: 1 },
	scrollContent: {
		flexGrow: 1,
		justifyContent: 'center',
		paddingHorizontal: 20,
		paddingVertical: 20,
	},
	card: { backgroundColor: 'transparent', padding: 16 },
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 20,
	},
	backButton: { padding: 4 },
	title: { fontSize: 24, fontWeight: '700', textAlign: 'center' },
	subtitle: { textAlign: 'center', color: '#666', marginBottom: 24, fontSize: 14 },
	row: { flexDirection: 'row', gap: 12, marginBottom: 16 },
	halfField: { flex: 1 },
	label: { fontWeight: '600', marginBottom: 6, fontSize: 14 },
	input: {
		borderWidth: 1,
		borderColor: '#ddd',
		borderRadius: 10,
		paddingHorizontal: 12,
		paddingVertical: 10,
		backgroundColor: 'white',
		fontSize: 16,
	},
	inputError: { borderColor: '#DC2626' },
	passwordRow: { flexDirection: 'row', alignItems: 'center', position: 'relative' },
	passwordInput: { flex: 1, paddingRight: 40 },
	eyeButton: { position: 'absolute', right: 12, padding: 4 },
	requirements: { marginTop: 8, marginBottom: 8 },
	requirement: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
	requirementText: { fontSize: 12, color: '#666', marginLeft: 6 },
	requirementMet: { color: '#059669', textDecorationLine: 'line-through' },
	termsRow: { flexDirection: 'row', alignItems: 'flex-start', marginVertical: 16 },
	checkbox: {
		width: 20,
		height: 20,
		borderWidth: 2,
		borderColor: '#ddd',
		borderRadius: 4,
		marginRight: 8,
		alignItems: 'center',
		justifyContent: 'center',
		marginTop: 2,
	},
	checkboxChecked: { backgroundColor: '#111', borderColor: '#111' },
	termsText: { flex: 1, fontSize: 14, color: '#666', lineHeight: 20 },
	link: { color: '#0066CC', fontWeight: '600' },
	button: {
		marginTop: 10,
		paddingVertical: 14,
		borderRadius: 12,
		backgroundColor: '#111',
		alignItems: 'center',
	},
	buttonDisabled: { opacity: 0.6 },
	buttonText: { color: 'white', fontWeight: '700', fontSize: 16 },
	footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
	footerText: { color: '#666', fontSize: 14 },
	errorText: { color: '#DC2626', fontSize: 12, marginTop: 4 },
});
