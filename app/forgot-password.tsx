import React, { useCallback, useMemo, useState } from 'react';
import {
    View,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { requestPasswordReset, resetPassword } from '../src/api/auth';
import TextField from 'src/components/ui/TextField';
import PasswordField from 'src/components/ui/PasswordField';
import { Button } from 'src/components/ui/Button';
import AppText from '../src/components/ui/AppText';
import { COLOR_VARIANTS } from 'designs/designs-colors';
import { GlassMorphismWithCircle } from 'src/components/ui/GlassMorphismWithCircle';
import { GLASS_CARD_RADIUS } from 'src/components/ui/GlassMorphism';
import { CirclePosition } from 'src/components/ui/LinearGradientCircle';
import { useAppAlert } from 'src/context/alert';
import { PASSWORD_RESET_AUTH_SOURCE } from '../src/features/onboarding/authReturn';
import { useTranslation } from 'react-i18next';

const MIN_PASSWORD_LENGTH = 8;

export default function ForgotPasswordScreen() {
    const { t } = useTranslation('auth');
    const router = useRouter();
    const { returnTo, source } = useLocalSearchParams<{
        returnTo?: string;
        source?: string;
    }>();
    const { showAlert } = useAppAlert();
    const [email, setEmail] = useState('');
    const [token, setToken] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [step, setStep] = useState<'request' | 'reset' | 'done'>('request');
    const [loading, setLoading] = useState(false);

    const trimmedEmail = useMemo(() => email.trim(), [email]);
    const isTokenValid = token.length === 6;

    const handleTokenChange = useCallback((value: string) => {
        const digitsOnly = value.replace(/\D/g, '').slice(0, 6);
        setToken(digitsOnly);
    }, []);

    const handleRequest = async () => {
        if (!trimmedEmail) {
            showAlert(t('forgot.emailRequiredTitle'), t('forgot.emailRequiredMessage'));
            return;
        }

        setLoading(true);
        try {
            const responseMessage = await requestPasswordReset(trimmedEmail);
            setStep('reset');
            showAlert(
                t('forgot.checkEmailTitle'),
                responseMessage,
            );
        } catch (err) {
            const message = err instanceof Error ? err.message : t('forgot.requestFailedMessage');
            showAlert(t('forgot.requestFailedTitle'), message);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async () => {
        if (!isTokenValid) {
            showAlert(t('forgot.invalidCodeTitle'), t('forgot.invalidCodeMessage'));
            return;
        }

        if (!password || password.length < MIN_PASSWORD_LENGTH) {
            showAlert(t('forgot.weakPasswordTitle'), t('forgot.weakPasswordMessage', { count: MIN_PASSWORD_LENGTH }));
            return;
        }

        if (password !== confirm) {
            showAlert(t('forgot.mismatchTitle'), t('forgot.mismatchMessage'));
            return;
        }

        setLoading(true);
        try {
            await resetPassword(email, token, password);
            setStep('done');
        } catch (err) {
            const message = err instanceof Error ? err.message : t('forgot.resetFailedMessage');
            showAlert(t('forgot.resetFailedTitle'), message);
        } finally {
            setLoading(false);
        }
    };

    const handleReturnToLogin = () => {
        router.replace({
            pathname: '/(auth)/login',
            params: {
                ...(returnTo === undefined ? {} : { returnTo }),
                source: source ?? PASSWORD_RESET_AUTH_SOURCE,
            },
        });
    };

    return (
        <TouchableWithoutFeedback onPress={ Keyboard.dismiss } accessible={ false }>
            <View style={ { flex: 1 } }>
                <GlassMorphismWithCircle
                    circlePosition={ CirclePosition.BOTTOM_LEFT }
                    style={ styles.glassMorphism }
                    panelRadius={ GLASS_CARD_RADIUS }
                />
                <SafeAreaView style={ styles.root }>
                    <KeyboardAvoidingView behavior={ Platform.OS === 'ios' ? 'padding' : undefined } style={ styles.kav }>
                        <View style={ styles.card }>
                            { step === 'request' && (
                                <View style={ styles.content }>
                                    <AppText style={ styles.title } variant='h2'>
                                        { t('forgot.requestTitle') }
                                    </AppText>
                                    <AppText style={ styles.subtitle } variant='body'>
                                        { t('forgot.requestSubtitle') }
                                    </AppText>

                                    <TextField
                                        label={ t('field.email') }
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
                                        label={ t('forgot.sendCode') }
                                        onPress={ handleRequest }
                                        loading={ loading }
                                        addedStyles={ { marginTop: 8 } }
                                    />
                                </View>
                            ) }

                            { step === 'reset' && (
                                <View style={ styles.content }>
                                    <AppText style={ styles.title } variant='body'>
                                        { t('forgot.checkEmailTitle') }
                                    </AppText>
                                    <AppText style={ styles.subtitle } variant='body'>
                                        { t('forgot.resetSubtitle') }
                                    </AppText>
                                    <TextField
                                        label={ t('field.resetCode') }
                                        value={ token }
                                        onChangeText={ handleTokenChange }
                                        placeholder="6-digit code"
                                        autoCapitalize="none"
                                        autoCorrect={ false }
                                        textContentType="oneTimeCode"
                                        keyboardType="number-pad"
                                        maxLength={ 6 }
                                        returnKeyType="next"
                                    />
                                    <PasswordField
                                        label={ t('field.newPassword') }
                                        value={ password }
                                        onChangeText={ setPassword }
                                        placeholder="••••••••"
                                        textContentType="newPassword"
                                        returnKeyType="next"
                                    />

                                    <PasswordField
                                        label={ t('field.confirmPassword') }
                                        value={ confirm }
                                        onChangeText={ setConfirm }
                                        placeholder="••••••••"
                                        textContentType="newPassword"
                                        returnKeyType="done"
                                        onSubmitEditing={ handleReset }
                                    />

                                    <Button
                                        label={ t('forgot.updatePassword') }
                                        onPress={ handleReset }
                                        disabled={ !isTokenValid }
                                        loading={ loading }
                                        addedStyles={ { marginTop: 8 } }
                                    />
                                </View>
                            ) }

                            { step === 'done' && (
                                <View style={ styles.content }>
                                    <AppText style={ styles.title } variant='body'>
                                        { t('forgot.doneTitle') }
                                    </AppText>
                                    <AppText style={ styles.subtitle } variant='body'>
                                        { t('forgot.doneSubtitle') }
                                    </AppText>

                                    <Button label={ t('forgot.backToSignIn') } onPress={ handleReturnToLogin } />
                                </View>
                            ) }
                        </View>
                    </KeyboardAvoidingView>
                </SafeAreaView>
            </View>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
    glassMorphism: {
        padding: 6,
    },
    kav: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    card: {
        borderRadius: 16,
        padding: 24,
        gap: 16,
        shadowColor: COLOR_VARIANTS.black.primary,
        shadowOpacity: 0.06,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 12,
        elevation: 2,
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

// todo: create an alert component that can be used throughout the app
