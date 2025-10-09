import React from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, TextInput, View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Note } from "../../features/notes/useNotes";
import { Button } from "../ui/Button";
import AppText from "../ui/AppText";
import { COLOR_VARIANTS, THEME_COLORS } from 'designs/designs-colors';

type NotePreviewModalProps = {
    visible: boolean;
    note: Note | null;
    onClose: () => void;
    onUpdateNote: (id: string, text: string) => Promise<void>;
};

export function NotePreviewModal({ visible, note, onClose, onUpdateNote }: NotePreviewModalProps) {
    const [isEditing, setIsEditing] = React.useState(false);
    const [draft, setDraft] = React.useState('');
    const [saving, setSaving] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (!visible) {
            setIsEditing(false);
            setDraft('');
            setSaving(false);
            setError(null);
            return;
        }

        if (note && !isEditing) {
            setDraft(note.text);
        }
    }, [visible, note, isEditing]);

    const handleClose = React.useCallback(() => {
        setIsEditing(false);
        setError(null);
        setSaving(false);
        setDraft(note?.text ?? '');
        onClose();
    }, [note, onClose]);

    const handleStartEditing = React.useCallback(() => {
        if (!note) return;
        setDraft(note.text);
        setError(null);
        setIsEditing(true);
    }, [note]);

    const handleCancelEditing = React.useCallback(() => {
        setIsEditing(false);
        setError(null);
        if (note) {
            setDraft(note.text);
        } else {
            setDraft('');
        }
    }, [note]);

    const handleSave = React.useCallback(async () => {
        if (!note) return;
        const value = draft.trim();
        if (!value) {
            setError('Notes cannot be empty.');
            return;
        }

        try {
            setSaving(true);
            setDraft(value);
            await onUpdateNote(note.id, value);
            setIsEditing(false);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update note.');
        } finally {
            setSaving(false);
        }
    }, [draft, note, onUpdateNote]);

    return (
        <Modal
            visible={ visible }
            animationType="slide"
            // presentationStyle="fullScreen"
            onRequestClose={ handleClose }
        >
            <KeyboardAvoidingView
                behavior={ Platform.OS === 'ios' ? 'padding' : undefined }
                style={ styles.avoidingView }
            >
                <SafeAreaView style={ styles.modalRoot }>
                    <ScrollView
                        contentContainerStyle={ styles.modalContent }
                        keyboardShouldPersistTaps="handled"
                    >
                        <View>
                            <AppText style={ styles.modalDate }  variant="body">
                                { note ?
                                    new Date(note.createdAt).toLocaleString('en-US', {
                                        weekday: 'long',
                                        month: 'long',
                                        day: 'numeric',
                                        year: 'numeric',
                                        hour: 'numeric',
                                        minute: '2-digit',
                                    }) : null }
                            </AppText>
                            { isEditing ? (
                                <View style={ styles.editableTextContainer }>
                                    <TextInput
                                        value={ draft }
                                        onChangeText={ setDraft }
                                        multiline
                                        autoFocus
                                        style={ styles.editableText }
                                        textAlignVertical="top"
                                        accessibilityLabel="Edit note"
                                    />
                                </View>
                            ) : (
                                <AppText style={ styles.modalText } variant="body" >
                                    { note?.text ?? 'No note selected.' }
                                </AppText>
                            ) }
                            { error ? (
                                <AppText style={ styles.errorText } variant="caption">
                                    { error }
                                </AppText>
                            ) : null }
                        </View>
                    </ScrollView>
                    <View style={ styles.modalActions }>
                        { isEditing ? (
                            <>
                                <Button
                                    label="Save changes"
                                    onPress={ handleSave }
                                    loading={ saving }
                                />
                                <View style={ styles.actionSpacer } />
                                <Button
                                    label="Cancel"
                                    onPress={ handleCancelEditing }
                                    transparent
                                    disabled={ saving }
                                />
                            </>
                        ) : (
                            <>
                                <Button
                                    label="Edit"
                                    onPress={ handleStartEditing }
                                    disabled={ !note }
                                />
                                <View style={ styles.actionSpacer } />
                                <Button
                                    label="Close"
                                    onPress={ handleClose }
                                    transparent
                                />
                            </>
                        ) }
                    </View>
                </SafeAreaView>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    avoidingView: { flex: 1 },
    modalRoot: { flex: 1, backgroundColor: COLOR_VARIANTS.white.primary },
    modalContent: { padding: 24, paddingBottom: 120, paddingTop: 60 },
    modalActions: {
        position: 'absolute',
        left: 24,
        right: 24,
        bottom: 24,
    },
    actionSpacer: {
        height: 12,
    },
    modalDate: {
        fontSize: 14,
        marginBottom: 16,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
    },
    modalText: {
        fontSize: 18,
        lineHeight: 28,
        marginHorizontal: 5,
    },
    errorText: {
        marginTop: 12,
        color: THEME_COLORS.error,
        marginHorizontal: 5,
    },
    editableTextContainer: {
        marginHorizontal: 5,
        paddingTop: 12,
    },
    editableText: {
        fontSize: 18,
        lineHeight: 28,
        color: COLOR_VARIANTS.black.primary,
        padding: 0,
        minHeight: 160,
    },
});
