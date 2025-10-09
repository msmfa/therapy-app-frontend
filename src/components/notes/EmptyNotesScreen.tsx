import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import dayjs from 'dayjs';
import { useTherapySessions } from '../../context/therapy-sessions/TherapySessionsContext';
import AppText from '../ui/AppText';
import Spacer, { SpacerVariant } from '../ui/Spacer';
import { COLOR_VARIANTS } from 'designs/designs-colors';
import { GradientCard } from '../ui/GradientCard';
import ErrorModal from '../ui/ErrorModal';
import { GlassMorphismWithSquare } from '../ui/GlassMorphismWithSquare';
import { SquarePosition } from '../ui/LinearGradientSquare';

export default function EmptyNotesScreen() {
    const router = useRouter();
    const {
        nextSession,
        loading,
        error: sessionsError,
        refreshSessions,
    } = useTherapySessions();
    const [errorVisible, setErrorVisible] = React.useState(false);

    React.useEffect(() => {
        if (sessionsError) {
            setErrorVisible(true);
        } else {
            setErrorVisible(false);
        }
    }, [sessionsError]);

    const handleErrorClose = React.useCallback(() => {
        setErrorVisible(false);
    }, []);

    const handleErrorRetry = React.useCallback(() => {
        if (!sessionsError?.retryable) {
            setErrorVisible(false);
            return;
        }
        setErrorVisible(false);
        refreshSessions().catch(() => {});
    }, [sessionsError, refreshSessions]);

    const shouldRenderContent = Boolean(nextSession || loading);

    if (!shouldRenderContent && !sessionsError) {
        return null;
    }

    const nextSessionDate = nextSession
        ? dayjs(nextSession.startsAtUtc).format('dddd, MMM D [at] h:mm A')
        : null;

    const handleOpenNoteTakingArticle = () => {
        router.push('/how-to-take-notes');
    };

    return (
        <>
            {shouldRenderContent && (
                <View style={ styles.container }>
                    <View pointerEvents='none' style={ styles.background }>
                        <GlassMorphismWithSquare />
                        <GlassMorphismWithSquare squarePosition={SquarePosition.BOTTOM_LEFT} squareRotation='60deg' />
                    </View>
                    <SafeAreaView style={ styles.root } edges={['left', 'right', 'top']}>
                        <View style={ styles.emptyContainer }>
                            <Spacer variant={ SpacerVariant.small } />
                            <GradientCard>
                                <Spacer variant={ SpacerVariant.medium } />
                                <AppText variant='h3'>
                                    We'll send you a notification just after your next session on { nextSessionDate } so you can take down your first note.
                                </AppText>
                                <Spacer variant={ SpacerVariant.medium } />
                                <AppText variant='body'>
                                    You'll then see your logged notes on this screen
                                </AppText>
                                <Spacer variant={ SpacerVariant.medium } />

                                <View>
                                    <AppText variant='body'>
                                        If you want to get started now, you can create your first note by tapping the plus icon in the bottom left
                                    </AppText>
                                    <Spacer variant={ SpacerVariant.large } />

                                    <AppText variant='body'>
                                        However we recommend you read a little about what kind of{ ' ' }
                                        <AppText
                                            variant='body'
                                            onPress={ handleOpenNoteTakingArticle }
                                            accessibilityRole='link'
                                            style={ styles.bottomTextLink }
                                        >
                                            note taking is best for therapy sessions
                                        </AppText>
                                        { ' ' }before you do
                                    </AppText>
                                </View>
                            <Spacer variant={ SpacerVariant.large } />
                            </GradientCard>
                            <Spacer variant={ SpacerVariant.small } />
                        </View>
                    </SafeAreaView>
                </View>
            ) }
            { sessionsError && (
                <ErrorModal
                    visible={ errorVisible }
                    title={ sessionsError.title }
                    message={ sessionsError.message }
                    buttonLabel={ sessionsError.retryable && sessionsError.actionLabel ? sessionsError.actionLabel : undefined }
                    onPress={ sessionsError.retryable ? handleErrorRetry : undefined }
                    onClose={ handleErrorClose }
                />
            ) }
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 60,
    },
    background: StyleSheet.absoluteFillObject,
    bottomText: {
        gap: 16,
        flexDirection: 'row',
    },
    bottomTextContent: {
        flex: 1,
        gap: 8,
    },
    root: {
        flex: 1,
        paddingBottom: 70,
    },
    emptyContainer: {
        flex: 1,
        paddingTop: 50,
        paddingHorizontal: 20,
    },
    bottomTextLink: {
        color: COLOR_VARIANTS.blue.mid,
    },
});
