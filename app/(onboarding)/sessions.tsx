import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import TherapyCalendar from '../../src/components/therapy-calendar/TherapyCalendar';
import { useTherapySessions } from '../../src/context/therapy-sessions/TherapySessionsContext';
import { convertSessionsToCalendarFormat } from '../../src/utils/calendar';
import { GradientCard } from '../../src/components/ui/GradientCard';
import { Button } from '../../src/components/ui/Button';
import OnboardingSteps from 'src/components/ui/OnboardingSteps';
import Spacer from 'src/components/ui/Spacer';
import ErrorModal from '../../src/components/ui/ErrorModal';
import { GlassMorphismWithCircle } from 'src/components/ui/GlassMorphismWithCircle';
import { CirclePosition } from 'src/components/ui/LinearGradientCircle';


const onBoardingText = {
    one: 'Press on a date on the calendar to add your therapy sessions. Add at least two weeks of sessions',
    two: "Press the button below to save them. We will then use these dates to calculate the best times to notify you",
};

type SelectedSessions = Record<string, Date>;


export default function SessionsScreen() {
    const router = useRouter();
    const {
        sessions: existingSessions,
        refreshSessions,
        error: sessionsError,
    } = useTherapySessions();
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

    const handleSavePress = () => {
        if (sessionCount < 4) {
            Alert.alert('Not Enough Sessions', 'Please add at least 4 therapy sessions.', [
                { text: 'OK', style: 'default' },
            ]);
            return;
        }

        const serializedSessions = JSON.stringify(
            Object.entries(selectedSessions).reduce<Record<string, string>>((acc, [key, date]) => {
                acc[key] = date.toISOString();
                return acc;
            }, {}),
        );

        router.push({
            pathname: '/(onboarding)/loading-reminders',
            params: {
                sessions: serializedSessions,
                duration: '50',
            },
        });
    };

    const handleClearAll = () => {
        setSelectedSessions({});
    };

    const haveSessionsBeenSelected = Object.keys(selectedSessions).length === 0;

    return (
        <View style={ styles.container }>
             <View pointerEvents='none' style={ styles.background }>
                <GlassMorphismWithCircle circlePosition={ CirclePosition.BOTTOM_LEFT } />
            </View>
        <SafeAreaView style={ styles.root }>

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
        </View>
    );
}


const styles = StyleSheet.create({
    background: StyleSheet.absoluteFillObject,
    container: {
        flex: 1,
    },
    root: {
        flex: 1,
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
