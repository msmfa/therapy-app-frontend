import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/auth/AuthContext';
import { GradientUpwards } from '../../src/components/GradientUpwards';
import { GradientRow } from '../../src/components/ui/GradientRow';
import { SettingsRow } from '../../src/components/SettingsRow';

export default function SettingsScreen() {
    const { user, signOut } = useAuth();

    const onLogout = async () => {
        try {
            await signOut();
        } catch (e: unknown) {
            Alert.alert('Error', `${(e as Error).message || 'Logout failed'}`);
        }
    };

    return (
        <SafeAreaView style={ styles.root }>
            <GradientUpwards />
            <View>
                <View style={ styles.accountInfoContainer }>
                    <GradientRow>
                        { /* todo: change to real name */ }
                        <View style={ styles.user } >
                            <Text style={ styles.name }>{ 'Michaeljarfle Sydney Moore' }</Text>
                            <Text style={ styles.email }  numberOfLines={ 1 }>{ user?.email }</Text>
                        </View>
                    </GradientRow>
                </View>
                <View style={ styles.container }>
                    <Text style={ styles.rowHeader }>
                        References
                    </Text>
                    { /* TODO: add links to all these */ }
                    <View style={ { gap: 8 } }>
                        <SettingsRow text="The science behind our reminder intervals" onPress={ () => {} } />
                        <SettingsRow text="How to get the most from note taking after a session" onPress={ () => {} } />
                    </View>

                    <Text style={ styles.rowHeader }>
                        Settings
                    </Text>
                    <View style={ { gap: 8 } }>
                        <SettingsRow text="Delete account" onPress={ () => {} } />
                        <SettingsRow text="Privacy Policy" onPress={ () => {} } />
                        <SettingsRow text="Rate this App" onPress={ () => {} } />
                        <SettingsRow text="Log out" onPress={ () => onLogout() } />
                    </View>
                </View>
            </View>
            <Text style={ styles.footer }>v1.0.0</Text>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: 'transparent', ...StyleSheet.absoluteFillObject },
    accountInfoContainer: {
        marginHorizontal: 12,
        padding: 12,
    },
    container: { padding: 20 },
    user: {
        padding: 18,
        alignItems: 'center',
        gap: 12,
    },
    name: { fontSize: 20, fontWeight: '600', color: '#333' },
    rowHeader: { fontSize: 18, fontWeight: '600', color: '#333', marginTop: 12, marginBottom: 12 },
    email: { fontSize: 16, color: '#666', textAlign: 'center' },
    footer: { position: 'absolute', bottom: 20, left: 20, right: 20, textAlign: 'center', color: '#888', marginTop: 12 },
});
