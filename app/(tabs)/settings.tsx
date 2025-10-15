import React, { useCallback, useState } from 'react';
import { View, StyleSheet, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/auth/AuthContext';
import { GradientCard } from '../../src/components/ui/GradientCard';
import { SettingsRow } from '../../src/components/SettingsRow';
import AppText from '../../src/components/ui/AppText';
import Spacer, { SpacerVariant } from 'src/components/ui/Spacer';
import FrostedCard from 'src/components/ui/FrostedCard';
import Loading from 'src/components/ui/Loading';
import { deleteCurrentUser } from '../../src/api/users';
import { clearNotesForUser } from '../../src/features/notes/useNotes';
import { clearAddNoteReminders } from '../../src/features/reminders/add-note-reminder';
import { GlassMorphismWithCircle } from '../../src/components/ui/GlassMorphismWithCircle';
import { CirclePosition } from 'src/components/ui/LinearGradientCircle';
import { useAppAlert, type AppAlertContextValue } from '../../src/context/alert';

export default function SettingsScreen() {
    const { user, signOut } = useAuth();
    const router = useRouter();
    const [deleting, setDeleting] = useState(false);
    const { showAlert } = useAppAlert();

    if (!user) {
        return (
            <View style={ styles.container }>
                <View pointerEvents='none' style={ styles.background }>
                    <GlassMorphismWithCircle circlePosition={ CirclePosition.TOP_RIGHT } />
                </View>
                <View style={ styles.content }>
                    <Loading />
                </View>
            </View>
        );
    }

    const onLogout = async () => {
        try {
            await signOut();
        } catch (_) {
            showAlert('Error', 'Could not log out please try again');
        }
    };

    const performDeleteAccount = useCallback(async () => {
        setDeleting(true);
        try {
            if (!user?.id) {
                throw new Error('Unable to delete account right now.');
            }

            await clearAddNoteReminders();
            await clearNotesForUser(user.id);
            await deleteCurrentUser();
            await signOut();
        } catch (error) {
            setDeleting(false);
            const message = error instanceof Error ? error.message : 'Failed to delete account';
            showAlert('Error', message);
        }
    }, [showAlert, signOut, user?.id]);

    const handleRateApp = useCallback(
        createHandleRateApp({
            select: Platform.select,
            openURL: Linking.openURL,
            alert: showAlert,
        }),
        [showAlert],
    );

    const handlePrivacyPolicy = useCallback(
        createPrivacyPolicyHandler(router.push),
        [router],
    );

    const handleTermsOfService = useCallback(
        createTermsOfServiceHandler(router.push),
        [router],
    );

    const onDeleteAccount = useCallback(() => {
        if (deleting) {
            return;
        }
        showAlert(
            'Delete account',
            'This will permanently remove your account and all stored data. This action cannot be undone.',
            {
                primaryAction: {
                    label: 'Delete account',
                    tone: 'danger',
                    onPress: performDeleteAccount,
                },
            }
        );
    }, [deleting, performDeleteAccount, showAlert]);

    return (
        <View style={ styles.container }>
            <View pointerEvents='none' style={ styles.background }>
                <GlassMorphismWithCircle circlePosition={ CirclePosition.TOP_RIGHT } />
                <GlassMorphismWithCircle circlePosition={ CirclePosition.BOTTOM_LEFT } />
            </View>
            <SafeAreaView style={ styles.root }>
                <GradientCard>
                    <View style={ styles.user } >
                        <AppText variant='h1'>
                            { user?.name }
                        </AppText>
                        <AppText variant='body' numberOfLines={ 1 }>
                            { user?.email }
                        </AppText>
                    </View>
                </GradientCard>
                <Spacer variant={ SpacerVariant.small } />
                <FrostedCard contentStyle={ { paddingVertical: 22 } }>
                    <View>
                        <AppText variant='h2'>
                            References
                        </AppText>
                        <Spacer />
                        <View style={ { gap: 8 } }>
                            <SettingsRow
                                text="The science behind our reminder intervals"
                                onPress={ () => router.push('/interval-science') }
                            />
                            <SettingsRow
                                text="How to get the most from note taking after a session"
                                onPress={ () => router.push('/how-to-take-notes') }
                            />
                        </View>
                        <Spacer />
                        <AppText variant='h2'>
                            Settings
                        </AppText>
                        <Spacer />
                        <View style={ { gap: 8 } }>
                            <SettingsRow text="Log out" onPress={ () => onLogout() } />
                            <SettingsRow text="Rate this App" onPress={ handleRateApp } />

                            <SettingsRow text="Privacy Policy" onPress={ handlePrivacyPolicy } />
                            <SettingsRow text="Delete account" onPress={ onDeleteAccount } />
                            <SettingsRow text="Terms of Service" onPress={ handleTermsOfService } />
                        </View>
                    </View>
                    <Spacer  />
                    <AppText variant='caption' align='center'>
                        v1.0.0
                    </AppText>
                </FrostedCard>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    background: StyleSheet.absoluteFillObject,
    content: {
        flex: 1,
    },
    root: {
        flex: 1,
        paddingHorizontal: 12,

    },
    user: {
        padding: 12,
        alignItems: 'center',
    },
});

type ShowAlert = AppAlertContextValue['showAlert'];

type RateAppDeps = {
    select: typeof Platform.select;
    openURL: typeof Linking.openURL;
    alert: ShowAlert;
};

function createHandleRateApp({ select, openURL, alert }: RateAppDeps) {
    return () => {
        const storeUrl = select({
            ios: 'itms-apps://itunes.apple.com/app/id000000000?action=write-review', // TODO: replace with real App Store ID
            android: 'market://details?id=com.example.therapyapp', // TODO: replace with real package name
            default: 'https://therapy-app.example.com', // TODO: replace with real fallback URL
        });

        if (!storeUrl) {
            alert('Unavailable', 'Rating is not supported on this platform yet.');
            return;
        }

        void openURL(storeUrl).catch(() => {
            alert('Error', 'Unable to open the store right now.');
        });
    };
}

type PushFn = (route: string) => void;

function createPrivacyPolicyHandler(push: PushFn) {
    return () => {
        push('/privacy-policy');
    };
}

function createTermsOfServiceHandler(push: PushFn) {
    return () => {
        push('/terms-of-service');
    };
}
