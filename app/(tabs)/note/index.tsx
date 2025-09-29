import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useNotes } from '../../../src/hooks/useNotes';
import { useAuth } from '../../../src/auth/AuthContext';

export default function NewNoteScreen() {
    const router = useRouter();
    const { user } = useAuth();

    const { addNote } = useNotes(user?.id);
    const [text, setText] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleNext = useCallback(async () => {
        const value = text.trim();
        if (!value) {
            setError('Please enter a message');
            return;
        }

        try {
            await addNote(value);
            setText('');
            setError(null);
            router.replace('/(tabs)/notes');
        } catch (err) {
            console.error('addNote failed', err);
            setError('Unable to save note right now.');
        }
    }, [addNote, router, text]);

    const isDisabled = text.trim().length === 0;

    return (
        <SafeAreaView style={ styles.root } edges={ ['left', 'right', 'bottom'] }>
            <View style={ styles.fillCenter }>
                <View style={ [styles.card, styles.inputCentered] }>
                    <TextInput
                        placeholder="Thoughts?"
                        value={ text }
                        onChangeText={ setText }
                        multiline
                        numberOfLines={ 6 }
                        underlineColorAndroid="transparent"
                        style={ styles.textInput }
                        placeholderTextColor="#A97C8C"
                        selectionColor="#9E3D5E"
                    />
                </View>

                { error ? <Text style={ styles.error }>{ error }</Text> : null }

                <Pressable
                    onPress={ handleNext }
                    style={ [styles.primaryBtn, isDisabled && styles.primaryBtnDisabled] }
                    accessibilityRole="button"
                    disabled={ isDisabled }
                >
                    <Text style={ styles.primaryBtnText }>Next</Text>
                </Pressable>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: 'transparent' },
    fillCenter: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
        gap: 12,
    },
    card: {
        padding: 12,
        borderRadius: 10,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#E9BFCB',
    },
    inputCentered: { width: '90%', maxWidth: 560 },
    textInput: {
        minHeight: 140,
        paddingTop: 12,
        paddingBottom: 12,
        paddingHorizontal: 0,
        fontSize: 16,
        lineHeight: 22,
        textAlignVertical: 'top',
    },
    error: { color: 'red', textAlign: 'center' },
    primaryBtn: {
        backgroundColor: '#111',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    primaryBtnDisabled: {
        opacity: 0.5,
    },
    primaryBtnText: { color: '#fff', fontWeight: '700' },
});
