import React, { useState, useCallback } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, Pressable, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../src/auth/AuthContext';
import { useNotes } from '../../src/hooks/useNotes';
import ErrorMessage from '../../src/components/ui/ErrorMessage';


export default function NewNoteScreen() {
    const router = useRouter();
    const { user } = useAuth();

    const { addNote } = useNotes(user?.id);
    const [text, setText] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleNext = useCallback(async () => {
        const value = text.trim();
        if (!value) {
            return;
        }

        try {
            await addNote(value);
            setText('');
            setError(null);
            Keyboard.dismiss();

            requestAnimationFrame(() => router.replace('/(tabs)/notes'));
        } catch (err) {
            console.error('addNote failed', err);
            setError('Unable to save note right now.');
        }
    }, [addNote, router, text]);

    const isDisabled = text.trim().length === 0;

    return (
        <SafeAreaView style={ styles.root } edges={ ['left', 'right', 'bottom', 'top'] }>
            <LinearGradient
                colors={ ['#FF777C', '#F6B7B9FF', '#F0C7CAFF', '#E1E6EA', '#E1E6EA', '#DBE0E4'] }
                start={ { x: 0.5, y: 0 } }
                end={ { x: 0.5, y: 1 } }
                style={ styles.backgroundGradient }
            />
            <KeyboardAvoidingView
                style={ styles.screen }
                behavior={ Platform.OS === 'ios' ? 'padding' : 'height' }
                keyboardVerticalOffset={ Platform.OS === 'ios' ? 0 : 0 }
            >
                <Pressable style={ styles.content } onPress={ Keyboard.dismiss }>
                    <View style={ styles.body }>
                        <View style={ styles.cardWrapper }>
                            <View style={ styles.cardOverlay }>
                                <TextInput
                                    placeholder="Add your notes here..."
                                    value={ text }
                                    onChangeText={ setText }
                                    multiline
                                    numberOfLines={ 10 }
                                    underlineColorAndroid="transparent"
                                    style={ styles.textInput }
                                    placeholderTextColor="#28304A59"
                                    selectionColor="#FF7B9B"
                                />
                                <TouchableOpacity
                                    onPress={ handleNext }
                                    disabled={ isDisabled }
                                    style={ [styles.plusButton, isDisabled && styles.plusButtonDisabled] }
                                >
                                    <Feather name="plus" size={ 44 } color="#6A4D50FF" />
                                </TouchableOpacity>
                            </View>
                        </View>
                        { error ? <ErrorMessage message={ error } /> : null }
                    </View>

                    <View style={ styles.footer }>
                    </View>
                </Pressable>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, position: 'relative' },
    backgroundGradient: StyleSheet.absoluteFillObject,
    screen: {
        flex: 1,
        paddingTop: 16,
        paddingHorizontal: 24,
        paddingBottom: Platform.select({ ios: 0, android: 0 }),
    },
    content: {
        flex: 1,
        justifyContent: 'center',
    },
    body: {
        flex: 1,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'stretch',
    },
    cardWrapper: {
        flex: 1,
        borderRadius: 30,
        backgroundColor: '#FFFFFF38',
        shadowColor: '#56A8FF73',
        shadowOffset: { width: 0, height: 22 },
        shadowOpacity: 0.5,
        shadowRadius: 40,
        elevation: 24,
        alignSelf: 'stretch',
    },
    cardOverlay: {
        flex: 1,
        borderRadius: 26,
        paddingVertical: 22,
        paddingHorizontal: 28,
        backgroundColor: '#00000000',
        overflow: 'hidden',
        position: 'relative',
    },
    textInput: {
        flex: 1,
        fontSize: 18,
        lineHeight: 26,
        color: '#1F2538',
        textAlignVertical: 'top',
        padding: 0,
        paddingBottom: 70,
    },
    plusButton: {
        position: 'absolute',
        right: 16,
        bottom: 16,
        padding: 4,
        shadowColor: '#8CACE840',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 10,
    },
    plusButtonDisabled: {
        opacity: 0.5,
    },
    footer: {
        alignItems: 'center',
        marginTop: 24,
        marginBottom: 12,
    },
});
