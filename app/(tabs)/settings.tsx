import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/auth/AuthContext';
import { GradientUpwards } from '../../src/components/GradientUpwards';
import { GradientRow } from '../../src/components/ui/GradientRow';

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
            <View style={ styles.accountInfoContainer }>
                <GradientRow>
                    { /* todo: change to real name */ }
                    <Text>{ 'Michael' }</Text>
                    <Text>{ user?.email }</Text>
                </GradientRow>
            </View>
            <Text>{ 'read more rows thats dif with arrow right' }</Text>


            <View style={ styles.container }>

                <View style={ styles.section }>
                    { /* todo: add the science */ }
                    <Text style={ styles.label }>
                        Link to The science behind our reminder intervals
                    </Text>
                </View>
                <View style={ styles.section }>
                    { /* todo: add the science */ }
                    <Text style={ styles.label }>Link to update your therapy dates</Text>
                </View>

                <TouchableOpacity onPress={ onLogout } style={ styles.logoutBtn }>
                    <Text style={ styles.logoutText }>Log out</Text>
                </TouchableOpacity>
                <Text style={ styles.footer }>v1.0.0</Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: 'transparent' },
    container: { flex: 1, padding: 16, gap: 16, justifyContent: 'space-between' },
    section: { gap: 4 },
    label: { color: '#666', fontWeight: '600' },
    logoutBtn: {
        marginTop: 'auto',
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#111',
        alignItems: 'center',
    },
    logoutText: { color: '#fff', fontWeight: '700' },
    footer: { textAlign: 'center', color: '#888', marginTop: 12 },

    // new
    accountInfoContainer: {
        marginHorizontal: 12,
        padding: 12,
    }
});
