import React from 'react';
import { StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { SettingsPageShell } from '../src/components/settings/SettingsPageShell';
import { AppearancePicker } from '../src/components/settings/AppearancePicker';
import FrostedCard from '../src/components/ui/FrostedCard';

// Its own page, beside Language: appearance is a setting someone opens the app
// to change once, and the picker's three rows are the whole of it.
export default function AppearanceScreen() {
    const router = useRouter();
    const { t } = useTranslation('settings');

    return (
        <SettingsPageShell title={ t('appearance.title') } onBack={ () => router.back() }>
            <FrostedCard contentStyle={ styles.card }>
                <AppearancePicker />
            </FrostedCard>
        </SettingsPageShell>
    );
}

const styles = StyleSheet.create({
    card: {
        paddingVertical: 22,
    },
});
