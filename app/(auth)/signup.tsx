import React, { useCallback, useState } from 'react';
import {
    ScrollView,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/auth/AuthContext';
import { BASE_URL } from '../../src/const';
import { RegisterError, RegisterSuccess } from '../../src/api/signup';
import { handleError } from '../../src/utils/utils';
import { SafeAreaView } from 'react-native-safe-area-context';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignUpScreen() {
    const router = useRouter();
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
                        <Text style={ styles.title }>Create Account</Text>
                        <Text style={ styles.subtitle }>Join to start your therapy journey</Text>
                    </View>

                    <View style={ styles.fieldGroup }>
                        <Text style={ styles.label }>Name</Text>
                        <TextInput
                            value={ name }
                            onChangeText={ setName }
                            autoCapitalize="words"
                            autoCorrect={ false }
                            placeholder="Jane Doe"
                            style={ [styles.input, errors.name && styles.inputError] }
                        />
                        { errors.name && <Text style={ styles.error }>{ errors.name }</Text> }
                    </View>

                    <View style={ styles.fieldGroup }>
                        <Text style={ styles.label }>Email</Text>
                        <TextInput
                            value={ email }
                            onChangeText={ setEmail }
                            autoCapitalize="none"
                            autoCorrect={ false }
                            keyboardType="email-address"
                            placeholder="you@example.com"
                            style={ [styles.input, errors.email && styles.inputError] }
                        />
                        { errors.email && <Text style={ styles.error }>{ errors.email }</Text> }
                    </View>

                    <View style={ styles.fieldGroup }>
                        <Text style={ styles.label }>Password</Text>
                        <TextInput
                            value={ password }
                            onChangeText={ setPassword }
                            secureTextEntry
                            autoCapitalize="none"
                            autoCorrect={ false }
                            textContentType='newPassword'
                            placeholder="••••••••"
                            style={ [styles.input, errors.password && styles.inputError] }
                        />
                        { errors.password && <Text style={ styles.error }>{ errors.password }</Text> }
                    </View>

                    <View style={ styles.fieldGroup }>
                        <Text style={ styles.label }>Confirm Password</Text>
                        <TextInput
                            value={ confirmPassword }
                            onChangeText={ setConfirmPassword }
                            secureTextEntry
                            autoCapitalize="none"
                            autoCorrect={ false }
                            placeholder="••••••••"
                            style={ [styles.input, errors.confirmPassword && styles.inputError] }
                        />
                        { errors.confirmPassword && (
                            <Text style={ styles.error }>{ errors.confirmPassword }</Text>
                        ) }
                    </View>

                    <TouchableOpacity
                        onPress={ onSubmit }
                        disabled={ loading }
                        style={ [styles.button, loading && styles.buttonDisabled] }
                    >
                        { loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={ styles.buttonText }>Create Account</Text>
                        ) }
                    </TouchableOpacity>

                    <TouchableOpacity onPress={ () => router.replace('/login') } style={ styles.loginLink }>
                        <Text style={ styles.loginText }>Already have an account? Sign in</Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#fff' },
    flex: { flex: 1 },
    content: { padding: 24, flexGrow: 1, justifyContent: 'center' },
    header: { marginBottom: 24 },
    title: { fontSize: 28, fontWeight: '700', textAlign: 'center', color: '#111' },
    subtitle: { fontSize: 14, textAlign: 'center', color: '#555', marginTop: 8 },
    fieldGroup: { marginBottom: 16 },
    label: { fontSize: 14, fontWeight: '600', color: '#111', marginBottom: 6 },
    input: {
        borderWidth: 1,
        borderColor: '#d4d4d4',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        backgroundColor: '#fff',
    },
    inputError: { borderColor: '#dc2626' },
    error: { color: '#dc2626', fontSize: 12, marginTop: 4 },
    button: {
        backgroundColor: '#111',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    loginLink: { marginTop: 24, alignItems: 'center' },
    loginText: { color: '#0a6cff', fontSize: 14, fontWeight: '600' },
});
