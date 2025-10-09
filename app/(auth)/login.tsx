import React, { useState } from 'react';
import {
    View,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/auth/AuthContext';
import SocialAuthButtons from '../../src/components/auth/SocialAuthButtons';
import { Button } from 'src/components/ui/Button';
import Spacer, { SpacerVariant } from 'src/components/ui/Spacer';
import TextField from 'src/components/ui/TextField';
import PasswordField from 'src/components/ui/PasswordField';
import AppText from '../../src/components/ui/AppText';
import { loginWithPassword } from '../../src/api/auth';
import { handleError } from 'src/utils';
import { InternalLink } from 'src/components/ui/InternalLink';
import { GlassMorphismWithCircle } from 'src/components/ui/GlassMorphismWithCircle';
import { CirclePosition } from 'src/components/ui/LinearGradientCircle';
import { useAppAlert } from '../../src/context/alert';

export default function LoginScreen() {
    const router = useRouter();
    const { setAuth } = useAuth();
    const { showAlert } = useAppAlert();

    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);

    const onSubmit = async () => {
        const trimmedEmail = email.trim();
        if (!trimmedEmail || !password) {
            showAlert('Missing info', 'Please enter email and password.');
            return;
        }
        setLoading(true);
        try {
            const { token, user: nextUser, refreshToken } = await loginWithPassword(trimmedEmail, password);
            await setAuth(token, nextUser, refreshToken ?? null);
            router.replace('/');
        } catch (error) {
            showAlert('Error', handleError(error));
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={ { flex: 1 } }>
            <GlassMorphismWithCircle circlePosition={ CirclePosition.BOTTOM_LEFT } style={ styles.glassMorphism } />
            <SafeAreaView edges={ ['top', 'left', 'right'] } style={ styles.root }>
                <KeyboardAvoidingView
                    behavior={ Platform.OS === 'ios' ? 'padding' : 'height' }
                    style={ styles.kav }
                >
                    <ScrollView
                        contentContainerStyle={ styles.scrollContent }
                        keyboardShouldPersistTaps='handled'
                        showsVerticalScrollIndicator={ false }
                    >
                        <View style={ styles.card }>
                            <AppText variant='h1' align='center'>
                                Sign In
                            </AppText>
                            <Spacer />

                            <View style={ styles.formContainer }>
                                <TextField
                                    label="Email"
                                    value={ email }
                                    onChangeText={ setEmail }
                                    autoCapitalize="none"
                                    autoCorrect={ false }
                                    keyboardType="email-address"
                                    placeholder="you@example.com"
                                    textContentType="username"
                                    returnKeyType="next"
                                />
                                <PasswordField
                                    label="Password"
                                    value={ password }
                                    onChangeText={ setPassword }
                                    placeholder="••••••••"
                                    textContentType="password"
                                    returnKeyType="done"
                                    onSubmitEditing={ onSubmit }
                                />
                                <TouchableOpacity onPress={ () => router.push('/forgot-password') } style={ styles.forgotPassword }>
                                    <AppText variant='caption'>
                                        Forgot password?
                                    </AppText>
                                </TouchableOpacity>
                                <Button label='Sign in' onPress={ onSubmit } loading={ loading } />
                                <Spacer variant={ SpacerVariant.large } />
                                <AppText variant='caption' align='center'>
                                    Or continue with
                                </AppText>
                                <Spacer variant={ SpacerVariant.large } />
                                <SocialAuthButtons onSuccess={ () => router.replace('/') } />
                                <Spacer />
                                <View style={ styles.signupRow }>
                                    <AppText variant='caption'>
                                        Don't have an account?
                                    </AppText>
                                    <InternalLink href="/(auth)/signup">
                                        { ' ' } Sign up here
                                    </InternalLink>
                                </View>
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    glassMorphism: {
        padding: 6,
    },
    root: {
        flex: 1,
        paddingHorizontal: 20,
        justifyContent: 'center',
        borderRadius: 16,
    },
    kav: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        width: '100%',
    },
    formContainer: {
        width: '100%',
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: 24,
    },
    signupRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
