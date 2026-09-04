import React, { useCallback, useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../src/context/auth/AuthContext';
import { handleError, validatePassword } from 'src/utils';
import { SafeAreaView } from 'react-native-safe-area-context';
import TextField from 'src/components/ui/TextField';
import PasswordField from 'src/components/ui/PasswordField';
import { Button } from 'src/components/ui/Button';
import AppText from '../../src/components/ui/AppText';
import Spacer, { SpacerVariant } from 'src/components/ui/Spacer';
import SocialAuthButtons from '../../src/components/auth/SocialAuthButtons';
import { registerAccount } from '../../src/api/auth';
import { useAppAlert } from '../../src/context/alert';
import { resolveAuthReturnRoute } from '../../src/features/onboarding/authReturn';
import { GlassMorphismWithCircle } from 'src/components/ui/GlassMorphismWithCircle';
import { BackButton } from 'src/components/ui/BackButton';
import { CirclePosition } from 'src/components/ui/LinearGradientCircle';

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export default function SignUpScreen() {
    const router = useRouter();
    const { setAuth } = useAuth();
    const { showAlert } = useAppAlert();
    const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();

    // See login.tsx: null means "fall back to '/' and re-run the normal routing".
    const returnRoute = resolveAuthReturnRoute(returnTo);

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = useCallback(() => {
        const nextErrors: Record<string, string> = {};

        if (!name.trim()) nextErrors.name = 'Name is required';
        if (!emailRegex.test(email.trim().toLowerCase())) nextErrors.email = 'Enter a valid email';
        const passwordError = validatePassword(password);
        if (passwordError) nextErrors.password = passwordError;
        if (password !== confirmPassword) nextErrors.confirmPassword = 'Passwords must match';

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    }, [name, email, password, confirmPassword]);

    const onSubmit = useCallback(async () => {
        if (!validate()) return;

        setLoading(true);
        try {
            const { token, user, refreshToken } = await registerAccount({ name, email, password });
            await setAuth(token, user, refreshToken ?? null);
            router.replace(returnRoute ?? '/');
        } catch (err) {
            showAlert("We couldn't create your account", handleError(err));
        } finally {
            setLoading(false);
        }
    }, [email, name, password, returnRoute, router, setAuth, showAlert, validate]);

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

                <KeyboardAvoidingView behavior={ Platform.OS === 'ios' ? 'padding' : 'height' }>
                    <ScrollView
                        contentContainerStyle={ styles.scrollContent }
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={ false }
                    >
                        <View style={ styles.header }>
                            <AppText variant="h1">Create your account</AppText>
                            <AppText variant="bodySecondary">
                                Save your between-session plan and keep your schedule connected.
                            </AppText>
                        </View>
                        <TextField
                            label="Name"
                            value={ name }
                            onChangeText={ setName }
                            autoCapitalize="words"
                            autoCorrect={ false }
                            placeholder="Jane Doe"
                            textContentType="name"
                            returnKeyType="next"
                            error={ errors.name }
                            editable={ !loading }
                        />
                        <TextField
                            label="Email"
                            value={ email }
                            onChangeText={ setEmail }
                            autoCapitalize="none"
                            autoCorrect={ false }
                            keyboardType="email-address"
                            placeholder="you@example.com"
                            textContentType="emailAddress"
                            returnKeyType="next"
                            error={ errors.email }
                            editable={ !loading }
                        />
                        <PasswordField
                            label="Password"
                            value={ password }
                            onChangeText={ setPassword }
                            placeholder="••••••••"
                            textContentType="newPassword"
                            returnKeyType="next"
                            error={ errors.password }
                            editable={ !loading }
                        />
                        <PasswordField
                            label="Confirm Password"
                            value={ confirmPassword }
                            onChangeText={ setConfirmPassword }
                            placeholder="••••••••"
                            textContentType="newPassword"
                            returnKeyType="done"
                            onSubmitEditing={ onSubmit }
                            error={ errors.confirmPassword }
                            editable={ !loading }
                        />
                        <Button
                            label="Create account"
                            onPress={ onSubmit }
                            loading={ loading }
                            addedStyles={ { marginTop: 8 } }
                        />
                        <Spacer variant={ SpacerVariant.large } />
                        <View style={ styles.oauthSection }>
                            <AppText variant="caption" align="center">
                                Or continue with
                            </AppText>
                            <Spacer variant={ SpacerVariant.large } />
                            <SocialAuthButtons
                                onSuccess={ () => router.replace(returnRoute ?? '/') }
                                disabled={ loading }
                            />
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
    root: {
        flex: 1,
        justifyContent: 'center',
    },
    glassMorphism: {
        flex: 1,
        padding: 6,
        zIndex: 0,
    },
    header: {
        marginBottom: 24,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 34,
        justifyContent: 'center',
        paddingTop: 32,
    },
    oauthSection: { alignItems: 'center', marginBottom: 16 },
});
