import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/auth/AuthContext';
import { GradientUpwards } from '../../src/components/GradientUpwards';
import { GradientRow } from '../../src/components/ui/GradientRow';
import { SettingsRow } from '../../src/components/SettingsRow';
import AppText from '../../src/components/ui/typography';
import Spacer, { SpacerVariant } from 'src/components/ui/Spacer';
import Card from 'src/components/ui/card';
import Loading from 'src/components/ui/loading';

export default function SettingsScreen() {
    const { user, signOut } = useAuth();
    const router = useRouter();

    if (!user) {
        return <Loading />;
    }

    const onLogout = async () => {
        try {
            await signOut();
        } catch (e: unknown) {
            Alert.alert('Error', `${(e as Error).message || 'Logout failed'}`);
        }
    };
    console.log('user', user);
    return (
        <SafeAreaView style={ styles.root }>
            <GradientUpwards />
            <View style={ styles.accountInfoContainer }>
                <GradientRow>
                    <View style={ styles.user } >
                        <AppText variant='h1'>
                            { user?.name }
                        </AppText>
                        <AppText variant='body' numberOfLines={ 1 }>
                            { user?.email }
                        </AppText>
                    </View>
                </GradientRow>
            </View>
            <Spacer />
            <Card>
                <View style={ styles.container }>
                    <AppText variant='h2'>
                        References
                    </AppText>
                    <Spacer />
                    { /* TODO: add links to all these */ }
                    <View style={ { gap: 8 } }>
                        <SettingsRow text="The science behind our reminder intervals" onPress={ () => {} } />
                        <SettingsRow
                            text="How to get the most from note taking after a session"
                            onPress={ () => router.push('/how-to-take-notes') }
                        />
                    </View>
                    <Spacer />

                    <AppText variant='h2'>
                        Settings
                    </AppText>
                    <Spacer />
                    <View style={ { gap: 8 } }>
                        <SettingsRow text="Delete account" onPress={ () => {} } />
                        <SettingsRow text="Privacy Policy" onPress={ () => {} } />
                        <SettingsRow text="Rate this App" onPress={ () => {} } />
                        <SettingsRow text="Log out" onPress={ () => onLogout() } />
                    </View>
                </View>
                <Spacer variant={ SpacerVariant.large } />
                <AppText variant='caption' align='center'>
                    v1.0.0
                </AppText>
                <Spacer variant={ SpacerVariant.small } />
            </Card>


        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        // backgroundColor: '#00000000',
        padding: 12,
    },
    accountInfoContainer: {
        // marginHorizontal: 12,
        // padding: 12,
    },
    container: {
        padding: 0,
        marginTop: 12,
        // margin: 12,
    },
    user: {
        padding: 18,
        alignItems: 'center',
        gap: 8,
    },
});
