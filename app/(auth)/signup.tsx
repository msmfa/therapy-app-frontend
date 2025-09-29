import React, { useState, useCallback, useMemo } from 'react';
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
    ScrollView,
    TouchableWithoutFeedback,
    Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/auth/AuthContext';
import { BASE_URL } from '../../src/const';
import { RegisterError, RegisterSuccess } from '../../src/api/signup';
import { handleError } from '../../src/utils/utils';

const PASSWORD_REQUIREMENTS = [
    'At least 8 characters',
    'One uppercase letter',
    'One lowercase letter',
    'One number',
    'One special character',
] as const;

type PasswordRequirement = (typeof PASSWORD_REQUIREMENTS)[number];

const validatePassword = (password: string): PasswordRequirement[] => {
    const errors: PasswordRequirement[] = [];

    if (password.length < 8) errors.push('At least 8 characters');
    if (!/[A-Z]/.test(password)) errors.push('One uppercase letter');
    if (!/[a-z]/.test(password)) errors.push('One lowercase letter');
    if (!/[0-9]/.test(password)) errors.push('One number');
    if (!/[!@#$%^&*]/.test(password)) errors.push('One special character');

    return errors;
};

const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase());

const TEXT_INPUT_PROPS = {
    autoCapitalize: 'none' as const,
    autoCorrect: false,
};

export default function SignUpScreen() {
    const router = useRouter();
    const { setAuth } = useAuth();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [loading, setLoading] = useState(false);

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [passwordErrors, setPasswordErrors] = useState<PasswordRequirement[]>([]);

    const passwordIsValid = useMemo(() => passwordErrors.length === 0, [passwordErrors]);

    const validateForm = useCallback(() => {
        const nextErrors: Record<string, string> = {};

        if (!name.trim()) nextErrors.name = 'First name is required';

        if (!email.trim()) {
            nextErrors.email = 'Email is required';
        } else if (!validateEmail(email)) {
            nextErrors.email = 'Invalid email format';
        }

        const nextPasswordErrors = validatePassword(password);
        setPasswordErrors(password ? nextPasswordErrors : []);

        if (!password) nextErrors.password = 'Password is required';
        if (!confirmPassword) {
            nextErrors.confirmPassword = 'Please confirm your password';
        } else if (password !== confirmPassword) {
            nextErrors.confirmPassword = 'Passwords do not match';
        }

        if (!acceptedTerms) nextErrors.terms = 'You must accept the terms';

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0 && nextPasswordErrors.length === 0;
    }, [acceptedTerms, confirmPassword, email, name, password]);

    const onSubmit = useCallback(async () => {
        if (!validateForm()) {
            Alert.alert('Validation Error', 'Please fix all errors before continuing');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${BASE_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email.trim().toLowerCase(),
                    password,
                    name: name.trim(),
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
            console.error(`Signup failed: ${handleError(err)}`);
            Alert.alert(`Signup failed: ${handleError(err)}`);
        } finally {
            setLoading(false);
        }
    }, [email, name, password, setAuth, validateForm]);

    return (
        <SafeAreaView style={ styles.root }>
            <KeyboardAvoidingView
                style={ styles.kav }
                behavior={ Platform.OS === 'ios' ? 'padding' : 'height' }
                keyboardVerticalOffset={ Platform.OS === 'ios' ? 24 : 0 }
            >
                <TouchableWithoutFeedback onPress={ Keyboard.dismiss }>
                    <ScrollView
                        contentInsetAdjustmentBehavior="always"
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={ styles.content }
                    >
                        <View style={ styles.card }>
                            <View style={ styles.header }>
                                <TouchableOpacity onPress={ () => router.back() } style={ styles.backButton }>
                                    <Ionicons name="arrow-back" size={ 24 } color="#111" />
                                </TouchableOpacity>
                                <Text style={ styles.title }>Create Account</Text>
                                <View style={ { width: 24 } } />
                            </View>

                            <Text style={ styles.subtitle }>Join us to start your therapy journey</Text>

                            <View style={ styles.fieldBlock }>
                                <Text style={ styles.label }>First Name</Text>
                                <TextInput
                                    { ...TEXT_INPUT_PROPS }
                                    value={ name }
                                    onChangeText={ setName }
                                    placeholder="John"
                                    style={ [styles.input, errors.name && styles.inputError] }
                                    textContentType="givenName"
                                    autoComplete="name-given"
                                />
                                { errors.name && <Text style={ styles.errorText }>{ errors.name }</Text> }
                            </View>

                            <View style={ styles.fieldBlock }>
                                <Text style={ styles.label }>Email</Text>
                                <TextInput
                                    { ...TEXT_INPUT_PROPS }
                                    keyboardType="email-address"
                                    value={ email }
                                    placeholder="you@example.com"
                                    onChangeText={ (val) => {
                                        setEmail(val);
                                        if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                                    } }
                                    style={ [styles.input, errors.email && styles.inputError] }
                                    textContentType="emailAddress"
                                    autoComplete="email"
                                />
                                { errors.email && <Text style={ styles.errorText }>{ errors.email }</Text> }
                            </View>

                            <PasswordField
                                label="Password"
                                value={ password }
                                onChange={ (val) => {
                                    setPassword(val);
                                    setPasswordErrors(validatePassword(val));
                                } }
                                visible={ showPassword }
                                onToggleVisibility={ () => setShowPassword((prev) => !prev) }
                                error={ errors.password }
                            />

                            { password.length > 0 && (
                                <View style={ styles.requirements }>
                                    { PASSWORD_REQUIREMENTS.map((req) => {
                                        const isMet = passwordErrors.includes(req) === false;
                                        return (
                                            <View key={ req } style={ styles.requirement }>
                                                <Ionicons
                                                    name={ isMet ? 'checkmark-circle' : 'close-circle' }
                                                    size={ 16 }
                                                    color={ isMet ? '#059669' : '#DC2626' }
                                                />
                                                <Text
                                                    style={ [
                                                        styles.requirementText,
                                                        isMet && styles.requirementMet,
                                                    ] }
                                                >
                                                    { req }
                                                </Text>
                                            </View>
                                        );
                                    }) }
                                </View>
                            ) }

                            <PasswordField
                                label="Confirm Password"
                                value={ confirmPassword }
                                onChange={ setConfirmPassword }
                                visible={ showConfirmPassword }
                                onToggleVisibility={ () => setShowConfirmPassword((prev) => !prev) }
                                error={ errors.confirmPassword }
                                autoComplete="off"
                            />

                            <TouchableOpacity
                                onPress={ () => setAcceptedTerms((prev) => !prev) }
                                style={ styles.termsRow }
                                activeOpacity={ 0.8 }
                            >
                                <View
                                    style={ [
                                        styles.checkbox,
                                        acceptedTerms && styles.checkboxChecked,
                                    ] }
                                >
                                    { acceptedTerms && (
                                        <Ionicons name="checkmark" size={ 16 } color="#fff" />
                                    ) }
                                </View>
                                <Text style={ styles.termsText }>
                                    I agree to the <Text style={ styles.link }>Terms of Service</Text> and{ ' ' }
                                    <Text style={ styles.link }>Privacy Policy</Text>
                                </Text>
                            </TouchableOpacity>
                            { errors.terms && <Text style={ styles.errorText }>{ errors.terms }</Text> }

                            <TouchableOpacity
                                disabled={ loading || !passwordIsValid }
                                onPress={ onSubmit }
                                style={ [
                                    styles.primaryButton,
                                    (loading || !passwordIsValid) && styles.buttonDisabled,
                                ] }
                            >
                                { loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={ styles.primaryButtonText }>Create Account</Text>
                                ) }
                            </TouchableOpacity>

                            <View style={ styles.footer }>
                                <Text style={ styles.footerText }>Already have an account?</Text>
                                <TouchableOpacity onPress={ () => router.replace('/login') }>
                                    <Text style={ styles.link }> Sign In</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </ScrollView>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

type PasswordFieldProps = {
    label: string;
    value: string;
    onChange: (val: string) => void;
    visible: boolean;
    onToggleVisibility: () => void;
    error?: string;
    autoComplete?: 'password' | 'off';
};

function PasswordField({
    label,
    value,
    onChange,
    visible,
    onToggleVisibility,
    error,
    autoComplete = 'password',
}: PasswordFieldProps) {
    return (
        <View style={ styles.fieldBlock }>
            <Text style={ styles.label }>{ label }</Text>
            <View style={ styles.passwordRow }>
                <TextInput
                    value={ value }
                    onChangeText={ onChange }
                    secureTextEntry={ !visible }
                    placeholder="••••••••"
                    style={ [styles.input, styles.passwordInput, error && styles.inputError] }
                    textContentType="none"
                    autoComplete={ autoComplete }
                    autoCorrect={ false }
                    autoCapitalize="none"
                    returnKeyType="done"
                />
                <TouchableOpacity onPress={ onToggleVisibility } style={ styles.eyeButton }>
                    <Ionicons name={ visible ? 'eye-off' : 'eye' } size={ 20 } color="#666" />
                </TouchableOpacity>
            </View>
            { error && <Text style={ styles.errorText }>{ error }</Text> }
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#fff' },
    kav: { flex: 1 },
    content: { flexGrow: 1, justifyContent: 'center', padding: 20 },
    card: { backgroundColor: 'transparent', gap: 20 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: { padding: 4 },
    title: { fontSize: 24, fontWeight: '700', textAlign: 'center', flex: 1 },
    subtitle: { textAlign: 'center', color: '#666', fontSize: 14 },
    fieldBlock: { gap: 8 },
    label: { fontWeight: '600', fontSize: 14, color: '#111' },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        backgroundColor: '#fff',
    },
    inputError: { borderColor: '#DC2626' },
    passwordRow: { flexDirection: 'row', alignItems: 'center', position: 'relative' },
    passwordInput: { flex: 1, paddingRight: 44 },
    eyeButton: { position: 'absolute', right: 12, padding: 4 },
    requirements: { gap: 4, marginTop: -8 },
    requirement: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    requirementText: { fontSize: 12, color: '#666' },
    requirementMet: { color: '#059669', textDecorationLine: 'line-through' },
    termsRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
    checkbox: {
        width: 20,
        height: 20,
        borderWidth: 2,
        borderColor: '#ddd',
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 2,
    },
    checkboxChecked: { backgroundColor: '#111', borderColor: '#111' },
    termsText: { flex: 1, fontSize: 14, color: '#666', lineHeight: 20 },
    link: { color: '#0066CC', fontWeight: '600' },
    primaryButton: {
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#111',
        alignItems: 'center',
    },
    primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    buttonDisabled: { opacity: 0.5 },
    footer: { flexDirection: 'row', justifyContent: 'center', gap: 4 },
    footerText: { color: '#666', fontSize: 14 },
    errorText: { color: '#DC2626', fontSize: 12 },
});
