import React from 'react';
import { ImageSourcePropType, Modal, ScrollView, TextInput, TouchableOpacity, View, StyleSheet } from "react-native";
import { ImageBackground } from 'expo-image';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Note } from "../../features/notes/useNotes";
import { useKeyboardInset } from "../../hooks/useKeyboardInset";
import { GlassCircleButton } from '../ui/GlassCircleButton';
import { GlassPillButton } from '../ui/GlassPillButton';
import { GlassButtonOutline } from '../ui/GlassButtonOutline';
import AppText from "../ui/AppText";
import { COLOR_VARIANTS, THEME_COLORS } from 'designs/designs-colors';
import { useTranslation } from 'react-i18next';
import { formattingLocale } from '../../i18n';

// Matches the cheatsheet's ink so the two paper screens read as a pair.
const INK = 'hsl(219, 52%, 14%)';

// Both header buttons share a height so the tray outline hugs them with one radius.
const HEADER_BUTTON = 56;

type NotePreviewModalProps = {
    visible: boolean;
    note: Note | null;
    onClose: () => void;
    onUpdateNote: (id: string, text: string) => Promise<void>;
    /** Omitted where a note is not the caller's to remove; the row is then absent. */
    onDeleteNote?: (id: string) => Promise<void>;
    /**
     * False when no reminder is currently answerable, or when this slot has
     * already been ticked. Either way there is nothing a press could record.
     */
    canReview?: boolean;
    onReviewed?: (note: Note) => Promise<void> | void;
};

export function NotePreviewModal({
    visible,
    note,
    onClose,
    onUpdateNote,
    onDeleteNote,
    canReview = false,
    onReviewed,
}: NotePreviewModalProps) {
    const { t } = useTranslation('notes');
    const { t: tCommon } = useTranslation('common');
    const [isEditing, setIsEditing] = React.useState(false);
    const [draft, setDraft] = React.useState('');
    const [saving, setSaving] = React.useState(false);
    const saveInFlight = React.useRef(false);
    const [error, setError] = React.useState<string | null>(null);
    // The confirmation is a second state of the action row rather than an
    // alert. `AppAlertProvider` mounts its modal above this component, and on
    // iOS a modal presented from outside the presented one is drawn behind it,
    // so the confirm would have been invisible from in here.
    const [confirmingDelete, setConfirmingDelete] = React.useState(false);

    const insets = useSafeAreaInsets();
    const keyboardInset = useKeyboardInset();

    React.useEffect(() => {
        if (!visible) {
            setIsEditing(false);
            setDraft('');
            setSaving(false);
            setError(null);
            setConfirmingDelete(false);
            return;
        }

        if (note && !isEditing) {
            setDraft(note.text);
        }
    }, [visible, note, isEditing]);

    const handleClose = React.useCallback(() => {
        if (saveInFlight.current) return;
        setIsEditing(false);
        setError(null);
        setSaving(false);
        setConfirmingDelete(false);
        setDraft(note?.text ?? '');
        onClose();
    }, [note, onClose]);

    const handleReviewed = React.useCallback(async () => {
        if (saveInFlight.current) return;
        if (!note || !onReviewed) return;
        saveInFlight.current = true;
        setSaving(true);
        setError(null);
        try {
            await onReviewed(note);
            saveInFlight.current = false;
            handleClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : t('review.saveFailed'));
        } finally {
            saveInFlight.current = false;
            setSaving(false);
        }
    }, [handleClose, note, onReviewed]);

    const handleStartEditing = React.useCallback(() => {
        if (!note || saveInFlight.current) return;
        setDraft(note.text);
        setError(null);
        setConfirmingDelete(false);
        setIsEditing(true);
    }, [note]);

    const handleDelete = React.useCallback(async () => {
        if (!note || !onDeleteNote || saveInFlight.current) return;
        saveInFlight.current = true;
        setSaving(true);
        setError(null);
        try {
            await onDeleteNote(note.id);
            // Cleared before closing: `handleClose` refuses to run while a
            // write is in flight, the same guard the review button releases.
            saveInFlight.current = false;
            setConfirmingDelete(false);
            handleClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : t('editor.deleteFailed'));
            setConfirmingDelete(false);
        } finally {
            saveInFlight.current = false;
            setSaving(false);
        }
    }, [handleClose, note, onDeleteNote, t]);

    const handleCancelEditing = React.useCallback(() => {
        if (saveInFlight.current) return;
        setIsEditing(false);
        setError(null);
        if (note) {
            setDraft(note.text);
        } else {
            setDraft('');
        }
    }, [note]);

    const handleSave = React.useCallback(async () => {
        if (!note || saveInFlight.current) return;
        const value = draft.trim();
        if (!value) {
            setError(t('editor.empty'));
            return;
        }
        if (value === note.text) {
            setIsEditing(false);
            setError(null);
            return;
        }

        saveInFlight.current = true;
        try {
            setSaving(true);
            setDraft(value);
            await onUpdateNote(note.id, value);
            setIsEditing(false);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : t('editor.updateFailed'));
        } finally {
            saveInFlight.current = false;
            setSaving(false);
        }
    }, [draft, note, onUpdateNote]);

    const noteDate = note ? (() => {
        const created = new Date(note.createdAt);
        // 'en-US' was hardcoded here, so a French note header read
        // "THURSDAY at 7:15pm". The locale carries the 24-hour clock too, so
        // the meridiem simply does not appear in French and the replace below
        // finds nothing to do.
        const locale = formattingLocale();
        const weekday = created.toLocaleString(locale, { weekday: 'long' }).toUpperCase();
        const time = created
            .toLocaleString(locale, { hour: 'numeric', minute: '2-digit' })
            // The runtime puts a narrow no-break space before the meridiem.
            .replace(/\s*(AM|PM)$/i, (_match, meridiem: string) => meridiem.toLowerCase());
        return t('dateHeading', { weekday, time });
    })() : null;

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
            <ImageBackground
                source={ require('../../../assets/textures/paper-blue.webp') as ImageSourcePropType }
                contentFit="cover"
                style={ styles.modalRoot }
            >
                { /* The padded box keeps its own testID: ImageBackground spreads
                     stray props onto its inner Image, not onto the styled view. */ }
                <View
                    testID="note-modal-root"
                    style={ [
                        styles.modalInner,
                        {
                            paddingTop: insets.top,
                            paddingBottom: Math.max(insets.bottom, keyboardInset),
                        },
                    ] }
                >
                    <View style={ styles.header }>
                        { /* Brighter than the home screen's: pale paper needs more white to read. */ }
                        <GlassButtonOutline buttonSize={ HEADER_BUTTON } opacity={ 0.9 } />
                        <GlassCircleButton
                            accessibilityLabel={ tCommon('action.back') }
                            icon="back"
                            iconColor={ INK }
                            size={ HEADER_BUTTON }
                            onPress={ handleClose }
                            disabled={ saving }
                        />
                        <GlassPillButton
                            label={ t('review.reviewed') }
                            labelColor={ INK }
                            labelSize={ 18 }
                            onPress={ () => { void handleReviewed(); } }
                            disabled={ saving || !canReview }
                            accessibilityLabel={ t('review.markReviewed') }
                            height={ HEADER_BUTTON }
                        />
                    </View>
                    <View style={ styles.dateRow }>
                        <AppText style={ styles.headerDate } variant="body">
                            { noteDate }
                        </AppText>
                        { isEditing ? (
                            <View style={ styles.headerActions }>
                                <TouchableOpacity
                                    onPress={ handleCancelEditing }
                                    accessibilityRole="button"
                                    accessibilityLabel={ t('editor.cancelEdit') }
                                    disabled={ saving }
                                    activeOpacity={ 0.7 }
                                >
                                    <AppText style={ styles.headerActionMuted } variant="body">{ t('editor.cancel') }</AppText>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={ handleSave }
                                    accessibilityRole="button"
                                    accessibilityLabel={ t('a11y.saveChanges') }
                                    disabled={ saving }
                                    activeOpacity={ 0.7 }
                                >
                                    <AppText style={ styles.headerAction } variant="body">
                                        { saving ? 'saving' : 'save' }
                                    </AppText>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity
                                onPress={ handleStartEditing }
                                accessibilityRole="button"
                                accessibilityLabel={ t('a11y.editNote') }
                                disabled={ !note }
                                activeOpacity={ 0.7 }
                            >
                                <AppText style={ styles.headerAction } variant="body">{ t('editor.edit') }</AppText>
                            </TouchableOpacity>
                        ) }
                    </View>
                    <AppText style={ styles.noteHeading } variant="h1">
                        { t('whatWasSaid') }
                    </AppText>
                    { isEditing ? (
                    /* No ScrollView here on purpose: a multiline TextInput is a
                       UITextView, which scrolls itself and keeps the caret in
                       view as you type. Nesting it in a ScrollView makes it grow
                       instead, and nothing follows the caret. */
                        <View style={ styles.editor }>
                            <TextInput
                                value={ draft }
                                editable={ !saving }
                                onChangeText={ setDraft }
                                multiline
                                autoFocus
                                style={ styles.editableText }
                                textAlignVertical="top"
                                accessibilityLabel={ t('a11y.editNote') }
                            />
                            { errorMessage }
                        </View>
                    ) : (
                        <MaskedView
                            style={ styles.readerMask }
                            maskElement={
                                <LinearGradient
                                    colors={ ['transparent', 'black', 'black', 'transparent'] }
                                    locations={ [0, 0.03, 0.93, 1] }
                                    style={ StyleSheet.absoluteFill }
                                />
                            }
                        >
                            <ScrollView
                                style={ styles.reader }
                                contentContainerStyle={ styles.readerContent }
                                keyboardShouldPersistTaps="handled"
                            >
                                <AppText style={ styles.modalText } variant="body" >
                                    { note?.text ?? 'No note selected.' }
                                </AppText>
                                { errorMessage }
                            </ScrollView>
                        </MaskedView>
                    ) }
                    { /* A real sibling row, so it cannot overlap the text above it
                     however the buttons or Dynamic Type change size. */ }
                    <View testID="note-modal-actions" style={ styles.modalActions }>
                        { /* Hidden while editing: the header already owns cancel
                             and save there, and a third verb beside an unsaved
                             draft invites deleting work that was about to be
                             kept. */ }
                        { onDeleteNote && note && !isEditing ? (
                            confirmingDelete ? (
                                <View style={ styles.deleteRow }>
                                    <AppText style={ styles.deletePrompt } variant="caption">
                                        { t('editor.deleteConfirm') }
                                    </AppText>
                                    <View style={ styles.headerActions }>
                                        <TouchableOpacity
                                            onPress={ () => setConfirmingDelete(false) }
                                            accessibilityRole="button"
                                            accessibilityLabel={ t('a11y.keepNote') }
                                            disabled={ saving }
                                            activeOpacity={ 0.7 }
                                        >
                                            <AppText style={ styles.headerActionMuted } variant="body">
                                                { t('editor.deleteKeep') }
                                            </AppText>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            testID="note-delete-confirm"
                                            onPress={ () => { void handleDelete(); } }
                                            accessibilityRole="button"
                                            accessibilityLabel={ t('a11y.confirmDeleteNote') }
                                            disabled={ saving }
                                            activeOpacity={ 0.7 }
                                        >
                                            <AppText style={ styles.deleteConfirmAction } variant="body">
                                                { t('editor.deleteConfirmAction') }
                                            </AppText>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    testID="note-delete"
                                    onPress={ () => setConfirmingDelete(true) }
                                    accessibilityRole="button"
                                    accessibilityLabel={ t('a11y.deleteNote') }
                                    disabled={ saving }
                                    activeOpacity={ 0.7 }
                                >
                                    <AppText style={ styles.deleteAction } variant="body">
                                        { t('editor.delete') }
                                    </AppText>
                                </TouchableOpacity>
                            )
                        ) : null }
                    </View>
                </View>
            </ImageBackground>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalRoot: { flex: 1 },
    modalInner: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginHorizontal: 24,
    },
    headerAction: {
        color: INK,
        fontSize: 20,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
    },
    headerActionMuted: {
        color: 'hsla(219, 52%, 14%, 0.5)',
        fontSize: 20,
    },
    noteHeading: {
        color: INK,
        fontSize: 40,
        lineHeight: 48,
        fontWeight: '400',
        marginHorizontal: 24,
        marginTop: -2,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginHorizontal: 24,
        // Pushed down and the heading's gap pulled in by the same amount, so
        // the date sits near the heading without the heading moving.
        marginTop: 30,
    },
    headerDate: {
        color: 'hsla(219, 52%, 14%, 0.5)',
        fontSize: 15,
        letterSpacing: 1.2,
    },
    readerMask: { flex: 1 },
    reader: { flex: 1 },
    readerContent: { padding: 24, paddingTop: 30 },
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
    deleteRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
    },
    // Quieter than edit. Deleting is the one thing here that cannot be undone,
    // so it should be found when looked for rather than met on the way past.
    deleteAction: {
        color: 'hsla(219, 52%, 14%, 0.5)',
        fontSize: 17,
    },
    deletePrompt: {
        color: INK,
        flexShrink: 1,
        fontSize: 15,
    },
    deleteConfirmAction: {
        color: THEME_COLORS.error,
        fontSize: 20,
    },
    modalText: {
        color: 'hsla(219, 52%, 14%, 0.62)',
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
