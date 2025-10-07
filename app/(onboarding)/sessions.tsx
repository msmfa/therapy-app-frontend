import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import TherapyCalendar from '../../src/components/therapy-calendar/TherapyCalendar';
import { useTherapySessions } from '../../src/context/therapy-sessions/TherapySessionsContext';
import Loading from '../../src/components/ui/Loading';
import { convertSessionsToCalendarFormat } from '../../src/utils/calendar';
import { GradientUpwards } from '../../src/components/GradientUpwards';
import { GradientCard } from '../../src/components/ui/GradientCard';
import { Button } from '../../src/components/ui/Button';
import OnboardingSteps from 'src/components/ui/OnboardingSteps';
import Spacer from 'src/components/ui/Spacer';
import { palette } from '../../new-design';
import ErrorModal from '../../src/components/ui/ErrorModal';


const onBoardingText = {
    one: 'Press on a date on the calendar to add your therapy sessions. Add at least two weeks of sessions',
    two: "Press the button below to save them. We will then use these dates to calculate the best times to notify you",
};

type SelectedSessions = Record<string, Date>;


export default function SessionsScreen() {
    const router = useRouter();
    const {
        sessions: existingSessions,
        syncSessions,
        refreshSessions,
        error: sessionsError,
    } = useTherapySessions();
    const [isSaving, setIsSaving] = useState(false);
    const [errorVisible, setErrorVisible] = useState(false);

    const initialSessions = useMemo(
        () => convertSessionsToCalendarFormat(existingSessions),
        [existingSessions],
    );

    const [selectedSessions, setSelectedSessions] = useState<SelectedSessions>(initialSessions);

    useEffect(() => {
        setSelectedSessions(initialSessions);
    }, [initialSessions]);

    useEffect(() => {
        if (sessionsError) {
            setErrorVisible(true);
        } else {
            setErrorVisible(false);
        }
    }, [sessionsError]);

    const handleErrorClose = useCallback(() => {
        setErrorVisible(false);
    }, []);

    const handleErrorRetry = useCallback(() => {
        if (!sessionsError?.retryable) {
            setErrorVisible(false);
            return;
        }
        setErrorVisible(false);
        refreshSessions().catch(() => {});
    }, [sessionsError, refreshSessions]);

    const sessionCount = Object.keys(selectedSessions).length;

    const handleSavePress = async () => {
        if (sessionCount < 4) {
            Alert.alert('Not Enough Sessions', 'Please add at least 4 therapy sessions.', [
                { text: 'OK', style: 'default' },
            ]);
            return;
        }

        setIsSaving(true);

        try {
            await syncSessions(selectedSessions, 50);
            router.push('/(onboarding)/explanation');
        } catch (error) {
            Alert.alert('Error', 'Failed to save sessions. Please try again.');
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleClearAll = () => {
        setSelectedSessions({});
    };

    const haveSessionsBeenSelected = Object.keys(selectedSessions).length === 0;

    return (
        <SafeAreaView style={ styles.root }>
            <GradientUpwards />
            <View style={ styles.content }>
                <TherapyCalendar
                    onSelectedSessionsChange={ setSelectedSessions }
                    selectedSessions={ selectedSessions }
                >
                    <GradientCard addedStyles={ styles.bottomContainer }>
                        <OnboardingSteps
                            title='Add your therapy sessions'
                            steps={ [
                                onBoardingText.one,
                                onBoardingText.two,
                            ] }
                            activeStep={ haveSessionsBeenSelected ? 0 : 1 }
                        />
                        <Spacer />
                        <View style={ styles.buttonsWrapper }>
                            <Button
                                addedStyles={ { width: '48%' } }
                                disabled={ sessionCount === 0 }
                                label="Add"
                                onPress={ handleSavePress }
                            />
                            <Button
                                addedStyles={ { width: '48%' } }
                                transparent
                                disabled={ sessionCount === 0 }
                                label="Clear"
                                onPress={ handleClearAll }
                            />
                        </View>
                        <Spacer />
                    </GradientCard>
                </TherapyCalendar>
            </View>
            { isSaving && <Loading /> }
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
        </SafeAreaView>
    );
}


const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: palette.neutral.transparentTransparent,
        padding: 4,
    },
    content: {
        flex: 1,
    },
    bottomContainer:{
        position: 'absolute',
        bottom: 10,
        right: 10,
        left: 10,
    },
    buttonsWrapper: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
});
