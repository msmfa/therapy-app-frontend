import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet, View } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import AppText from '../src/components/ui/AppText';
import Spacer, { SpacerVariant } from 'src/components/ui/Spacer';
import { GlassCircleButton } from '../src/components/ui/GlassCircleButton';
import { COLOR_VARIANTS } from 'designs/designs-colors';

const EFFECTIVE_DATE = 'August 26, 2026';

export default function PrivacyPolicyScreen() {
    const router = useRouter();

    const handleBack = () => {
        router.back();
    };

    return (
        <SafeAreaView style={ styles.container } edges={ ['top', 'left', 'right'] }>
            <View style={ styles.pageHeader }>
                <GlassCircleButton
                    accessibilityLabel="Back"
                    icon="back"
                    iconColor={ COLOR_VARIANTS.black.primary }
                    size={ 48 }
                    onPress={ handleBack }
                />
            </View>
            <MaskedView
                style={ styles.scroll }
                maskElement={
                    <LinearGradient
                        colors={ ['transparent', '#000000', '#000000'] }
                        locations={ [0, 0.05, 1] }
                        style={ StyleSheet.absoluteFillObject }
                    />
                }
            >
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
                            Plastic Brains ("we", "us", or "our") helps you prepare for, reflect on, and follow up on therapy sessions. This policy explains how we handle your information in line with App Store requirements. By using the app, you agree to the practices described here.
                        </AppText>
                    </View>

                    <Spacer variant={ SpacerVariant.large } />
                    <View style={ styles.section }>
                        <AppText variant='h2'>Information we collect</AppText>
                        <Spacer variant={ SpacerVariant.small } />
                        <AppText variant='body'>
                            - Account details you provide, such as your name, email address, and authentication identifiers when you sign in with email or Apple.
                            { '\n' }- Therapy session details and preferences you enter, including session dates, reminder times, and the reflection goal you choose during onboarding.
                            { '\n' }- Device and usage information, such as app version, device type, crash logs, and basic interactions used to keep the service reliable.
                            { '\n' }- Information from authentication partners (Apple), limited to the identifiers, names, and email addresses you authorize them to share with us.
                            { '\n' }- Subscription and entitlement information, described in the section below.
                        </AppText>
                        <Spacer variant={ SpacerVariant.small } />
                        <AppText variant='body'>
                            Therapy note contents are encrypted and stored locally on your iPhone. We do not collect, upload, or retain the contents of your therapy notes on our servers.
                        </AppText>
                    </View>

                    <Spacer variant={ SpacerVariant.large } />
                    <View style={ styles.section }>
                        <AppText variant='h2'>Subscription and entitlement data</AppText>
                        <Spacer variant={ SpacerVariant.small } />
                        <AppText variant='body'>
                            Subscriptions are bought through Apple. We never see or receive your card details, billing
                            address, or full Apple ID: payment is handled entirely by Apple, and we are not a party to it.
                        </AppText>
                        <Spacer variant={ SpacerVariant.small } />
                        <AppText variant='body'>
                            To know whether your subscription is active, we process:
                            { '\n' }- Which plan you chose (monthly or annual) and whether an introductory trial applied.
                            { '\n' }- The product identifier and an Apple transaction identifier for the purchase.
                            { '\n' }- The current status of the subscription, such as active, in trial, expired or cancelled, and the date the current period ends.
                            { '\n' }- Whether your Apple ID was eligible for an introductory offer, as reported by Apple.
                        </AppText>
                        <Spacer variant={ SpacerVariant.small } />
                        <AppText variant='body'>
                            This information is linked to your Plastic Brains account so the app can unlock the features you
                            have paid for on any device you sign in to, and so Restore Purchases works. It is not used for
                            advertising or profiling, is never combined with the contents of your therapy notes, and is not
                            sold or shared with third parties.
                        </AppText>
                        <Spacer variant={ SpacerVariant.small } />
                        <AppText variant='body'>
                            Apple may also send us server notifications about changes to your subscription, such as a renewal,
                            a cancellation, or a refund Apple has granted, so that access stays accurate. We keep subscription
                            records for as long as your account exists and for the period required for tax and accounting, then
                            delete them. Deleting your account removes them on the same terms described under Data retention &
                            deletion; it does not cancel an Apple subscription, which you cancel in your Apple ID subscription
                            settings.
                        </AppText>
                    </View>

                    <Spacer variant={ SpacerVariant.large } />
                    <View style={ styles.section }>
                        <AppText variant='h2'>Website analytics & iOS release signup</AppText>
                        <Spacer variant={ SpacerVariant.small } />
                        <AppText variant='body'>
                            On the Plastic Brains website, we use Google Analytics 4 to understand site visits, where visitors came from, general interactions such as scrolling and following links, and selected actions such as opening the release signup, completing or failing a signup, opening an FAQ answer, and following an evidence link.
                        </AppText>
                        <Spacer variant={ SpacerVariant.small } />
                        <AppText variant='body'>
                            Google Analytics does not set analytics cookies unless you choose “Allow analytics” on the website. Advertising storage, Google signals, and ad personalisation remain disabled. We do not send email addresses, therapy note contents, form text, or other health information to Google Analytics.
                        </AppText>
                        <Spacer variant={ SpacerVariant.small } />
                        <AppText variant='body'>
                            If you sign up for the iOS release notification, Loops receives your email address and adds it to the private Plastic Brains iOS release list. Loops will ask you to confirm your email address first. We use confirmed addresses only to send the App Store download link on release day, not for general marketing.
                        </AppText>
                        <Spacer variant={ SpacerVariant.small } />
                        <AppText variant='body'>
                            You can unsubscribe using the link in an email or by contacting us. We keep the signup record only while it is needed for the release notification. Loops may keep a suppression record after you unsubscribe so we can respect your choice and avoid emailing you again.
                        </AppText>
                    </View>

                    <Spacer variant={ SpacerVariant.large } />
                    <View style={ styles.section }>
                        <AppText variant='h2'>How we use information</AppText>
                        <Spacer variant={ SpacerVariant.small } />
                        <AppText variant='body'>
                            - Deliver core features such as storing notes locally, saving the therapy session dates and reflection goal you enter, personalising note prompts, and scheduling reminders.
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
                            { '\n' }- Session data: The app stores the session times you enter and syncs those times with our backend so we can schedule reminders. It does not read or sync with your external calendar.
                        </AppText>
                        <Spacer variant={ SpacerVariant.small } />
                        <AppText variant='body'>
                            We rely on trusted service providers to operate the app, including authentication through Apple, cloud hosting, and push notification delivery via Expo services. These partners process your data only to provide the services we request and are bound by contractual safeguards.
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
                            We keep your account information, therapy session dates, reflection goal, reminder settings, and registered device information for as long as you maintain an account. You can request deletion from the Settings screen or by contacting us. Once deleted, we remove personal data from active systems within 30 days unless we must retain it for legal obligations.
                        </AppText>
                        <Spacer variant={ SpacerVariant.small } />
                        <AppText variant='body'>
                            Your therapy notes are not part of your server account or its retention period. They remain encrypted on your iPhone until you delete them or remove the app. We never retain server copies of your notes.
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
                            Plastic Brains is designed for adults aged 18 and over. We do not knowingly collect personal information from anyone under 18. If you believe someone under 18 has provided us with personal data, contact us so we can delete it.
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
                            For questions or to exercise your privacy rights, email us at michael@plastic-brains.com.
                        </AppText>
                    </View>

                    <Spacer variant={ SpacerVariant.large } />
                </ScrollView>
            </MaskedView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    pageHeader: {
        alignItems: 'center',
        flexDirection: 'row',
        paddingBottom: 8,
        paddingHorizontal: 24,
        paddingTop: 8,
    },
    container: {
        flex: 1,
        backgroundColor: COLOR_VARIANTS.white.primary,
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 72,
        gap: 0,
    },
    section: {
        gap: 8,
    },
});
