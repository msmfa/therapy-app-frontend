import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { SettingsRow } from '../src/components/SettingsRow';
import { SettingsPageShell } from '../src/components/settings/SettingsPageShell';
import FrostedCard from '../src/components/ui/FrostedCard';

export default function ReferencesScreen() {
    const router = useRouter();

    return (
        <SettingsPageShell title="References" onBack={ () => router.back() }>
            <FrostedCard contentStyle={ styles.card }>
                <View style={ styles.rows }>
                    <SettingsRow
                        text="The science behind our reminder intervals"
                        onPress={ () => router.push({
                            pathname: '/interval-science',
                            params: { source: 'saved' },
                        }) }
                    />
                    <SettingsRow
                        text="Your five-minute therapy note"
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
