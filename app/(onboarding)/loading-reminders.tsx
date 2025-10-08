import React, { useCallback, useEffect, useState, useRef } from 'react';
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
    const [retryCount, setRetryCount] = useState(0);
    const hasStartedRef = useRef(false);

    useEffect(() => {
        // Prevent multiple executions
        if (hasStartedRef.current) return;
        hasStartedRef.current = true;

        let cancelled = false;

        const load = async () => {
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

                const durationValue = Array.isArray(durationParam) ? durationParam[0] : durationParam;
                const duration = Number(durationValue);

                await Promise.all([
                    syncSessions(mapped, duration),
                    new Promise((resolve) => setTimeout(resolve, MINIMUM_LOADING_TIME)),
                ]);

                if (!cancelled) {
                    router.replace('/(onboarding)/reminders');
                }
            } catch (err) {
                if (!cancelled) {
                    hasStartedRef.current = false; // Reset on error so retry works
                    setError({
                        title: 'Unable to save sessions',
                        message: 'We could not save your therapy sessions. Please try again.',
                    });
                }
            }
        };

        load();

        return () => {
            cancelled = true;
        };
    }, [durationParam, sessionsParam, retryCount]);

    const handleRetry = useCallback(() => {
        setError(null);
        hasStartedRef.current = false;
        setRetryCount((count) => count + 1);
    }, []);

    const handleClose = useCallback(() => {
        setError(null);
        router.replace('/(onboarding)/sessions');
    }, []);

    return (
        <View style={styles.root}>
            <GlassMorphismWithCircle style={{ padding: 6 }}>
                <SafeAreaView edges={['left', 'right']} style={styles.inner}>
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
    },
});