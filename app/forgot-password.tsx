import React, { useMemo, useState } from 'react';
import {
    View,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { requestPasswordReset, resetPassword } from '../src/api/auth';
import TextField from 'src/components/ui/TextField';
import PasswordField from 'src/components/ui/PasswordField';
import { Button } from 'src/components/ui/Button';
import AppText from '../src/components/ui/AppText';

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
                        <AppText style={ styles.backButtonText } variant='body'>
                            Back
                        </AppText>
                    </TouchableOpacity>

                    { step === 'request' && (
                        <View style={ styles.content }>
                            <AppText style={ styles.title } variant='h2'>
                                Forgot password
                            </AppText>
                            <AppText style={ styles.subtitle } variant='body'>
                                Enter your account email. We will send you a reset code.
                            </AppText>

                            <TextField
                                label="Email"
                                value={ email }
                                onChangeText={ setEmail }
                                placeholder="you@example.com"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={ false }
                                textContentType="username"
                                returnKeyType="done"
                            />

                            <Button
                                label="Send reset code"
                                onPress={ handleRequest }
                                loading={ loading }
                                addedStyles={ { marginTop: 8 } }
                            />
                        </View>
                    ) }

                    { step === 'reset' && (
                        <View style={ styles.content }>
                            <AppText style={ styles.title } variant='body'>
                                Check your email
                            </AppText>
                            <AppText style={ styles.subtitle } variant='body'>
                                Paste the reset code and choose a new password.
                            </AppText>

                            <TextField
                                label="Reset code"
                                value={ token }
                                onChangeText={ setToken }
                                placeholder="6-digit code or token"
                                autoCapitalize="none"
                                autoCorrect={ false }
                                textContentType="oneTimeCode"
                                returnKeyType="next"
                            />

                            <PasswordField
                                label="New password"
                                value={ password }
                                onChangeText={ setPassword }
                                placeholder="••••••••"
                                textContentType="newPassword"
                                returnKeyType="next"
                            />

                            <PasswordField
                                label="Confirm password"
                                value={ confirm }
                                onChangeText={ setConfirm }
                                placeholder="••••••••"
                                textContentType="newPassword"
                                returnKeyType="done"
                                onSubmitEditing={ handleReset }
                            />

                            <Button
                                label="Update password"
                                onPress={ handleReset }
                                loading={ loading }
                                addedStyles={ { marginTop: 8 } }
                            />
                        </View>
                    ) }

                    { step === 'done' && (
                        <View style={ styles.content }>
                            <AppText style={ styles.title } variant='body'>
                                Password updated
                            </AppText>
                            <AppText style={ styles.subtitle } variant='body'>
                                Your password has been reset. Sign in with your new password to continue.
                            </AppText>

                            <Button label="Back to sign in" onPress={ handleReturnToLogin } />
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
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 24,
        gap: 16,
        shadowColor: '#000000',
        shadowOpacity: 0.06,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 12,
        elevation: 2,
    },
    backButton: {
        alignSelf: 'flex-start',
    },
    backButtonText: {
        fontSize: 16,
    },
    content: {
        gap: 16,
    },
    title: {
        fontSize: 26,
        fontWeight: '700',
    },
    subtitle: {
        fontSize: 15,
        lineHeight: 22,
    },
});
