import React from 'react';
import { StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { SettingsPageShell } from '../src/components/settings/SettingsPageShell';
import { LanguagePicker } from '../src/components/settings/LanguagePicker';
import FrostedCard from '../src/components/ui/FrostedCard';

// Its own page rather than a block at the foot of the account page: language is
// the setting someone opens the app specifically to change, most often because
// the app is currently in one they cannot read, and it should not be something
// they have to find by scrolling past account deletion to reach.
export default function LanguageScreen() {
    const router = useRouter();
    const { t } = useTranslation('settings');

    return (
        <SettingsPageShell title={ t('language.title') } onBack={ () => router.back() }>
            <FrostedCard contentStyle={ styles.card }>
                <LanguagePicker />
            </FrostedCard>
        </SettingsPageShell>
    );
}

const styles = StyleSheet.create({
    card: {
        paddingVertical: 22,
    },
});
