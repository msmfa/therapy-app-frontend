import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Linking, Platform, StyleSheet, View, AppState } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useFocusEffect } from '@react-navigation/native';

import AppText from '../../src/components/ui/AppText';
import Spacer, { SpacerVariant } from 'src/components/ui/Spacer';
import { Button } from '../../src/components/ui/Button';
import { GlassMorphismWithCircle } from 'src/components/ui/GlassMorphismWithCircle';
import { CirclePosition } from 'src/components/ui/LinearGradientCircle';
import { ensureNotificationPermissions } from '../../src/services/notifications';
import { THEME_COLORS } from 'designs/designs-colors';

type PermissionState = 'unknown' | 'prompt' | 'granted' | 'blocked';

export default function NotificationsScreen() {
    const router = useRouter();
    const [permissionState, setPermissionState] = useState<PermissionState>('unknown');
    const [requesting, setRequesting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const updatePermissionsState = useCallback(async () => {
        if (Platform.OS !== 'ios') {
            setPermissionState('granted');
            return;
        }

        try {
            const settings = await Notifications.getPermissionsAsync();
            setPermissionState(mapPermission(settings));
        } catch {
            setPermissionState('prompt');
        }
    }, []);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', (state) => {
            if (state === 'active') {
                void updatePermissionsState();
            }
        });

        // Initial fetch
        void updatePermissionsState();

        return () => {
            subscription.remove();
        };
    }, [updatePermissionsState]);

    useFocusEffect(useCallback(() => {
        void updatePermissionsState();
    }, [updatePermissionsState]));

    useEffect(() => {
        if (permissionState === 'granted') {
            router.replace('/(onboarding)/success');
        }
    }, [permissionState, router]);

    const handleEnable = useCallback(async () => {
        if (permissionState === 'granted' || permissionState === 'blocked' || requesting) {
            return;
        }

        setRequesting(true);
        setError(null);
        try {
            const granted = await ensureNotificationPermissions();
            if (!granted) {
                // If the prompt was dismissed or denied, refresh the local state.
                await updatePermissionsState();
                if (Platform.OS === 'ios') {
                    setError('Notifications are still off. You can turn them on in Settings to receive reminders right after your sessions.');
                }
                return;
            }

            setPermissionState('granted');
        } catch {
            setError('Something went wrong while enabling notifications. Please try again.');
        } finally {
            setRequesting(false);
        }
    }, [permissionState, requesting, updatePermissionsState]);

    const handleOpenSettings = useCallback(() => {
        Linking.openSettings().catch(() => {
            setError('Unable to open Settings. Please open it manually to enable notifications.');
        });
    }, []);

    const handleContinue = useCallback(() => {
        router.push('/(onboarding)/success');
    }, [router]);

    const { isGranted, isBlocked, canRequestPermission, statusMessage } = useMemo(() => {
        const granted = permissionState === 'granted';
        const blocked = permissionState === 'blocked';
        const canRequest = permissionState === 'prompt' || permissionState === 'unknown';

        let message: string | null = null;
        if (granted) {
            message = 'Notifications are on. We will nudge you at the key moments that reinforce your progress.';
        } else if (blocked) {
            message = 'Notifications are blocked. Enable them from Settings so we can keep you on track.';
        } else if (canRequest) {
            message = 'Allow notifications to get gentle nudges right after therapy and when it matters most.';
        }

        return {
            isGranted: granted,
            isBlocked: blocked,
            canRequestPermission: canRequest,
            statusMessage: message,
        };
    }, [permissionState]);

    const shouldShowOpenSettings = isBlocked && Platform.OS === 'ios';

    if (isGranted) {
        return null;
    }

    return (
        <View style={ styles.container }>
            <View pointerEvents='none' style={ styles.background }>
                <GlassMorphismWithCircle circlePosition={ CirclePosition.TOP_RIGHT } />
                <GlassMorphismWithCircle circlePosition={ CirclePosition.BOTTOM_LEFT } />
            </View>
            <SafeAreaView style={ styles.safeArea }>
                <View style={ styles.content }>
                    <AppText variant='h1'>
                        Allow Notifications
                    </AppText>
                    <Spacer />
                    <AppText variant='body'>
                        You'll have to allow notifications so we can send you a gentle nudge to remind you to review your therapy sessions.
                    </AppText>
                    <Spacer />
                    <View style={ styles.bullets }>
                        <Bullet text="Capture post-session notes before the details fade." />
                        <Bullet text="Get reminders exactly when your therapy cadence needs them." />
                        <Bullet text="Spend less time managing alarms and more time reflecting." />
                    </View>
                </View>
                <View style={ styles.footer }>
                    { statusMessage ? (
                        <View style={ styles.messageBlock }>
                            <Spacer />
                            <AppText
                                variant='caption'
                                align='center'
                                style={ isGranted ? styles.captionSuccess : styles.captionMuted }
                            >
                                { statusMessage }
                            </AppText>
                        </View>
                    ) : null }
                    { error ? (
                        <View style={ styles.messageBlock }>
                            <Spacer />
                            <AppText variant='caption' align='center' style={ styles.errorText }>
                                { error }
                            </AppText>
                        </View>
                    ) : null }
                    <Spacer variant={ SpacerVariant.large } />
                    { isGranted ? (
                        <Button label="Next" onPress={ handleContinue } />
                    ) : (
                        <>
                            { canRequestPermission ? (
                                <>
                                    <Button
                                        label="Enable Notifications"
                                        onPress={ handleEnable }
                                        loading={ requesting }
                                    />
                                    <Spacer />
                                </>
                            ) : null }
                            { shouldShowOpenSettings ? (
                                <>
                                    <Button
                                        label="Open Settings"
                                        onPress={ handleOpenSettings }
                                        transparent
                                    />
                                    <Spacer />
                                </>
                            ) : null }
                            <Button
                                label="Maybe later"
                                onPress={ handleContinue }
                                transparent
                            />
                        </>
                    ) }
                </View>
            </SafeAreaView>
        </View>
    );
}

type BulletProps = {
    text: string;
};

function Bullet({ text }: BulletProps) {
    return (
        <View style={ styles.bulletRow }>
            <View style={ styles.bulletDot } />
            <AppText variant='body' style={ styles.bulletText }>
                { text }
            </AppText>
        </View>
    );
}

function mapPermission(settings: Notifications.NotificationPermissionsStatus): PermissionState {
    if (settings.granted) {
        return 'granted';
    }

    return settings.canAskAgain ? 'prompt' : 'blocked';
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    background: StyleSheet.absoluteFillObject,
    safeArea: {
        flex: 1,
        padding: 24,
        justifyContent: 'space-between',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
    },
    bullets: {
        marginTop: 12,
        gap: 12,
    },
    bulletRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    bulletDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: THEME_COLORS.success,
        marginTop: 8,
    },
    bulletText: {
        flex: 1,
    },
    footer: {
        gap: 12,
    },
    messageBlock: {
        gap: 12,
    },
    captionSuccess: {
        color: THEME_COLORS.success,
    },
    captionMuted: {
        color: THEME_COLORS.text,
    },
    errorText: {
        color: THEME_COLORS.error,
    },
});
