import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import AppText from '../../src/components/ui/AppText';
import { useTherapySessions } from '../../src/context/therapy-sessions/TherapySessionsContext';
import ErrorModal from '../../src/components/ui/ErrorModal';
import Spacer, { SpacerVariant } from '../../src/components/ui/Spacer';
import { SafeAreaView } from 'react-native-safe-area-context';
import DancingSquare from 'src/components/ui/PulsingSquare';
import { GlassMorphismWithCircle } from 'src/components/ui/GlassMorphismWithCircle';

type LoadingParams = {
    sessions?: string | string[];
    duration?: string | string[];
};

const MINIMUM_LOADING_TIME = 3000;

export default function LoadingReminders() {
    const { syncSessions } = useTherapySessions();
    const { sessions: sessionsParam, duration: durationParam } = useLocalSearchParams<LoadingParams>();

    const [error, setError] = useState<{ title: string; message: string } | null>(null);
    const [apiSuccess, setApiSuccess] = useState(false);
    const [apiError, setApiError] = useState<{ title: string; message: string } | null>(null);
    const [timerDone, setTimerDone] = useState(false);

    const addSessions = useCallback(async () => {
        const rawSessions = Array.isArray(sessionsParam) ? sessionsParam[0] : sessionsParam;

        if (!rawSessions) {
            router.replace('/(onboarding)/sessions');
            return;
        }

        try {
            const parsed = JSON.parse(rawSessions) as Record<string, string>;
            const mapped = Object.entries(parsed).reduce<Record<string, Date>>((acc, [key, iso]) => {
                const date = new Date(iso);
                if (!Number.isNaN(date.getTime())) {
                    acc[key] = date;
                }
                return acc;
            }, {});

            if (Object.keys(mapped).length === 0) {
                throw new Error('No sessions to sync');
            }

            const duration = Number(durationParam);
            await syncSessions(mapped, duration);
            setApiSuccess(true);
        } catch (err) {
            setApiError({
                title: 'Unable to save sessions',
                message: 'We could not save your therapy sessions. Please try again.',
            });
        }
    }, [durationParam, sessionsParam, syncSessions]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimerDone(true);
        }, MINIMUM_LOADING_TIME);

        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        addSessions();
    }, [addSessions]);

    useEffect(() => {
        if (timerDone && apiSuccess) {
            // router.replace('/(onboarding)/reminders');
        }
    }, [timerDone, apiSuccess]);

    useEffect(() => {
        if (timerDone && apiError) {
            setError(apiError);
        }
    }, [timerDone, apiError]);

    const handleRetry = useCallback(() => {
        setError(null);
        setApiSuccess(false);
        setApiError(null);
        setTimerDone(false);
        addSessions();
    }, [addSessions]);

    const handleClose = useCallback(() => {
        setError(null);
        router.replace('/(onboarding)/sessions');
    }, []);

    return (
            <View style={styles.root}>
                <GlassMorphismWithCircle style={{ padding: 6 }}>
                    <SafeAreaView edges={['left', 'right']} style={ styles.inner}>
                        <AppText variant="body" align="center">
                            Preparing your reminder schedule
                        </AppText>
                        <Spacer variant={SpacerVariant.large} />
                        <Spacer />
                        <DancingSquare />
                    </SafeAreaView>
                </GlassMorphismWithCircle>
                  {error && (
                <ErrorModal
                    visible={error !== null}
                    title={error.title}
                    message={error.message}
                    buttonLabel="Try again"
                    onPress={handleRetry}
                    onClose={handleClose}
                />
            )}
            </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    inner: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    }
});
