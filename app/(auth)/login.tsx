import React, { useState } from 'react';
import {
    View,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '../../src/context/auth/AuthContext';
import SocialAuthButtons from '../../src/components/auth/SocialAuthButtons';
import { Button } from 'src/components/ui/Button';
import Spacer, { SpacerVariant } from 'src/components/ui/Spacer';
import TextField from 'src/components/ui/TextField';
import PasswordField from 'src/components/ui/PasswordField';
import AppText from '../../src/components/ui/AppText';
import { loginWithPassword } from '../../src/api/auth';
import { handleError } from 'src/utils';
import { COLOR_VARIANTS, palette } from '../../new-design';

export default function LoginScreen() {
    const router = useRouter();
    const { setAuth, signOut, isAuthenticated, user } = useAuth();

    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);

    const onSubmit = async () => {
        const trimmedEmail = email.trim();
        if (!trimmedEmail || !password) {
            Alert.alert('Missing info', 'Please enter email and password.');
            return;
        }
        setLoading(true);
        try {
            const { token, user: nextUser, refreshToken } = await loginWithPassword(trimmedEmail, password);
            await setAuth(token, nextUser, refreshToken ?? null);
            router.replace('/');
        } catch (error) {
            Alert.alert('Error', handleError(error));
        } finally {
            setLoading(false);
        }
    };

    const onLogout = async () => {
        await signOut();
    };

    return (
        <SafeAreaView edges={ ['top', 'left', 'right'] } style={ styles.root }>
            <KeyboardAvoidingView
                behavior={ Platform.OS === 'ios' ? 'padding' : 'height' }
                keyboardVerticalOffset={ Platform.OS === 'ios' ? 24 : 0 }
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
                        { isAuthenticated ? (
                            <>
                                <View style={ styles.authenticatedContainer }>
                                    <AppText variant='h1'>
                                        Signed in as
                                    </AppText>
                                    <AppText variant='h1'>
                                        { user?.email }
                                    </AppText>
                                </View>
                                <Button label="Go to Home" onPress={ () => router.replace('/') } />
                                <Spacer />
                                <Button label="Log out" onPress={ onLogout } transparent />
                            </>
                        ) : (
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
                                <View style={ styles.dividerContainer }>
                                    <View style={ styles.divider } />
                                    <AppText variant='caption'>
                                        Or continue with
                                    </AppText>
                                    <View style={ styles.divider } />
                                </View>
                                <Spacer variant={ SpacerVariant.large } />
                                <SocialAuthButtons onSuccess={ () => router.replace('/') } />
                                <Spacer />
                                <View style={ styles.signupRow }>
                                    <AppText variant='caption'>
                                        Don't have an account?
                                    </AppText>
                                    <Link href="/(auth)/signup" style={ styles.signupLink }>
                                        { ' ' } Sign up here
                                    </Link>
                                </View>
                            </View>
                        ) }
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: palette.neutral.white,
        paddingHorizontal: 20,
    },
    kav: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingTop: 40,
        paddingBottom: 24,
    },
    card: {
        width: '100%',
    },
    authenticatedContainer: {
        marginBottom: 24,
    },
    formContainer: {
        width: '100%',
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: 24,
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: palette.neutral.boundary,
    },
    signupRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    signupLink: {
        color: COLOR_VARIANTS.blue.mid,
        fontSize: 14,
        fontWeight: '600',
    },
});
