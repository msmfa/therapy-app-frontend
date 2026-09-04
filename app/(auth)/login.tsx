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
import { useLocalSearchParams, useRouter } from 'expo-router';
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
import { BackButton } from 'src/components/ui/BackButton';
import { CirclePosition } from 'src/components/ui/LinearGradientCircle';
import { useAppAlert } from '../../src/context/alert';
import { resolveAuthReturnRoute } from '../../src/features/onboarding/authReturn';

export default function LoginScreen() {
    const router = useRouter();
    const { setAuth } = useAuth();
    const { showAlert } = useAppAlert();
    const { returnTo, source } = useLocalSearchParams<{
        returnTo?: string;
        source?: string;
    }>();

    // Set when sign-in was opened from a specific step of onboarding. Without it
    // we fall back to '/', which re-runs the normal routing decision: returning
    // users who already finished onboarding land in the main app, and everyone
    // else resumes onboarding.
    const returnRoute = resolveAuthReturnRoute(returnTo);

    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);

    const onSubmit = async () => {
        const trimmedEmail = email.trim();
        if (!trimmedEmail || !password) {
            showAlert('Enter your details', 'Enter your email and password.');
            return;
        }
        setLoading(true);
        try {
            const {
                token,
                user: nextUser,
                refreshToken,
            } = await loginWithPassword(trimmedEmail, password);
            await setAuth(token, nextUser, refreshToken ?? null);
            router.replace(returnRoute ?? '/');
        } catch (error) {
            showAlert("We couldn't sign you in", handleError(error));
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={ { flex: 1 } }>
            <GlassMorphismWithCircle
                circlePosition={ CirclePosition.BOTTOM_LEFT }
                style={ styles.glassMorphism }
            />
            <SafeAreaView edges={ ['top', 'left', 'right'] } style={ styles.root }>
                { /* Present only when this screen was pushed onto something, which is
                     how onboarding's account step reaches it. Nothing renders when
                     auth is the root, so the app entry point is unchanged. */ }
                <View style={ styles.backRow }>
                    <BackButton />
                </View>

                <KeyboardAvoidingView
                    behavior={ Platform.OS === 'ios' ? 'padding' : 'height' }
                    style={ styles.kav }
                >
                    <ScrollView
                        contentContainerStyle={ styles.scrollContent }
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={ false }
                    >
                        <View style={ styles.card }>
                            <AppText variant="h1" align="center">
                                Sign in
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
                                    editable={ !loading }
                                />
                                <PasswordField
                                    label="Password"
                                    value={ password }
                                    onChangeText={ setPassword }
                                    placeholder="••••••••"
                                    textContentType="password"
                                    returnKeyType="done"
                                    onSubmitEditing={ onSubmit }
                                    editable={ !loading }
                                />
                                <TouchableOpacity
                                    onPress={ () => router.push({
                                        pathname: '/forgot-password',
                                        params: {
                                            ...(returnTo === undefined ? {} : { returnTo }),
                                            ...(source === undefined ? {} : { source }),
                                        },
                                    }) }
                                    style={ styles.forgotPassword }
                                    disabled={ loading }
                                >
                                    <AppText variant="caption">Forgot password?</AppText>
                                </TouchableOpacity>
                                <Button label="Sign in" onPress={ onSubmit } loading={ loading } />
                                <Spacer variant={ SpacerVariant.large } />
                                <AppText variant="caption" align="center">
                                    Or continue with
                                </AppText>
                                <Spacer variant={ SpacerVariant.large } />
                                <SocialAuthButtons
                                    onSuccess={ () => router.replace(returnRoute ?? '/') }
                                    disabled={ loading }
                                />
                                <Spacer />
                                { /* Only where signing up here keeps the flow's order.
                                     Opened from onboarding's account step there is a
                                     return route, so a new account is still created
                                     after the plan is chosen and comes straight back to
                                     the purchase handoff. Opened from Welcome, or as the
                                     app's entry point, there is none: offering signup
                                     there would be a second front door into the app that
                                     skips the plan, so the way on is the back button. */ }
                                { returnRoute !== null && (
                                    <View style={ styles.signupRow }>
                                        <AppText variant="caption">Don't have an account?</AppText>
                                        <InternalLink
                                            href={ {
                                                pathname: '/(auth)/signup',
                                                params: { returnTo },
                                            } }
                                        >
                                            { ' ' }
                                            Sign up here
                                        </InternalLink>
                                    </View>
                                ) }
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    backRow: {
        paddingHorizontal: 20,
    },
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
