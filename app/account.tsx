import React, { useCallback, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { useAuth } from '../src/context/auth/AuthContext';
import { SettingsRow } from '../src/components/SettingsRow';
import { SettingsPageShell } from '../src/components/settings/SettingsPageShell';
import FrostedCard from '../src/components/ui/FrostedCard';
import Loading from '../src/components/ui/Loading';
import { deleteCurrentUser } from '../src/api/users';
import { clearNotesForUser } from '../src/features/notes/useNotes';
import { useAppAlert } from '../src/context/alert';

/** Where support mail from the app goes. */
const SUPPORT_EMAIL = 'michael@plastic-brains.com';
const APPLE_SUBSCRIPTIONS_URL = 'https://apps.apple.com/account/subscriptions';

export default function AccountSettingsScreen() {
    const { user, signOut } = useAuth();
    const router = useRouter();
    const [deleting, setDeleting] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);
    const { showAlert } = useAppAlert();

    const handleLogout = useCallback(async () => {
        if (loggingOut || deleting) return;
        setLoggingOut(true);
        try {
            await signOut();
        } catch {
            showAlert('Error', 'Could not log out. Please try again.');
        } finally {
            setLoggingOut(false);
        }
    }, [deleting, loggingOut, showAlert, signOut]);

    const performDeleteAccount = useCallback(async () => {
        setDeleting(true);
        try {
            if (!user?.id) {
                throw new Error('Unable to delete account right now.');
            }

            // Server first: local notes are irrecoverable (device-only, no
            // backup), so they must not be destroyed until the account
            // deletion has actually succeeded. If the request fails, the user
            // keeps both the account and the notes.
            await deleteCurrentUser();

            try {
                await clearNotesForUser(user.id);
            } catch (cleanupError) {
                // The account is already gone; a failed local cleanup must
                // not block signing out.
                console.warn('[Settings] Failed to clear local notes after account deletion:', cleanupError);
            }

            await signOut();
        } catch (error) {
            setDeleting(false);
            if ((error as { code?: string })?.code === 'ERR_REQUEST_CANCELED') return;
            const message = error instanceof Error ? error.message : 'Failed to delete account';
            showAlert('Error', message);
        }
    }, [showAlert, signOut, user?.id]);

    const handleContactUs = useCallback(() => {
        Linking.openURL(`mailto:${SUPPORT_EMAIL}`).catch(() => {
            showAlert('Error', 'Unable to open your mail app right now.');
        });
    }, [showAlert]);

    const handleManageSubscription = useCallback(async () => {
        try {
            await Linking.openURL(APPLE_SUBSCRIPTIONS_URL);
        } catch {
            showAlert('Unable to open subscriptions', 'Open Settings on your iPhone or iPad, tap your name, then Subscriptions to manage your App Store subscription.');
        }
    }, [showAlert]);

    const handlePrivacyPolicy = useCallback(
        createPrivacyPolicyHandler(router.push),
        [router],
    );

    const handleTermsOfService = useCallback(
        createTermsOfServiceHandler(router.push),
        [router],
    );

    const onDeleteAccount = useCallback(() => {
        if (deleting || loggingOut) {
            return;
        }
        showAlert(
            'Delete account',
            'This will permanently remove your account and all stored data. This action cannot be undone.\n\nDeleting your account does not cancel an App Store subscription or free trial. Apple billing will continue unless you cancel it in Subscriptions. Please cancel before deleting your account. You can still delete your account immediately.',
            {
                secondaryAction: {
                    label: 'Manage subscription',
                    onPress: handleManageSubscription,
                },
                primaryAction: {
                    label: 'Delete account',
                    tone: 'danger',
                    onPress: performDeleteAccount,
                },
            }
        );
    }, [deleting, loggingOut, handleManageSubscription, performDeleteAccount, showAlert]);

    if (!user) {
        return (
            <SettingsPageShell>
                <View style={ styles.content }>
                    <Loading />
                </View>
            </SettingsPageShell>
        );
    }

    return (
        <SettingsPageShell title="Settings" onBack={ () => router.back() }>
            <FrostedCard contentStyle={ styles.card }>
                <View style={ styles.rows }>
                    <SettingsRow
                        text="Reminder settings"
                        onPress={ () => router.push('/reminder-settings') }
                    />
                    <SettingsRow text="Contact us" onPress={ handleContactUs } />
                    <SettingsRow text="Privacy Policy" onPress={ handlePrivacyPolicy } />
                    <SettingsRow text="Delete account" onPress={ onDeleteAccount } />
                    <SettingsRow text="Terms of Service" onPress={ handleTermsOfService } />
                    <SettingsRow
                        text={ loggingOut ? 'Logging out…' : 'Log out' }
                        onPress={ () => void handleLogout() }
                    />
                </View>
            </FrostedCard>
        </SettingsPageShell>
    );
}

const styles = StyleSheet.create({
    content: {
        flex: 1,
    },
    card: {
        paddingVertical: 22,
    },
    rows: {
        gap: 8,
    },
});

type PushFn = ReturnType<typeof useRouter>['push'];

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
