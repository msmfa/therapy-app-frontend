import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { OnboardingButton } from '../../src/components/onboarding/OnboardingButton';
import { OnboardingLink } from '../../src/components/onboarding/OnboardingLink';
import AppText from '../../src/components/ui/AppText';
import { OnboardingScreen } from '../../src/components/onboarding/OnboardingScreen';
import { AppleSignInButton } from '../../src/components/onboarding/AppleSignInButton';
import { AccountPlanSummary } from '../../src/components/onboarding/AccountPlanSummary';
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
import { useSubscriptionOffer } from '../../src/features/subscription/useSubscriptionOffer';
import { accountSummaryRows } from '../../src/features/onboarding/accountSummary';
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
    // For the price on the summary: the same store read as the plans screen,
    // so the figure here is the one they just chose.
    const { state: offer } = useSubscriptionOffer();

    const [stage, setStage] = useState<Stage>('account');
    const purchaseStartedRef = useRef(false);

    const startPurchase = useCallback(async () => {
        if (purchaseStartedRef.current || !onboardingHydrated || entitlement.status === 'loading')
            return;

        // The sign-in handoff effect can run even when this render redirects.
        // Recheck the plan before opening Apple's purchase sheet.
        const incompleteRoute = hasOnboarded ? null : firstIncompletePlanRoute(answers);
        if (incompleteRoute !== null) {
            router.replace(incompleteRoute);
            return;
        }

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
        const result = await purchase(answers.plan, {
            entryPoint: hasOnboarded ? 'account' : 'onboarding',
        });
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
        answers.cadence,
        answers.entitlementConfirmedThisSession,
        answers.goal,
        answers.plan,
        answers.sessionAt,
        answers.sessionDateSkipped,
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
                analyticsStep="account_preview"
                backHref="/(onboarding)/subscription-preview"
                headline={ failedCopy.headline }
                supporting={ failedCopy.body }
                footer={
                    <>
                        <OnboardingButton
                            label={ PURCHASE_COPY.errorPrimary }
                            onPress={ () => void startPurchase() }
                        />
                        <OnboardingButton
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
            analyticsStep="account_preview"
            backHref="/(onboarding)/subscription-preview"
            headline={ ACCOUNT_COPY.headline }
            supporting={ isAuthenticated
                ? ACCOUNT_COPY.authenticatedBody
                : ACCOUNT_COPY.body }
            // The band the flow uses for the line a screen exists to say,
            // rather than a paragraph about the content under it.
            supportingAppearance="banner"
            footer={
                <>
                    { /* Directly above the action it governs, as on the plans
                         screen: a notice that has to be read before the tap
                         belongs next to the button, not up in the content
                         with a screen's worth of space between the two. */ }
                    <View style={ styles.legal }>
                        <AppText variant="caption" style={ styles.legalText }>
                            { ACCOUNT_COPY.legalIntro }
                        </AppText>

                        { /* The two documents as their own targets. Inline
                             links inside the sentence would be 14pt tall,
                             well under the 44pt minimum. */ }
                        <View style={ styles.legalLinks }>
                            <OnboardingLink
                                label={ ACCOUNT_COPY.legalTerms }
                                size="caption"
                                onPress={ () => router.push('/terms-of-service') }
                                style={ styles.legalLink }
                            />

                            <OnboardingLink
                                label={ ACCOUNT_COPY.legalPrivacy }
                                size="caption"
                                onPress={ () => router.push('/privacy-policy') }
                                style={ styles.legalLink }
                            />
                        </View>
                    </View>

                    { isAuthenticated ? (
                        <OnboardingButton
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

                            { /* A button like the rest of the flow's, not a
                                 text link: it is the other way in, not a
                                 footnote to Apple's. */ }
                            <OnboardingButton
                                label={ ACCOUNT_COPY.email }
                                disabled={ busy }
                                onPress={ () => openAuth('/(auth)/signup') }
                            />

                            <OnboardingButton
                                label={ ACCOUNT_COPY.signIn }
                                transparent
                                disabled={ busy }
                                onPress={ () => openAuth('/(auth)/login') }
                            />
                        </>
                    ) }
                </>
            }
        >
            <AccountPlanSummary rows={ accountSummaryRows(
                answers,
                offer,
                isAuthenticated,
                answers.entitlementConfirmedThisSession || entitlement.status === 'active',
            ) } />

        </OnboardingScreen>
    );
}

const styles = StyleSheet.create({
    legal: {
        alignItems: 'center',
    },
    legalText: {
        fontSize: 14,
        lineHeight: 21,
        color: TEXT_COLORS.secondary,
        textAlign: 'center',
    },
    legalLinks: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        columnGap: 20,
    },
    legalLink: {
        minWidth: 44,
    },
});
