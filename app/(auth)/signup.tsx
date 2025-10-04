import React, { useCallback, useState } from 'react';
import {
    ScrollView,
    View,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useAuth } from '../../src/auth/AuthContext';
import { BASE_URL } from '../../src/const';
import { RegisterError, RegisterSuccess } from '../../src/api/signup';
import { handleError } from '../../src/utils/utils';
import { SafeAreaView } from 'react-native-safe-area-context';
import TextField from 'src/components/ui/TextField';
import PasswordField from 'src/components/ui/PasswordField';
import { Button } from 'src/components/ui/button';
import AppText from '../../src/components/ui/typography';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignUpScreen() {
    const { setAuth } = useAuth();

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
        if (password.length < 8) nextErrors.password = 'Password must be at least 8 characters';
        if (password !== confirmPassword) nextErrors.confirmPassword = 'Passwords must match';

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    }, [name, email, password, confirmPassword]);

    const onSubmit = useCallback(async () => {
        if (!validate()) return;

        setLoading(true);
        try {
            const res = await fetch(`${BASE_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name.trim(),
                    email: email.trim().toLowerCase(),
                    password,
                }),
            });

            if (res.ok) {
                const { token, user } = (await res.json()) as RegisterSuccess;
                await setAuth(token, user);
                return;
            }

            const { error } = (await res.json()) as RegisterError;
            throw new Error(error ?? 'Signup failed');
        } catch (err) {
            Alert.alert('Signup failed', handleError(err));
        } finally {
            setLoading(false);
        }
    }, [email, name, password, setAuth, validate]);

    return (
        <SafeAreaView style={ styles.root }>
            <KeyboardAvoidingView
                style={ styles.flex }
                behavior={ Platform.OS === 'ios' ? 'padding' : undefined }
            >
                <ScrollView contentContainerStyle={ styles.content } keyboardShouldPersistTaps="handled">
                    <View style={ styles.header }>
                        <AppText variant='h1'>
                            Create Account
                        </AppText>
                        <AppText variant='bodySecondary'>
                            Join to start your therapy journey
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
                    />

                    <PasswordField
                        label="Password"
                        value={ password }
                        onChangeText={ setPassword }
                        placeholder="••••••••"
                        textContentType="newPassword"
                        returnKeyType="next"
                        error={ errors.password }
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
                    />

                    <Button
                        label="Create Account"
                        onPress={ onSubmit }
                        loading={ loading }
                        addedStyles={ { marginTop: 8 } }
                    />
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#FFFFFF' },
    flex: { flex: 1 },
    content: { padding: 24, flexGrow: 1, justifyContent: 'center' },
    header: { marginBottom: 24 },
});
