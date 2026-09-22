import React, { useCallback } from 'react';
import { Linking, Platform, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

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
import type { TFunction } from 'i18next';

// A row per section, each opening a page with that section's own rows, plus the
// two actions common enough to be worth reaching without a second tap.
//
// The label is a translation key rather than a string: this is module-level, so
// a resolved string here would be fixed at import time, before the stored
// language preference has been applied, and would never change again.
const CATEGORIES = [
    { labelKey: 'hub.language', route: '/language' },
    { labelKey: 'hub.appearance', route: '/appearance' },
    { labelKey: 'hub.references', route: '/references' },
    { labelKey: 'hub.settings', route: '/account' },
] as const;

const APP_VERSION = '1.0.0';

export default function SettingsScreen() {
    const { user, signOut } = useAuth();
    const router = useRouter();
    const { showAlert } = useAppAlert();
    const { t } = useTranslation('settings');
    const { t: tCommon } = useTranslation('common');

    const onLogout = useCallback(async () => {
        try {
            await signOut();
        } catch (_) {
            showAlert(tCommon('error.title'), t('hub.logOutFailed'));
        }
    }, [showAlert, signOut, t, tCommon]);

    const handleRateApp = useCallback(
        createHandleRateApp({
            select: Platform.select,
            openURL: (url) => Linking.openURL(url),
            alert: showAlert,
            t,
            tCommon,
        }),
        [showAlert, t, tCommon],
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
                            text={ t(category.labelKey) }
                            onPress={ () => router.push(category.route) }
                        />
                    )) }
                    <SettingsRow text={ tCommon('action.logOut') } onPress={ () => void onLogout() } />
                    <SettingsRow text={ t('hub.rateApp') } onPress={ handleRateApp } />
                </View>
                <Spacer />
                <AppText variant="caption" align="center">
                    { t('hub.version', { version: APP_VERSION }) }
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
    t: TFunction<'settings'>;
    tCommon: TFunction<'common'>;
};

function createHandleRateApp({ select, openURL, alert, t, tCommon }: RateAppDeps) {
    return () => {
        const storeUrl = select({
            ios: STORE_URLS.ios,
            android: STORE_URLS.android,
            default: STORE_URLS.web,
        });

        if (!storeUrl) {
            alert(t('hub.rateUnavailableTitle'), t('hub.rateUnavailableMessage'));
            return;
        }

        void openURL(storeUrl).catch(() => {
            alert(tCommon('error.title'), t('hub.storeOpenFailed'));
        });
    };
}
