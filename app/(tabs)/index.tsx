import React, { useState, useCallback } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, Pressable, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../src/context/auth/AuthContext';
import { useNotes } from '../../src/features/notes/useNotes';
import ErrorMessage from '../../src/components/ui/ErrorMessage';
import { GlassMorphismWithCircle } from '../../src/components/ui/GlassMorphismWithCircle';
import { COLOR_VARIANTS, PALETTE } from 'designs/designs-colors';
import { CirclePosition } from 'src/components/ui/LinearGradientCircle';


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
        <View style={ styles.container }>
            <View pointerEvents='none' style={ styles.background }>
                <GlassMorphismWithCircle circlePosition={ CirclePosition.BOTTOM_RIGHT } />
            </View>
            <SafeAreaView style={ styles.root } edges={ ['left', 'right', 'bottom', 'top'] }>
                <KeyboardAvoidingView
                    style={ styles.screen }
                    behavior={ Platform.OS === 'ios' ? 'padding' : 'height' }
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
                                        underlineColorAndroid={ COLOR_VARIANTS.transparent }
                                        style={ styles.textInput }
                                        placeholderTextColor={ COLOR_VARIANTS.black.tertiary }
                                        selectionColor={ COLOR_VARIANTS.white.quaternary }
                                    />
                                    <TouchableOpacity
                                        onPress={ handleNext }
                                        disabled={ isDisabled }
                                        style={ [styles.plusButton, isDisabled && styles.plusButtonDisabled] }
                                    >
                                        <Feather name="plus" size={ 44 } color={ COLOR_VARIANTS.black.tertiary } />
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
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingBottom: 40,
    },
    background: StyleSheet.absoluteFillObject,
    root: { flex: 1, position: 'relative' },
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
        backgroundColor: PALETTE.overlay.whiteSoftTransparent,
        shadowColor: PALETTE.overlay.blueGlowTransparent,
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
        backgroundColor: COLOR_VARIANTS.transparent,
        overflow: 'hidden',
        position: 'relative',
    },
    textInput: {
        flex: 1,
        fontSize: 18,
        lineHeight: 26,
        textAlignVertical: 'top',
        padding: 0,
        paddingBottom: 70,
    },
    plusButton: {
        position: 'absolute',
        right: 16,
        bottom: 16,
        padding: 4,
        // shadowColor: PALETTE.overlay.blueMildTransparent,
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
