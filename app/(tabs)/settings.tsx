import React, { useCallback, useState } from 'react';
import { View, StyleSheet, Alert, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/auth/AuthContext';
import { GradientUpwards } from '../../src/components/GradientUpwards';
import { GradientRow } from '../../src/components/ui/GradientRow';
import { SettingsRow } from '../../src/components/SettingsRow';
import AppText from '../../src/components/ui/AppText';
import Spacer, { SpacerVariant } from 'src/components/ui/Spacer';
import Card from 'src/components/ui/Card';
import Loading from 'src/components/ui/Loading';
import { deleteCurrentUser } from '../../src/api/users';

export default function SettingsScreen() {
    const { user, signOut } = useAuth();
    const router = useRouter();
    const [deleting, setDeleting] = useState(false);

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

    const performDeleteAccount = useCallback(async () => {
        setDeleting(true);
        try {
            await deleteCurrentUser();
            await signOut();
        } catch (error) {
            setDeleting(false);
            const message = error instanceof Error ? error.message : 'Failed to delete account';
            Alert.alert('Error', message);
        }
    }, [signOut]);

    const handleRateApp = useCallback(
        createHandleRateApp({
            select: Platform.select,
            openURL: Linking.openURL,
            alert: Alert.alert,
        }),
        [],
    );

    const handlePrivacyPolicy = useCallback(
        createPrivacyPolicyHandler(router.push),
        [router],
    );

    const onDeleteAccount = useCallback(() => {
        if (deleting) {
            return;
        }
        Alert.alert(
            'Delete account',
            'This will permanently remove your account and all stored data. This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        void performDeleteAccount();
                    },
                },
            ],
        );
    }, [deleting, performDeleteAccount]);

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
                        <SettingsRow text="Delete account" onPress={ onDeleteAccount } />
                        <SettingsRow text="Privacy Policy" onPress={ handlePrivacyPolicy } />
                        <SettingsRow text="Rate this App" onPress={ handleRateApp } />
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

type RateAppDeps = {
    select: typeof Platform.select;
    openURL: typeof Linking.openURL;
    alert: typeof Alert.alert;
};

function createHandleRateApp({ select, openURL, alert }: RateAppDeps) {
    return () => {
        const storeUrl = select({
            ios: 'itms-apps://itunes.apple.com/app/id000000000?action=write-review', // TODO: replace with real App Store ID
            android: 'market://details?id=com.example.therapyapp', // TODO: replace with real package name
            default: 'https://therapy-app.example.com', // TODO: replace with real fallback URL
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

type PushFn = (route: string) => void;

function createPrivacyPolicyHandler(push: PushFn) {
    return () => {
        push('/privacy-policy');
    };
}
