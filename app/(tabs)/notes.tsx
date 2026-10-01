import { WidgetDiscoveryCard } from '../../src/components/widgets/WidgetGuide';
import { useWidgetDiscovery } from '../../src/features/widgets/useWidgetDiscovery';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '../../src/context/auth/AuthContext';
import { useNotes, type Note } from '../../src/features/notes/useNotes';
import NotesListScreen from '../../src/components/notes/NotesListScreen';
import Loading from '../../src/components/ui/Loading';
import { useAppAlert } from '../../src/context/alert';
import { useNoteReviews } from '../../src/features/reviews';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../src/context/theme';
import { recoverAccountNotes } from '../../src/features/notes/recoverAccountNotes';
import AppText from '../../src/components/ui/AppText';
import { GlassPillButton } from '../../src/components/ui/GlassPillButton';

export default function NotesScreen() {
    const { t } = useTranslation('notes');
    const { theme } = useTheme();
    const { t: tCommon } = useTranslation('common');
    const { user } = useAuth();
    const { notes, loading, error, refresh, updateNote, deleteNote } = useNotes(user?.id);
    const { progressFor, reviewState, markReviewed, reviews, refresh: refreshReviews } = useNoteReviews(user?.id);
    const { showAlert } = useAppAlert();
    const discovery = useWidgetDiscovery(user?.id);
    const router = useRouter();
    const [recoveringNotes, setRecoveringNotes] = React.useState(false);
    const recoveryInFlight = React.useRef(false);
    const recoveryOwner = React.useRef(user?.id);
    recoveryOwner.current = user?.id;
    React.useEffect(() => {
        recoveryOwner.current = user?.id;
        return () => { recoveryOwner.current = undefined; };
    }, [user?.id]);
    const recoverSavedNotes = React.useCallback(async () => {
        const owner = user?.id;
        if (!owner || recoveryInFlight.current) return;
        recoveryInFlight.current = true;
        setRecoveringNotes(true);
        try {
            const count = await recoverAccountNotes(owner, () => recoveryOwner.current === owner);
            if (recoveryOwner.current !== owner) return;
            await Promise.all([refresh(), refreshReviews()]);
            if (recoveryOwner.current !== owner) return;
            showAlert(t('recovery.title'), t(count > 0 ? 'recovery.restored' : 'recovery.notFound', { count }));
        } catch {
            if (recoveryOwner.current === owner) showAlert(t('recovery.title'), t('recovery.failed'));
        } finally {
            recoveryInFlight.current = false;
            setRecoveringNotes(false);
        }
    }, [user?.id, refresh, refreshReviews, showAlert, t]);

    const canReview = React.useCallback(
        (note: Note) => reviewState(note).canReview,
        [reviewState],
    );

    const handleReviewed = React.useCallback(
        async (note: Note) => {
            const result = await markReviewed(note);
            if (result.recorded && result.attribution.reason !== null && reviews.length === 0) discovery.afterFirstCheckIn();
        },
        [markReviewed, reviews.length, discovery.afterFirstCheckIn],
    );

    const handleUpdateNote = React.useCallback(
        async (noteId: string, text: string) => {
            await updateNote(noteId, { text });
        },
        [updateNote],
    );

    const handleDeleteNote = React.useCallback(
        async (noteId: string) => {
            await deleteNote(noteId);
        },
        [deleteNote],
    );

    useFocusEffect(
        React.useCallback(() => {
            void refresh({ silent: true });
        }, [refresh]),
    );

    React.useEffect(() => {
        if (!error || notes.length === 0) return;
        showAlert(t('list.loadFailed'), error, {
            primaryAction: {
                label: tCommon('action.tryAgain'),
                onPress: () => { void refresh(); },
            },
        });
    }, [error, notes.length, showAlert, refresh, t, tCommon]);

    const isLoading = !user?.id || (loading && notes.length === 0);

    return (
        <View style={ [styles.container, { backgroundColor: theme.ground.base }] }>
            <View style={ styles.content }>
                { isLoading ? <Loading /> : error && notes.length === 0 ? (
                    <View style={styles.loadError}>
                        <AppText variant="h3">{t('list.loadFailed')}</AppText>
                        <GlassPillButton label={tCommon('action.tryAgain')} labelColor={theme.ink.primary} onPress={() => { void refresh(); }} />
                    </View>
                ) : (
                    <NotesListScreen
                        discoveryCard={discovery.visible ? <WidgetDiscoveryCard onDismiss={discovery.dismiss} onOpen={() => { discovery.dismiss(); router.push('/widget-guide'); }} /> : undefined}
                        notes={ notes }
                        loading={ loading }
                        refresh={ refresh }
                        onUpdateNote={ handleUpdateNote }
                        onDeleteNote={ handleDeleteNote }
                        progressFor={ progressFor }
                        canReview={ canReview }
                        onReviewed={ handleReviewed }
                        onRecoverNotes={() => { void recoverSavedNotes(); }}
                        recoveringNotes={recoveringNotes}
                    />
                ) }
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    loadError: { flex: 1, justifyContent: 'center', padding: 32, gap: 20 },
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
    },
});
