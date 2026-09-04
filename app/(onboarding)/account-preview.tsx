import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { Button } from '../../src/components/ui/Button';
import AppText from '../../src/components/ui/AppText';
import { OnboardingScreen } from '../../src/components/onboarding/OnboardingScreen';
import { AppleSignInButton } from '../../src/components/onboarding/AppleSignInButton';
import { useAuth } from '../../src/context/auth/AuthContext';
import { useOAuthLogin } from '../../src/auth/useOAuthLogin';
import { useAppAlert } from '../../src/context/alert';
import {
    ACCOUNT_STEP_RETURN,
    consumePendingOnboardingStep,
    setPendingOnboardingStep,
} from '../../src/features/onboarding/authReturn';
import { ACCOUNT_COPY, PURCHASE_COPY } from '../../src/features/onboarding/onboardingCopy';
import { useOnboardingAnswers } from '../../src/features/onboarding/OnboardingAnswersContext';
import { purchase } from '../../src/features/subscription/storeKit';
import { useEntitlementState } from '../../src/features/subscription/EntitlementContext';
import { useOnboarding } from '../../src/context/onboarding/OnboardingContext';
import { TEXT_COLORS } from 'designs/designs-colors';
import { firstIncompletePlanRoute } from '../../src/features/onboarding/flowGuard';

type Stage = 'account' | 'purchasing' | 'purchase_failed' | 'purchase_unlinked';

/**
 * The authentication step, and the trigger for Apple's purchase sheet.
 *
 * Authentication reuses what the app already has: `useOAuthLogin` for Apple (the
 * hook behind SocialAuthButtons) and the existing (auth) screens for email. Both
 * routes out carry `returnTo=account-preview`, so a successful sign-in comes back
 * here rather than restarting onboarding, and the purchase for the plan chosen on
 * the previous screen starts immediately afterwards.
 */
export default function AccountPreviewScreen() {
    const router = useRouter();
    const { isAuthenticated } = useAuth();
    const { answers, setAnswer } = useOnboardingAnswers();
    const { showAlert } = useAppAlert();
    const { state: entitlement, refresh: refreshEntitlement } = useEntitlementState();
    const { hasOnboarded, hydrated: onboardingHydrated } = useOnboarding();

    const [stage, setStage] = useState<Stage>('account');
    const purchaseStartedRef = useRef(false);

    const startPurchase = useCallback(async () => {
        if (purchaseStartedRef.current || !onboardingHydrated || entitlement.status === 'loading')
            return;

        // Restore can happen on the plans screen before app authentication.
        // Once the account is connected, continue without asking Apple to sell
        // the same subscription again.
        if (answers.entitlementConfirmedThisSession) {
            if (isAuthenticated) {
                router.replace(hasOnboarded ? '/(tabs)' : '/(onboarding)/notifications-preview');
            }
            return;
        }

        // A purchase may already have completed before the app was closed, or
        // on another device. The per-run navigation latch is deliberately not
        // persisted, so the durable entitlement has to restore it here before
        // we consider presenting Apple with another purchase request.
        if (entitlement.status === 'active') {
            setAnswer('entitlementConfirmedThisSession', true);
            router.replace(hasOnboarded ? '/(tabs)' : '/(onboarding)/notifications-preview');
            return;
        }

        purchaseStartedRef.current = true;
        setStage('purchasing');

        // Apple presents its own confirmation sheet here, with the localised
        // price and trial. Nothing about it is drawn by the app.
        const result = await purchase(answers.plan);
        purchaseStartedRef.current = false;

        if (result.status === 'purchased' || result.status === 'restored') {
            // The provider may still hold the inactive value it read before
            // Apple opened the purchase sheet. Put it into loading immediately
            // and re-read StoreKit, otherwise finishing onboarding can enter the
            // paid tabs and be bounced straight back to this paywall.
            refreshEntitlement();
            setAnswer('entitlementConfirmedThisSession', true);
            router.replace(hasOnboarded ? '/(tabs)' : '/(onboarding)/notifications-preview');
            return;
        }

        if (result.status === 'cancelled') {
            setStage('account');
            // Backing out is not an error, and says so.
            showAlert(PURCHASE_COPY.cancelledTitle, PURCHASE_COPY.cancelled);
            router.replace('/(onboarding)/subscription-preview');
            return;
        }

        if (result.status === 'pending') {
            setStage('account');
            showAlert(PURCHASE_COPY.pendingTitle, PURCHASE_COPY.pending);
            return;
        }

        if (result.status === 'unlinked') {
            setStage('purchase_unlinked');
            return;
        }

        setStage('purchase_failed');
    }, [
        answers.entitlementConfirmedThisSession,
        answers.plan,
        entitlement.status,
        hasOnboarded,
        isAuthenticated,
        onboardingHydrated,
        refreshEntitlement,
        router,
        setAnswer,
        showAlert,
    ]);

    // Only auto-start when this screen is what sent the user to authenticate.
    // Someone who signed in from Welcome and walked down to here still gets the
    // account screen, with an explicit action.
    const resumedRef = useRef(false);
    useEffect(() => {
        if (resumedRef.current || !onboardingHydrated || entitlement.status === 'loading') return;
        resumedRef.current = true;

        const pending = consumePendingOnboardingStep(ACCOUNT_STEP_RETURN);
        if (pending !== null && isAuthenticated) {
            void startPurchase();
        }
    }, [entitlement.status, isAuthenticated, onboardingHydrated, startPurchase]);

    const openAuth = useCallback(
        (pathname: '/(auth)/login' | '/(auth)/signup') => {
            setPendingOnboardingStep(ACCOUNT_STEP_RETURN);
            router.push({ pathname, params: { returnTo: ACCOUNT_STEP_RETURN } });
        },
        [router],
    );

    // Do not purchase directly in useOAuthLogin's success callback. At that
    // exact moment the auth token is live but the per-user onboarding flag is
    // still the signed-out value. Waiting for the remounted effect above keeps
    // returning customers out of the new-user completion path.
    const { appleAvailable, loadingProvider, signInWithApple } = useOAuthLogin();
    const appleLoading = loadingProvider === 'apple';
    const busy =
        appleLoading ||
		stage === 'purchasing' ||
		!onboardingHydrated ||
		(isAuthenticated && entitlement.status === 'loading');
    const incompletePlanRoute = hasOnboarded ? null : firstIncompletePlanRoute(answers);

    if (incompletePlanRoute !== null) {
        return <Redirect href={ incompletePlanRoute } />;
    }

    if (stage === 'purchase_failed' || stage === 'purchase_unlinked') {
        const failedCopy =
            stage === 'purchase_unlinked'
                ? {
                    headline: PURCHASE_COPY.unlinkedTitle,
                    body: PURCHASE_COPY.unlinkedBody,
                }
                : {
                    headline: PURCHASE_COPY.errorTitle,
                    body: PURCHASE_COPY.errorBody,
                };

        return (
            <OnboardingScreen
                backHref="/(onboarding)/subscription-preview"
                headline={ failedCopy.headline }
                supporting={ failedCopy.body }
                footer={
                    <>
                        <Button
                            label={ PURCHASE_COPY.errorPrimary }
                            onPress={ () => void startPurchase() }
                        />
                        <Button
                            label={ PURCHASE_COPY.errorSecondary }
                            transparent
                            onPress={ () => router.replace('/(onboarding)/subscription-preview') }
                        />
                    </>
                }
            />
        );
    }

    return (
        <OnboardingScreen
            backHref="/(onboarding)/subscription-preview"
            headline={ isAuthenticated
                ? ACCOUNT_COPY.authenticatedHeadline
                : ACCOUNT_COPY.headline }
            supporting={ isAuthenticated
                ? ACCOUNT_COPY.authenticatedBody
                : ACCOUNT_COPY.body }
            footer={
                <>
                    { isAuthenticated ? (
                        <Button
                            label={ ACCOUNT_COPY.continue }
                            loading={ busy }
                            onPress={ () => void startPurchase() }
                        />
                    ) : (
                        <>
                            { appleAvailable && (
                                <AppleSignInButton
                                    disabled={ busy }
                                    onPress={ () => {
                                        setPendingOnboardingStep(ACCOUNT_STEP_RETURN);
                                        void signInWithApple();
                                    } }
                                />
                            ) }

                            <Button
                                label={ ACCOUNT_COPY.email }
                                transparent
                                disabled={ busy }
                                onPress={ () => openAuth('/(auth)/signup') }
                            />

                            <TouchableOpacity
                                onPress={ () => openAuth('/(auth)/login') }
                                disabled={ busy }
                                accessibilityRole="button"
                                accessibilityLabel={ ACCOUNT_COPY.existing }
                                style={ styles.existing }
                            >
                                <AppText variant="body" style={ styles.existingLabel }>
                                    { ACCOUNT_COPY.existing }
                                </AppText>
                            </TouchableOpacity>
                        </>
                    ) }
                </>
            }
        >
            <View style={ styles.legal }>
                <AppText variant="caption" style={ styles.legalText }>
                    { `${ACCOUNT_COPY.legalPrefix}${ACCOUNT_COPY.legalTerms}${ACCOUNT_COPY.legalMiddle}${ACCOUNT_COPY.legalPrivacy}${ACCOUNT_COPY.legalSuffix}` }
                </AppText>

                { /* The two documents as their own targets. Inline links inside the
                     sentence would be 14pt tall, well under the 44pt minimum. */ }
                <View style={ styles.legalLinks }>
                    <TouchableOpacity
                        onPress={ () => router.push('/terms-of-service') }
                        accessibilityRole="link"
                        accessibilityLabel={ ACCOUNT_COPY.legalTerms }
                        style={ styles.legalLink }
                    >
                        <AppText variant="caption" style={ styles.legalLinkLabel }>
                            { ACCOUNT_COPY.legalTerms }
                        </AppText>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={ () => router.push('/privacy-policy') }
                        accessibilityRole="link"
                        accessibilityLabel={ ACCOUNT_COPY.legalPrivacy }
                        style={ styles.legalLink }
                    >
                        <AppText variant="caption" style={ styles.legalLinkLabel }>
                            { ACCOUNT_COPY.legalPrivacy }
                        </AppText>
                    </TouchableOpacity>
                </View>
            </View>
        </OnboardingScreen>
    );
}

const styles = StyleSheet.create({
    legal: {
        marginTop: 28,
    },
    legalText: {
        fontSize: 14,
        lineHeight: 21,
        color: TEXT_COLORS.secondary,
    },
    legalLinks: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 4,
        marginLeft: -10,
    },
    legalLink: {
        minHeight: 44,
        minWidth: 44,
        paddingHorizontal: 10,
        justifyContent: 'center',
    },
    legalLinkLabel: {
        fontSize: 14,
        lineHeight: 21,
        color: TEXT_COLORS.primary,
        textDecorationLine: 'underline',
    },
    existing: {
        minHeight: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    existingLabel: {
        color: TEXT_COLORS.primary,
        textDecorationLine: 'underline',
    },
});
