import React, { useCallback } from 'react';
import { Linking, Platform, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { useAuth } from '../../src/context/auth/AuthContext';
import { GradientCard } from '../../src/components/ui/GradientCard';
import { SettingsRow } from '../../src/components/SettingsRow';
import { SettingsPageShell } from '../../src/components/settings/SettingsPageShell';
import AppText from '../../src/components/ui/AppText';
import Spacer, { SpacerVariant } from 'src/components/ui/Spacer';
import FrostedCard from 'src/components/ui/FrostedCard';
import Loading from 'src/components/ui/Loading';
import { useAppAlert, type AppAlertContextValue } from '../../src/context/alert';
import { STORE_URLS } from '../../src/constants/env';

// A row per section, each opening a page with that section's own rows, plus the
// two actions common enough to be worth reaching without a second tap.
const CATEGORIES = [
    { text: 'References', route: '/references' },
    { text: 'Settings', route: '/account' },
] as const;

export default function SettingsScreen() {
    const { user, signOut } = useAuth();
    const router = useRouter();
    const { showAlert } = useAppAlert();

    const onLogout = useCallback(async () => {
        try {
            await signOut();
        } catch (_) {
            showAlert('Error', 'Could not log out please try again');
        }
    }, [showAlert, signOut]);

    const handleRateApp = useCallback(
        createHandleRateApp({
            select: Platform.select,
            openURL: Linking.openURL,
            alert: showAlert,
        }),
        [showAlert],
    );

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
        <SettingsPageShell>
            <GradientCard>
                <View style={ styles.user }>
                    <AppText variant="h1">
                        { user?.name }
                    </AppText>
                    <AppText variant="body" numberOfLines={ 1 }>
                        { user?.email }
                    </AppText>
                </View>
            </GradientCard>
            <Spacer variant={ SpacerVariant.small } />
            <FrostedCard contentStyle={ styles.card }>
                <View style={ styles.rows }>
                    { CATEGORIES.map((category) => (
                        <SettingsRow
                            key={ category.route }
                            text={ category.text }
                            onPress={ () => router.push(category.route) }
                        />
                    )) }
                    <SettingsRow text="Log out" onPress={ () => void onLogout() } />
                    <SettingsRow text="Rate this App" onPress={ handleRateApp } />
                </View>
                <Spacer />
                <AppText variant="caption" align="center">
                    v1.0.0
                </AppText>
            </FrostedCard>
        </SettingsPageShell>
    );
}

const styles = StyleSheet.create({
    content: {
        flex: 1,
    },
    user: {
        alignItems: 'center',
        padding: 12,
    },
    card: {
        paddingVertical: 22,
    },
    rows: {
        gap: 8,
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
            ios: STORE_URLS.ios,
            android: STORE_URLS.android,
            default: STORE_URLS.web,
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
