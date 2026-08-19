import React from 'react';
import { Modal, ScrollView, TextInput, View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Note } from "../../features/notes/useNotes";
import { useKeyboardInset } from "../../hooks/useKeyboardInset";
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

    const insets = useSafeAreaInsets();
    const keyboardInset = useKeyboardInset();

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

    const noteDate = note ?
        new Date(note.createdAt).toLocaleString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        }) : null;

    const errorMessage = error ? (
        <AppText style={ styles.errorText } variant="caption">
            { error }
        </AppText>
    ) : null;

    return (
        <Modal
            visible={ visible }
            animationType="slide"
            // presentationStyle="fullScreen"
            onRequestClose={ handleClose }
        >
            { /* The keyboard already covers the home indicator, so the bottom
                 inset is the larger of the two rather than their sum. */ }
            <View
                testID="note-modal-root"
                style={ [
                    styles.modalRoot,
                    {
                        paddingTop: insets.top,
                        paddingBottom: Math.max(insets.bottom, keyboardInset),
                    },
                ] }
            >
                { isEditing ? (
                    /* No ScrollView here on purpose: a multiline TextInput is a
                       UITextView, which scrolls itself and keeps the caret in
                       view as you type. Nesting it in a ScrollView makes it grow
                       instead, and nothing follows the caret. */
                    <View style={ styles.editor }>
                        <AppText style={ styles.modalDate } variant="body">
                            { noteDate }
                        </AppText>
                        <TextInput
                            value={ draft }
                            onChangeText={ setDraft }
                            multiline
                            autoFocus
                            style={ styles.editableText }
                            textAlignVertical="top"
                            accessibilityLabel="Edit note"
                        />
                        { errorMessage }
                    </View>
                ) : (
                    <ScrollView
                        style={ styles.reader }
                        contentContainerStyle={ styles.readerContent }
                        keyboardShouldPersistTaps="handled"
                    >
                        <AppText style={ styles.modalDate } variant="body">
                            { noteDate }
                        </AppText>
                        <AppText style={ styles.modalText } variant="body" >
                            { note?.text ?? 'No note selected.' }
                        </AppText>
                        { errorMessage }
                    </ScrollView>
                ) }
                { /* A real sibling row, so it cannot overlap the text above it
                     however the buttons or Dynamic Type change size. */ }
                <View testID="note-modal-actions" style={ styles.modalActions }>
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
                            />
                        </>
                    ) }
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalRoot: { flex: 1, backgroundColor: COLOR_VARIANTS.white.primary },
    reader: { flex: 1 },
    readerContent: { padding: 24, paddingTop: 60 },
    editor: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 24,
    },
    modalActions: {
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 16,
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
    editableText: {
        flex: 1,
        fontSize: 18,
        lineHeight: 28,
        color: COLOR_VARIANTS.black.primary,
        padding: 0,
        marginHorizontal: 5,
    },
});
