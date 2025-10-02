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
import { Ionicons } from '@expo/vector-icons';
import { BASE_URL } from '../../src/const';
import SocialAuthButtons from '../../src/components/auth/SocialAuthButtons';

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
            router.replace('/');
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
                    <Text style={styles.title}>Welcome back</Text>
                    <Text style={styles.subtitle}>Sign in to continue</Text>

                    {isAuthenticated ? (
                        <>
                            <View style={styles.authenticatedContainer}>
                                <Text style={styles.authenticatedText}>Signed in as</Text>
                                <Text style={styles.userEmail}>{user?.email}</Text>
                            </View>

                            <TouchableOpacity onPress={() => router.replace('/')} style={styles.button}>
                                <Text style={styles.buttonText}>Go to Home</Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={onLogout} style={[styles.buttonOutline, { marginTop: 8 }]}>
                                <Text style={styles.buttonOutlineText}>Log out</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <View style={styles.formContainer}>
                            <View style={styles.inputGroup}>
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
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Password</Text>
                                <View style={styles.passwordRow}>
                                    <TextInput
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry={!showPw}
                                        placeholder="••••••••"
                                        style={[styles.input, styles.passwordInput]}
                                        textContentType="password"
                                    />
                                    <TouchableOpacity onPress={() => setShowPw(!showPw)} style={styles.eyeButton}>
                                        <Ionicons name={showPw ? 'eye-off' : 'eye'} size={20} color="#666" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <TouchableOpacity onPress={() => router.push('/forgot-password')} style={styles.forgotPassword}>
                                <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                disabled={loading}
                                onPress={onSubmit}
                                style={[styles.button, loading && styles.buttonDisabled]}
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text style={styles.buttonText}>Sign in</Text>
                                )}
                            </TouchableOpacity>

                            <View style={styles.oauthSection}>
                                <View style={styles.dividerContainer}>
                                    <View style={styles.divider} />
                                    <Text style={styles.dividerText}>Or continue with</Text>
                                    <View style={styles.divider} />
                                </View>

                                <SocialAuthButtons onSuccess={() => router.replace('/')} />
                            </View>

                            <TouchableOpacity onPress={() => router.push('/(auth)/signup')} style={styles.buttonOutline}>
                                <Text style={styles.buttonOutlineText}>Create New Account</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
    kav: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    card: {
        padding: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 8,
        color: '#111',
    },
    subtitle: {
        textAlign: 'center',
        color: '#666',
        fontSize: 16,
        marginBottom: 32,
    },
    authenticatedContainer: {
        marginBottom: 24,
    },
    authenticatedText: {
        textAlign: 'center',
        color: '#666',
        fontSize: 14,
        marginBottom: 4,
    },
    userEmail: {
        textAlign: 'center',
        fontWeight: '700',
        fontSize: 16,
        color: '#111',
    },
    formContainer: {
        width: '100%',
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontWeight: '600',
        marginBottom: 8,
        color: '#111',
        fontSize: 14,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 12,
        backgroundColor: 'white',
        fontSize: 16,
    },
    passwordRow: {
        flexDirection: 'row',
        alignItems: 'center',
        position: 'relative',
    },
    passwordInput: {
        flex: 1,
        paddingRight: 44,
    },
    eyeButton: {
        position: 'absolute',
        right: 12,
        padding: 4,
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: 24,
    },
    forgotPasswordText: {
        color: '#0066CC',
        fontSize: 14,
        fontWeight: '600',
    },
    button: {
        marginBottom: 16,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#111',
        alignItems: 'center',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 16,
    },
    buttonOutline: {
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#111',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    buttonOutlineText: {
        color: '#111',
        fontWeight: '700',
        fontSize: 16,
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 24,
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: '#ddd',
    },
    dividerText: {
        marginHorizontal: 16,
        color: '#999',
        fontSize: 13,
        fontWeight: '600',
    },
    oauthSection: {
        marginTop: 24,
        marginBottom: 24,
    },
    toggleBtn: {
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    toggleText: { fontWeight: '600' },
    buttonGhost: { paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
    buttonGhostText: { color: '#666', fontWeight: '600' },
    hint: { marginTop: 8, textAlign: 'center', color: '#666' },
});
