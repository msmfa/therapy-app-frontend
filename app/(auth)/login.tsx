import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '../../src/auth/AuthContext';
import { BASE_URL } from '../../src/const';
import SocialAuthButtons from '../../src/components/auth/SocialAuthButtons';
import { Button } from 'src/components/ui/button';
import Spacer, { SpacerVariant } from 'src/components/ui/Spacer';
import TextField from 'src/components/ui/TextField';
import PasswordField from 'src/components/ui/PasswordField';

export default function LoginScreen() {
    const router = useRouter();
    const { setAuth, signOut, isAuthenticated, user } = useAuth();

    const [email, setEmail] = useState<string>('test@example.com');
    const [password, setPassword] = useState<string>('Passw0rd!');
    const [loading, setLoading] = useState<boolean>(false);

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
                    <Text style={styles.title}>Welcome</Text>
                    <Spacer/>
                    {isAuthenticated ? (
                        <>
                            <View style={styles.authenticatedContainer}>
                                <Text style={styles.authenticatedText}>Signed in as</Text>
                                <Text style={styles.userEmail}>{user?.email}</Text>
                            </View>
                            <Button label="Go to Home" onPress={() => router.replace('/')} />
                            <Spacer />
                            <Button label="Log out" onPress={onLogout} transparent />
                        </>
                    ) : (
                        <View style={styles.formContainer}>
                            <TextField
                                label="Email"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                autoCorrect={false}
                                keyboardType="email-address"
                                placeholder="you@example.com"
                                textContentType="username"
                                returnKeyType="next"
                            />

                            <PasswordField
                                label="Password"
                                value={password}
                                onChangeText={setPassword}
                                placeholder="••••••••"
                                textContentType="password"
                                returnKeyType="done"
                                onSubmitEditing={onSubmit}
                            />
                            <Spacer />

                            <TouchableOpacity onPress={() => router.push('/forgot-password')} style={styles.forgotPassword}>
                                <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                            </TouchableOpacity>
                            <Button label={'Sign in'} onPress={onSubmit } loading={loading} />
                            <Spacer variant={SpacerVariant.large} />

                            <View style={styles.oauthSection}>
                                <View style={styles.dividerContainer}>
                                    <View style={styles.divider} />
                                    <Text style={styles.dividerText}>Or continue with</Text>
                                    <View style={styles.divider} />
                                </View>
                                <Spacer variant={SpacerVariant.large} />

                                <SocialAuthButtons onSuccess={() => router.replace('/')} />
                            </View>
                            <Spacer />

                            <View style={styles.signupRow}>
                                <Text style={styles.signupPrompt}>Don't have an account?</Text>
                                <Link href="/(auth)/signup" style={styles.signupLink}>
                                    Sign up here
                                </Link>
                            </View>
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
        backgroundColor: '#f9f9f9',
        paddingHorizontal: 20,
    },
    kav: {
        flex: 1,
        justifyContent: 'center',
    },
    card: {
        width: '100%',
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        textAlign: 'center',
        color: '#111',
    },
    authenticatedContainer: {
        marginBottom: 24,
    },
    authenticatedText: {
        textAlign: 'center',
        color: '#666',
        fontSize: 14,
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
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: 24,
    },
    forgotPasswordText: {
        color: '#0066CC',
        fontSize: 14,
        fontWeight: '600',
    },
    oauthSection: {},
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: '#ddd',
    },
    dividerText: {
        color: '#666',
        fontSize: 14,
        marginHorizontal: 8,
    },
    signupRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    signupPrompt: {
        color: '#666',
        fontSize: 14,
        marginRight: 4,
    },
    signupLink: {
        color: '#0066CC',
        fontSize: 14,
        fontWeight: '600',
    },
});
