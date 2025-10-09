import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import AppText from '../src/components/ui/AppText';
import Spacer, { SpacerVariant } from 'src/components/ui/Spacer';
import { Button } from '../src/components/ui/Button';
import { COLOR_VARIANTS } from 'designs/designs-colors';

export default function TermsOfServiceScreen() {
    const router = useRouter();

    const handleBack = () => {
        router.back();
    };

    return (
        <SafeAreaView style={ styles.container }>
            <ScrollView
                style={ styles.scroll }
                contentContainerStyle={ styles.scrollContent }
                showsVerticalScrollIndicator={ false }
            >
                <AppText variant='h1'>Terms of Service</AppText>
                <Spacer variant={ SpacerVariant.large } />
                <View style={ styles.section }>
                    <AppText variant='h2'>Acceptance of these terms</AppText>
                    <Spacer variant={ SpacerVariant.small } />
                    <AppText variant='body'>
                        Therapy App ("we", "us", or "our") provides tools to help you prepare for, reflect on, and follow up
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
                        Therapy App does not provide medical or mental health advice, diagnosis, or treatment. The information in
                        the app is for reflection and organization only. Always seek the advice of a licensed professional with
                        any questions about your mental health or medical condition. Call emergency services or a crisis hotline
                        if you are in danger or experiencing a mental health emergency.
                    </AppText>
                </View>

                <Spacer variant={ SpacerVariant.large } />
                <View style={ styles.section }>
                    <AppText variant='h2'>Subscriptions & payments</AppText>
                    <Spacer variant={ SpacerVariant.small } />
                    <AppText variant='body'>
                        Some features may require a paid subscription through the Apple App Store or Google Play. Payments,
                        renewals, and refunds are managed by the respective store and subject to its terms. If you cancel, you
                        retain access to paid features until the end of the current billing period, unless the store provides a
                        different remedy.
                    </AppText>
                </View>

                <Spacer variant={ SpacerVariant.large } />
                <View style={ styles.section }>
                    <AppText variant='h2'>User content & data</AppText>
                    <Spacer variant={ SpacerVariant.small } />
                    <AppText variant='body'>
                        You retain ownership of the notes and information you store in the app. By using the service, you grant us
                        a limited license to process your data only as needed to provide the features you request. Refer to the
                        Privacy Policy for details on how we collect, use, and protect your data.
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
                        To the fullest extent permitted by law, Therapy App and its team are not liable for indirect, incidental,
                        or consequential damages arising from your use of the app. Our total liability for any claim related to
                        the app will not exceed the amounts you paid us during the prior twelve months, or ten U.S. dollars if no
                        fees were paid.
                    </AppText>
                </View>

                <Spacer variant={ SpacerVariant.large } />
                <View style={ styles.section }>
                    <AppText variant='h2'>Governing law</AppText>
                    <Spacer variant={ SpacerVariant.small } />
                    <AppText variant='body'>
                        These terms are governed by the laws of the State of California, USA, without regard to conflict of law
                        principles. If any part of these terms is found unenforceable, the remaining provisions remain in effect.
                    </AppText>
                </View>

                <Spacer variant={ SpacerVariant.large } />
                <View style={ styles.section }>
                    <AppText variant='h2'>Contact</AppText>
                    <Spacer variant={ SpacerVariant.small } />
                    <AppText variant='body'>
                        { /* Placeholder: update contact email before launch (see TODO.md). */ }
                        For questions about these terms, email us at codemoore@outlook.com.
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
        backgroundColor: COLOR_VARIANTS.white.primary,
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
