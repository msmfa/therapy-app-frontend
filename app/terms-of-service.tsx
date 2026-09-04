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

export default function TermsOfServiceScreen() {
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
                    <AppText variant='h1'>Terms of Service</AppText>
                    <Spacer variant={ SpacerVariant.small } />
                    <AppText variant='caption' style={ styles.reviewNotice }>
                        Draft pending legal review. The subscription, billing and cancellation wording below has not yet
                        been reviewed by a qualified lawyer and must be before release.
                    </AppText>
                    <Spacer variant={ SpacerVariant.large } />
                    <View style={ styles.section }>
                        <AppText variant='h2'>Acceptance of these terms</AppText>
                        <Spacer variant={ SpacerVariant.small } />
                        <AppText variant='body'>
                            Plastic Brains ("we", "us", or "our") provides tools to help you prepare for, reflect on, and follow up
                            on therapy sessions. By creating an account or using the app, you agree to these Terms of Service and our
                            Privacy Policy. If you do not agree, do not use the app.
                        </AppText>
                    </View>

                    <Spacer variant={ SpacerVariant.large } />
                    <View style={ styles.section }>
                        <AppText variant='h2'>Eligibility & accounts</AppText>
                        <Spacer variant={ SpacerVariant.small } />
                        <AppText variant='body'>
                            You must be at least 18 years old, or the age of majority in your jurisdiction, to use the app. You are
                            responsible for the accuracy of the information you provide and for keeping your login credentials
                            secure. If you believe your account has been compromised, contact us immediately so we can help secure
                            it.
                        </AppText>
                    </View>

                    <Spacer variant={ SpacerVariant.large } />
                    <View style={ styles.section }>
                        <AppText variant='h2'>App usage</AppText>
                        <Spacer variant={ SpacerVariant.small } />
                        <AppText variant='body'>
                            The app is designed for personal, non-commercial use. You agree not to misuse the service, including by
                            attempting to reverse engineer, disrupt, or interfere with our systems. You may not upload unlawful,
                            infringing, or harmful content. We may suspend or terminate accounts that violate these terms.
                        </AppText>
                    </View>

                    <Spacer variant={ SpacerVariant.large } />
                    <View style={ styles.section }>
                        <AppText variant='h2'>Health & safety disclaimer</AppText>
                        <Spacer variant={ SpacerVariant.small } />
                        <AppText variant='body'>
                            Plastic Brains does not provide medical or mental health advice, diagnosis, or treatment. The information in
                            the app is for reflection and organization only. Always seek the advice of a licensed professional with
                            any questions about your mental health or medical condition. Call emergency services or a crisis hotline
                            if you are in danger or experiencing a mental health emergency.
                        </AppText>
                    </View>

                    <Spacer variant={ SpacerVariant.large } />
                    <View style={ styles.section }>
                        <AppText variant='h2'>Subscriptions and billing</AppText>
                        <Spacer variant={ SpacerVariant.small } />
                        <AppText variant='body'>
                            Plastic Brains is free to download. Access to the note, review and preparation features
                            requires a paid subscription, offered as an auto-renewing monthly plan or an auto-renewing
                            annual plan. Prices are shown in the app in your local currency before you confirm, and are
                            set by us through the App Store.
                        </AppText>
                        <Spacer variant={ SpacerVariant.small } />
                        <AppText variant='body'>
                            Eligible subscribers receive a one-month free trial with the annual plan or a one-week free
                            trial with the monthly plan. Apple decides whether your Apple ID is eligible for an
                            introductory offer. If you are not eligible, no trial is shown and billing begins
                            immediately. Unless you cancel at least 24 hours before the trial ends, your selected
                            subscription begins automatically at the price shown.
                        </AppText>
                        <Spacer variant={ SpacerVariant.small } />
                        <AppText variant='body'>
                            Payment is charged to your Apple ID account at confirmation of purchase. Subscriptions renew
                            automatically unless auto-renew is turned off at least 24 hours before the end of the current
                            period, and your account is charged for renewal within 24 hours of the end of that period.
                        </AppText>
                        <Spacer variant={ SpacerVariant.small } />
                        <AppText variant='body'>
                            You can manage or cancel a subscription, and turn off auto-renewal, in your Apple ID
                            subscription settings on your device. Cancelling stops future renewals; access continues
                            until the end of the period you have already paid for. We cannot cancel an Apple
                            subscription on your behalf.
                        </AppText>
                        <Spacer variant={ SpacerVariant.small } />
                        <AppText variant='body'>
                            If you reinstall the app or use another device signed in to the same Apple ID, use Restore
                            Purchases to reconnect an existing subscription. Restoring finds subscriptions bought with
                            that Apple ID only.
                        </AppText>
                        <Spacer variant={ SpacerVariant.small } />
                        <AppText variant='body'>
                            Purchases are made through Apple, so refunds are handled by Apple under their terms. Requests
                            are made through Apple Support, and we cannot grant or guarantee a refund. Your statutory
                            rights, where they apply, are unaffected.
                        </AppText>
                    </View>

                    <Spacer variant={ SpacerVariant.large } />
                    <View style={ styles.section }>
                        <AppText variant='h2'>User content & data</AppText>
                        <Spacer variant={ SpacerVariant.small } />
                        <AppText variant='body'>
                            You retain ownership of the notes and information you store in the app. Therapy note contents are processed
                            locally on your device and are not uploaded to us. We process your account and therapy session information
                            only as needed to provide the features you request. Refer to the Privacy Policy for details on how we collect,
                            use, and protect your data.
                        </AppText>
                    </View>

                    <Spacer variant={ SpacerVariant.large } />
                    <View style={ styles.section }>
                        <AppText variant='h2'>Service changes</AppText>
                        <Spacer variant={ SpacerVariant.small } />
                        <AppText variant='body'>
                            We may update, suspend, or discontinue features to comply with platform policies, enhance security, or
                            improve the experience. We will provide notice of material changes within the app or by email when
                            required. Continued use of the app after changes become effective signifies your acceptance of the
                            updates.
                        </AppText>
                    </View>

                    <Spacer variant={ SpacerVariant.large } />
                    <View style={ styles.section }>
                        <AppText variant='h2'>Termination</AppText>
                        <Spacer variant={ SpacerVariant.small } />
                        <AppText variant='body'>
                            You may stop using the app at any time and can request deletion of your account from the Settings screen.
                            We may terminate or suspend access if you violate these terms or if we discontinue the service. Upon
                            termination, sections of these terms that by their nature should survive (such as ownership, disclaimers,
                            and liability limitations) will continue to apply.
                        </AppText>
                    </View>

                    <Spacer variant={ SpacerVariant.large } />
                    <View style={ styles.section }>
                        <AppText variant='h2'>Limitation of liability</AppText>
                        <Spacer variant={ SpacerVariant.small } />
                        <AppText variant='body'>
                            Nothing in these terms excludes or limits liability where doing so would be unlawful, including liability
                            for death or personal injury caused by negligence, fraud, or fraudulent misrepresentation. Subject to that,
                            Plastic Brains is not responsible for losses that were not reasonably foreseeable or that result from
                            circumstances beyond our reasonable control. Nothing in these terms affects your statutory consumer rights.
                        </AppText>
                    </View>

                    <Spacer variant={ SpacerVariant.large } />
                    <View style={ styles.section }>
                        <AppText variant='h2'>Governing law</AppText>
                        <Spacer variant={ SpacerVariant.small } />
                        <AppText variant='body'>
                            These terms are governed by the laws of England and Wales. If you live elsewhere, you keep any mandatory
                            consumer protections provided by the laws of the country where you live. If any part of these terms is found
                            unenforceable, the remaining provisions remain in effect.
                        </AppText>
                    </View>

                    <Spacer variant={ SpacerVariant.large } />
                    <View style={ styles.section }>
                        <AppText variant='h2'>Contact</AppText>
                        <Spacer variant={ SpacerVariant.small } />
                        <AppText variant='body'>
                            For questions about these terms, email us at michael@plastic-brains.com.
                        </AppText>
                    </View>

                    <Spacer variant={ SpacerVariant.large } />
                </ScrollView>
            </MaskedView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    reviewNotice: {
        color: COLOR_VARIANTS.red.dark,
    },
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
