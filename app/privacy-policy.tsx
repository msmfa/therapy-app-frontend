import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { GradientUpwards } from '../src/components/GradientUpwards';
import AppText from '../src/components/ui/AppText';
import Spacer, { SpacerVariant } from 'src/components/ui/Spacer';
import { Button } from '../src/components/ui/Button';
import { palette } from '../new-design';

const EFFECTIVE_DATE = 'January 15, 2025';

export default function PrivacyPolicyScreen() {
    const router = useRouter();

    const handleBack = () => {
        router.back();
    };

    return (
        <SafeAreaView style={ styles.container }>
            <GradientUpwards />
            <ScrollView
                style={ styles.scroll }
                contentContainerStyle={ styles.scrollContent }
                showsVerticalScrollIndicator={ false }
            >
                <AppText variant='h1'>Privacy Policy</AppText>
                <Spacer variant={ SpacerVariant.small } />
                <AppText variant='body'>Effective date: { EFFECTIVE_DATE }</AppText>

                <Spacer variant={ SpacerVariant.large } />
                <View style={ styles.section }>
                    <AppText variant='h2'>About this policy</AppText>
                    <Spacer variant={ SpacerVariant.small } />
                    <AppText variant='body'>
                        Therapy App ("we", "us", or "our") helps you prepare for, reflect on, and follow up on therapy sessions. This policy explains how we handle your information in line with Google Play and Apple App Store requirements. By using the app, you agree to the practices described here.
                    </AppText>
                </View>

                <Spacer variant={ SpacerVariant.large } />
                <View style={ styles.section }>
                    <AppText variant='h2'>Information we collect</AppText>
                    <Spacer variant={ SpacerVariant.small } />
                    <AppText variant='body'>
                        - Account details you provide, such as your name, email address, and authentication identifiers when you sign in with email, Apple, or Google.
                        { '\n' }- Therapy-related entries you create, including notes, session dates, reminder preferences, and optional reflections.
                        { '\n' }- Device and usage information, such as app version, device type, crash logs, and basic interactions used to keep the service reliable.
                        { '\n' }- Information from authentication partners (Apple and Google), limited to the identifiers, names, and email addresses you authorize them to share with us.
                    </AppText>
                    <Spacer variant={ SpacerVariant.small } />
                    <AppText variant='body'>
                        Therapy notes stay on your phone. We store them using the device's encrypted secure storage so even if your phone is lost or stolen, no one, including our team, can access them without your device credentials.
                    </AppText>
                </View>

                <Spacer variant={ SpacerVariant.large } />
                <View style={ styles.section }>
                    <AppText variant='h2'>How we use information</AppText>
                    <Spacer variant={ SpacerVariant.small } />
                    <AppText variant='body'>
                        - Deliver core features like saving notes, scheduling reminders, and syncing your therapy calendar.
                        { '\n' }- Authenticate your account, prevent fraud, and keep the app secure.
                        { '\n' }- Send optional push notifications about upcoming sessions or follow-up reminders when you enable them.
                        { '\n' }- Improve performance, troubleshoot issues, and develop new features based on aggregate usage trends.
                    </AppText>
                </View>

                <Spacer variant={ SpacerVariant.large } />
                <View style={ styles.section }>
                    <AppText variant='h2'>Device permissions & third parties</AppText>
                    <Spacer variant={ SpacerVariant.small } />
                    <AppText variant='body'>
                        - Notifications: We request permission to send push notifications so you can receive reminders. You can change this at any time in your device settings.
                        { '\n' }- Secure storage: We use the device's secure storage APIs to keep authentication tokens protected locally.
                        { '\n' }- Calendar data: The app stores session times you enter; it does not read your external calendars unless you choose to sync through our backend.
                    </AppText>
                    <Spacer variant={ SpacerVariant.small } />
                    <AppText variant='body'>
                        We rely on trusted service providers to operate the app, including authentication through Apple and Google, cloud hosting, and push notification delivery via Expo services. These partners process your data only to provide the services we request and are bound by contractual safeguards.
                    </AppText>
                </View>

                <Spacer variant={ SpacerVariant.large } />
                <View style={ styles.section }>
                    <AppText variant='h2'>How we share information</AppText>
                    <Spacer variant={ SpacerVariant.small } />
                    <AppText variant='body'>
                        We do not sell your personal information. We only share data with:
                        { '\n' }- Service providers that help us operate the app (hosting, authentication, notifications).
                        { '\n' }- Authorities or advisors when required by law or to protect rights, safety, or property.
                    </AppText>
                </View>

                <Spacer variant={ SpacerVariant.large } />
                <View style={ styles.section }>
                    <AppText variant='h2'>Data retention & deletion</AppText>
                    <Spacer variant={ SpacerVariant.small } />
                    <AppText variant='body'>
                        We keep your notes, reminders, and account information for as long as you maintain an account. You can request deletion from the Settings screen or by contacting us. Once deleted, we remove personal data from active systems within 30 days unless we must retain it for legal obligations.
                    </AppText>
                    <Spacer variant={ SpacerVariant.small } />
                    <AppText variant='body'>
                        Because your therapy notes remain locally encrypted on your device, they disappear when you delete the app or clear the secure storage. We never retain server copies of your notes.
                    </AppText>
                </View>

                <Spacer variant={ SpacerVariant.large } />
                <View style={ styles.section }>
                    <AppText variant='h2'>Security</AppText>
                    <Spacer variant={ SpacerVariant.small } />
                    <AppText variant='body'>
                        We implement administrative, technical, and physical safeguards to protect your information, including encrypted network connections, secure credential storage, and access controls. No method of transmission or storage is completely secure, so we encourage you to use unique passwords and keep your device protected.
                    </AppText>
                </View>

                <Spacer variant={ SpacerVariant.large } />
                <View style={ styles.section }>
                    <AppText variant='h2'>International users</AppText>
                    <Spacer variant={ SpacerVariant.small } />
                    <AppText variant='body'>
                        Our servers are operated by third-party providers that may process data in the United States and other countries. By using the app, you understand your data may be transferred to and processed in jurisdictions that may have different data protection laws than your home country.
                    </AppText>
                </View>

                <Spacer variant={ SpacerVariant.large } />
                <View style={ styles.section }>
                    <AppText variant='h2'>Children's privacy</AppText>
                    <Spacer variant={ SpacerVariant.small } />
                    <AppText variant='body'>
                        The app is designed for adults and is not intended for children under 13 (or the age required in your country). We do not knowingly collect personal information from children. If you believe a child has provided us with personal data, contact us so we can delete it.
                    </AppText>
                </View>

                <Spacer variant={ SpacerVariant.large } />
                <View style={ styles.section }>
                    <AppText variant='h2'>Your rights & choices</AppText>
                    <Spacer variant={ SpacerVariant.small } />
                    <AppText variant='body'>
                        Depending on where you live, you may have rights to access, correct, export, or delete your data, and to object to or restrict certain processing. You can manage most settings directly in the app or by emailing us. We will respond within 30 days as required by the app stores and applicable law.
                    </AppText>
                </View>

                <Spacer variant={ SpacerVariant.large } />
                <View style={ styles.section }>
                    <AppText variant='h2'>Changes to this policy</AppText>
                    <Spacer variant={ SpacerVariant.small } />
                    <AppText variant='body'>
                        We may update this policy to reflect new features or legal requirements. If we make material changes, we will notify you in the app or by email and update the effective date above. Continued use of the app after a change means you accept the revised policy.
                    </AppText>
                </View>

                <Spacer variant={ SpacerVariant.large } />
                <View style={ styles.section }>
                    <AppText variant='h2'>Contact us</AppText>
                    <Spacer variant={ SpacerVariant.small } />
                    <AppText variant='body'>
                        { /* Placeholder: update contact email before launch (see TODO.md). */ }
                        For questions or to exercise your privacy rights, email us at codemoore@outlook.com.
                    </AppText>
                </View>

                <Spacer variant={ SpacerVariant.large } />
            </ScrollView>
            <View style={ styles.footer }>
                <Button label='Back' onPress={ handleBack } transparent />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: palette.neutral.white,
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 32,
        gap: 0,
    },
    section: {
        gap: 8,
    },
    footer: {
        paddingHorizontal: 24,
        paddingBottom: 24,
    },
});
