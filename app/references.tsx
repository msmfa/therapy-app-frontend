/**
 * The citations below are deliberately English-only. See
 * src/i18n/englishOnly.ts.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { SettingsRow } from '../src/components/SettingsRow';
import { SettingsPageShell } from '../src/components/settings/SettingsPageShell';
import FrostedCard from '../src/components/ui/FrostedCard';
import { useTranslation } from 'react-i18next';

export default function ReferencesScreen() {
    const { t } = useTranslation('common');
    const { t: tScience } = useTranslation('science');
    const router = useRouter();

    return (
        <SettingsPageShell title={ t('screen.references') } onBack={ () => router.back() }>
            <FrostedCard contentStyle={ styles.card }>
                <View style={ styles.rows }>
                    <SettingsRow
                        text={ tScience('referencesIntervals') }
                        onPress={ () => router.push({
                            pathname: '/interval-science',
                            params: { source: 'saved' },
                        }) }
                    />
                    <SettingsRow
                        text={ tScience('referencesNote') }
                        onPress={ () => router.push('/how-to-take-notes') }
                    />
                </View>
            </FrostedCard>
        </SettingsPageShell>
    );
}

const styles = StyleSheet.create({
    card: {
        paddingVertical: 22,
    },
    rows: {
        gap: 8,
    },
});
