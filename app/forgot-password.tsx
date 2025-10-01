import React, { useMemo, useState } from 'react';
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
import { requestPasswordReset, resetPassword } from '../src/api/auth';

const MIN_PASSWORD_LENGTH = 8;

export default function ForgotPasswordScreen() {
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [token, setToken] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [step, setStep] = useState<'request' | 'reset' | 'done'>('request');
    const [loading, setLoading] = useState(false);

    const trimmedEmail = useMemo(() => email.trim(), [email]);

    const handleRequest = async () => {
        if (!trimmedEmail) {
            Alert.alert('Missing email', 'Enter the email you used for your account.');
            return;
        }

        setLoading(true);
        try {
            await requestPasswordReset(trimmedEmail);
            setStep('reset');
            Alert.alert(
                'Check your email',
                'We sent you a reset code. Paste it below once you have it.',
            );
        } catch (err) {
            const message = err instanceof Error ? err.message : 'We could not start the reset.';
            Alert.alert('Request failed', message);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async () => {
        if (!token.trim()) {
            Alert.alert('Missing code', 'Enter the reset code you received.');
            return;
        }

        if (!password || password.length < MIN_PASSWORD_LENGTH) {
            Alert.alert('Weak password', `Use at least ${MIN_PASSWORD_LENGTH} characters.`);
            return;
        }

        if (password !== confirm) {
            Alert.alert('Passwords do not match', 'Make sure both password fields match.');
            return;
        }

        setLoading(true);
        try {
            await resetPassword(token, password);
            setStep('done');
        } catch (err) {
            const message = err instanceof Error ? err.message : 'We could not reset your password.';
            Alert.alert('Reset failed', message);
        } finally {
            setLoading(false);
        }
    };

    const handleReturnToLogin = () => {
        router.replace('/(auth)/login');
    };

    const handleBack = () => {
        if (step === 'request') {
            router.back();
        } else if (step === 'reset') {
            setStep('request');
        } else {
            handleReturnToLogin();
        }
    };

    return (
        <SafeAreaView style={ styles.root }>
            <KeyboardAvoidingView behavior={ Platform.OS === 'ios' ? 'padding' : undefined } style={ styles.kav }>
                <View style={ styles.card }>
                    <TouchableOpacity onPress={ handleBack } style={ styles.backButton }>
                        <Text style={ styles.backButtonText }>Back</Text>
                    </TouchableOpacity>

                    { step === 'request' && (
                        <View style={ styles.content }>
                            <Text style={ styles.title }>Forgot password</Text>
                            <Text style={ styles.subtitle }>
                                Enter your account email. We will send you a reset code.
                            </Text>

                            <Text style={ styles.label }>Email</Text>
                            <TextInput
                                value={ email }
                                onChangeText={ setEmail }
                                placeholder='you@example.com'
                                keyboardType='email-address'
                                autoCapitalize='none'
                                autoCorrect={ false }
                                style={ styles.input }
                                textContentType='username'
                            />

                            <TouchableOpacity
                                disabled={ loading }
                                onPress={ handleRequest }
                                style={ [styles.button, loading && styles.buttonDisabled] }
                            >
                                { loading ? (
                                    <ActivityIndicator color='white' />
                                ) : (
                                    <Text style={ styles.buttonText }>Send reset code</Text>
                                ) }
                            </TouchableOpacity>
                        </View>
                    ) }

                    { step === 'reset' && (
                        <View style={ styles.content }>
                            <Text style={ styles.title }>Check your email</Text>
                            <Text style={ styles.subtitle }>
                                Paste the reset code and choose a new password.
                            </Text>

                            <Text style={ styles.label }>Reset code</Text>
                            <TextInput
                                value={ token }
                                onChangeText={ setToken }
                                placeholder='6-digit code or token'
                                autoCapitalize='none'
                                autoCorrect={ false }
                                style={ styles.input }
                                textContentType='oneTimeCode'
                            />

                            <Text style={ styles.label }>New password</Text>
                            <TextInput
                                value={ password }
                                onChangeText={ setPassword }
                                placeholder='••••••••'
                                secureTextEntry
                                style={ styles.input }
                                textContentType='newPassword'
                            />

                            <Text style={ styles.label }>Confirm password</Text>
                            <TextInput
                                value={ confirm }
                                onChangeText={ setConfirm }
                                placeholder='••••••••'
                                secureTextEntry
                                style={ styles.input }
                                textContentType='newPassword'
                            />

                            <TouchableOpacity
                                disabled={ loading }
                                onPress={ handleReset }
                                style={ [styles.button, loading && styles.buttonDisabled] }
                            >
                                { loading ? (
                                    <ActivityIndicator color='white' />
                                ) : (
                                    <Text style={ styles.buttonText }>Update password</Text>
                                ) }
                            </TouchableOpacity>
                        </View>
                    ) }

                    { step === 'done' && (
                        <View style={ styles.content }>
                            <Text style={ styles.title }>Password updated</Text>
                            <Text style={ styles.subtitle }>
                                Your password has been reset. Sign in with your new password to continue.
                            </Text>

                            <TouchableOpacity onPress={ handleReturnToLogin } style={ styles.button }>
                                <Text style={ styles.buttonText }>Back to sign in</Text>
                            </TouchableOpacity>
                        </View>
                    ) }
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
        paddingHorizontal: 24,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 24,
        gap: 16,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 12,
        elevation: 2,
    },
    backButton: {
        alignSelf: 'flex-start',
    },
    backButtonText: {
        color: '#444',
        fontSize: 16,
    },
    content: {
        gap: 16,
    },
    title: {
        fontSize: 26,
        fontWeight: '700',
        color: '#111',
    },
    subtitle: {
        fontSize: 15,
        color: '#555',
        lineHeight: 22,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#222',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 16,
        backgroundColor: '#fafafa',
    },
    button: {
        marginTop: 8,
        backgroundColor: '#872657',
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
    },
    buttonDisabled: {
        opacity: 0.8,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});

