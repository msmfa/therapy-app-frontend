import React, { useCallback, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../src/context/auth/AuthContext';
import { SettingsRow } from '../src/components/SettingsRow';
import { SettingsPageShell } from '../src/components/settings/SettingsPageShell';
import FrostedCard from '../src/components/ui/FrostedCard';
import Loading from '../src/components/ui/Loading';
import { deleteCurrentUser } from '../src/api/users';
import { clearNotesForUser } from '../src/features/notes/useNotes';
import { useAppAlert } from '../src/context/alert';
import { analytics } from '../src/features/analytics/client';
import { analyticsConsentSync } from '../src/features/analytics/consentSync';
import { serverErrorMessage } from '../src/features/errors/serverErrorMessage';

/** Where support mail from the app goes. */
const SUPPORT_EMAIL = 'michael@plastic-brains.com';
const APPLE_SUBSCRIPTIONS_URL = 'https://apps.apple.com/account/subscriptions';

export default function AccountSettingsScreen() {
    const { user, signOut } = useAuth();
    const router = useRouter();
    const [deleting, setDeleting] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);
    const { showAlert } = useAppAlert();
    const { t } = useTranslation('settings');
    const { t: tCommon } = useTranslation('common');

    const handleLogout = useCallback(async () => {
        if (loggingOut || deleting) return;
        setLoggingOut(true);
        try {
            await signOut();
        } catch {
            showAlert(tCommon('error.title'), t('account.logOutFailed'));
        } finally {
            setLoggingOut(false);
        }
    }, [deleting, loggingOut, showAlert, signOut, t, tCommon]);

    const performDeleteAccount = useCallback(async () => {
        setDeleting(true);
        try {
            if (!user?.id) {
                throw new Error(t('account.deleteUnavailable'));
            }

            // Server first: local notes are irrecoverable (device-only, no
            // backup), so they must not be destroyed until the account
            // deletion has actually succeeded. If the request fails, the user
            // keeps both the account and the notes.
            await deleteCurrentUser();

            // Local analytics cleanup follows the verified account deletion.
            // A storage failure here must never prevent the remaining cleanup.
            const pendingConsentCleanup = analyticsConsentSync.forgetAccount(user.id).catch(() => undefined);
            await analytics.forgetAccount(user.id).catch(() => undefined);
            await pendingConsentCleanup;

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
            showAlert(
                tCommon('error.title'),
                serverErrorMessage(error, t('account.deleteFailed')),
            );
        }
    }, [showAlert, signOut, t, tCommon, user?.id]);

    const handleContactUs = useCallback(() => {
        Linking.openURL(`mailto:${SUPPORT_EMAIL}`).catch(() => {
            showAlert(tCommon('error.title'), t('account.mailOpenFailed'));
        });
    }, [showAlert, t, tCommon]);

    const handleManageSubscription = useCallback(async () => {
        try {
            await Linking.openURL(APPLE_SUBSCRIPTIONS_URL);
        } catch {
            showAlert(t('account.subscriptionsTitle'), t('account.subscriptionsMessage'));
        }
    }, [showAlert, t]);

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
            t('account.deleteConfirmTitle'),
            t('account.deleteConfirmMessage'),
            {
                secondaryAction: {
                    label: t('account.manageSubscription'),
                    onPress: handleManageSubscription,
                },
                primaryAction: {
                    label: t('rows.deleteAccount'),
                    tone: 'danger',
                    onPress: performDeleteAccount,
                },
            }
        );
    }, [deleting, loggingOut, handleManageSubscription, performDeleteAccount, showAlert, t]);

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
        <SettingsPageShell title={ t('title') } onBack={ () => router.back() }>
            <FrostedCard contentStyle={ styles.card }>
                <View style={ styles.rows }>
                    <SettingsRow
                        text={ t('rows.reminderSettings') }
                        onPress={ () => router.push('/reminder-settings') }
                    />
                    <SettingsRow text={ t('rows.contactUs') } onPress={ handleContactUs } />
                    <SettingsRow text={ t('rows.privacyPolicy') } onPress={ handlePrivacyPolicy } />
                    <SettingsRow text={ t('rows.deleteAccount') } onPress={ onDeleteAccount } />
                    <SettingsRow text={ t('rows.termsOfService') } onPress={ handleTermsOfService } />
                    <SettingsRow
                        text={ loggingOut ? tCommon('action.loggingOut') : tCommon('action.logOut') }
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
