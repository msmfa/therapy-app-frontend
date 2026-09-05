import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { Button } from '../../src/components/ui/Button';
import AppText from '../../src/components/ui/AppText';
import Loading from '../../src/components/ui/Loading';
import { OnboardingScreen } from '../../src/components/onboarding/OnboardingScreen';
import { SubscriptionPlanCard } from '../../src/components/onboarding/SubscriptionPlanCard';
import {
    ERROR_COPY,
    GOAL_OPTIONS,
    SUBSCRIPTION_COPY,
    planCtaLabel,
    planRenewalLine,
    trialBadgeLine,
    trialHeadline,
    cardPriceLine,
    trialTimeline,
} from '../../src/features/onboarding/onboardingCopy';
import { useOnboardingAnswers } from '../../src/features/onboarding/OnboardingAnswersContext';
import { useSubscriptionOffer } from '../../src/features/subscription/useSubscriptionOffer';
import { restore } from '../../src/features/subscription/storeKit';
import { PURCHASE_COPY } from '../../src/features/onboarding/onboardingCopy';
import { useAppAlert } from '../../src/context/alert';
import { useAuth } from '../../src/context/auth/AuthContext';
import { useEntitlementState } from '../../src/features/subscription/EntitlementContext';
import { useOnboarding } from '../../src/context/onboarding/OnboardingContext';
import {
    consumePendingOnboardingStep,
    setPendingOnboardingStep,
    SUBSCRIPTION_STEP_RETURN,
} from '../../src/features/onboarding/authReturn';
import { TEXT_COLORS } from 'designs/designs-colors';
import { firstIncompletePlanRoute } from '../../src/features/onboarding/flowGuard';

export default function SubscriptionPreviewScreen() {
    const router = useRouter();
    const { answers, setAnswer } = useOnboardingAnswers();
    const { state, reload } = useSubscriptionOffer();
    const { showAlert } = useAppAlert();
    const { isAuthenticated } = useAuth();
    const { state: entitlement, refresh: refreshEntitlement } = useEntitlementState();
    const { hasOnboarded } = useOnboarding();
    const restoreInFlightRef = useRef(false);
    const restoreHandoffCheckedRef = useRef(false);
    const activeEntitlementHandledRef = useRef(false);
    const [restoreInProgress, setRestoreInProgress] = useState(false);

    const incompletePlanRoute = hasOnboarded ? null : firstIncompletePlanRoute(answers);

    // A lapsed subscriber is sent here by the paid area's guard, not by the
    // preview screens, so Back would walk them into onboarding with an empty
    // draft. Only a first run has somewhere to go back to.
    const backNavigation = hasOnboarded
        ? { showBack: false as const }
        : { backHref: '/(onboarding)/note-preview' as const };

    // Account controls must remain available even when no products can load
    // or this account has no subscription.
    const accountSettings = isAuthenticated ? (
        <Button label="Account settings" transparent onPress={ () => router.push('/account') } />
    ) : null;

    const goalHeadline = useMemo(() => {
        const goal = GOAL_OPTIONS.find((option) => option.id === answers.goal);
        return goal?.subscriptionHeadline ?? SUBSCRIPTION_COPY.fallbackHeadline;
    }, [answers.goal]);

    const handleRestore = useCallback(async () => {
        if (restoreInFlightRef.current) return;

        // Apple owns the purchase, but Plastic Brains still has to know which
        // signed-in account it belongs to. Never mark a signed-out local Apple
        // receipt as restored and carry it through onboarding unlinked.
        if (!isAuthenticated) {
            setPendingOnboardingStep(SUBSCRIPTION_STEP_RETURN);
            router.push({
                pathname: '/(auth)/login',
                params: { returnTo: SUBSCRIPTION_STEP_RETURN },
            });
            return;
        }

        restoreInFlightRef.current = true;
        setRestoreInProgress(true);

        try {
            const result = await restore({ syncWithServer: true });

            if (result.status === 'restored') {
                // A restored entitlement is as good as a fresh purchase: record it
                // and carry on rather than leaving the user on the paywall.
                refreshEntitlement();
                setAnswer('entitlementConfirmedThisSession', true);
                showAlert(PURCHASE_COPY.restoredTitle, PURCHASE_COPY.restored, {
                    primaryAction: {
                        label: PURCHASE_COPY.continue,
                        onPress: () =>
                            router.replace(
                                isAuthenticated
                                    ? hasOnboarded
                                        ? '/(tabs)'
                                        : '/(onboarding)/notifications-preview'
                                    : '/(onboarding)/account-preview',
                            ),
                    },
                });
                return;
            }

            if (result.status === 'no_entitlement') {
                showAlert(SUBSCRIPTION_COPY.restore, PURCHASE_COPY.restoreEmpty);
                return;
            }

            showAlert(PURCHASE_COPY.restoreErrorTitle, PURCHASE_COPY.restoreError);
        } finally {
            restoreInFlightRef.current = false;
            setRestoreInProgress(false);
        }
    }, [hasOnboarded, isAuthenticated, refreshEntitlement, router, setAnswer, showAlert]);

    // Restore is one action, even when app sign-in is needed in the middle.
    // The Welcome redirect only peeks at this handoff, so this destination can
    // consume it and continue the restore without making the user tap twice.
    useEffect(() => {
        if (
            !isAuthenticated ||
			entitlement.status === 'loading' ||
			restoreHandoffCheckedRef.current
        )
            return;
        restoreHandoffCheckedRef.current = true;
        const pending = consumePendingOnboardingStep(SUBSCRIPTION_STEP_RETURN);
        if (pending !== null && entitlement.status !== 'active') void handleRestore();
    }, [entitlement.status, handleRestore, isAuthenticated]);

    // The StoreKit/backend entitlement is durable; the onboarding latch is not.
    // Recreate the latch after a relaunch and resume past the paywall rather
    // than asking someone who already paid to start the same purchase again.
    useEffect(() => {
        if (
            !isAuthenticated ||
			entitlement.status !== 'active' ||
			incompletePlanRoute !== null ||
			activeEntitlementHandledRef.current
        )
            return;

        activeEntitlementHandledRef.current = true;
        setAnswer('entitlementConfirmedThisSession', true);
        router.replace(hasOnboarded ? '/(tabs)' : '/(onboarding)/notifications-preview');
    }, [entitlement.status, hasOnboarded, incompletePlanRoute, isAuthenticated, router, setAnswer]);

    if (incompletePlanRoute !== null) {
        return <Redirect href={ incompletePlanRoute } />;
    }

    if (
        (isAuthenticated && (entitlement.status === 'loading' || entitlement.status === 'active'))
        || state.status === 'loading'
    ) {
        return (
            <OnboardingScreen { ...backNavigation } headline="Loading subscriptions" footer={ accountSettings }>
                <Loading fullScreen={ false } />
            </OnboardingScreen>
        );
    }

    // No invented fallback prices: with nothing from the store there is nothing
    // honest to show, so the screen says so and offers a retry. Which wording
    // depends on why: a dropped connection is worth naming, an unexpected store
    // error is not something the user can act on beyond retrying.
    if (state.status === 'unavailable') {
        const failure =
            state.reason === 'network'
                ? { headline: ERROR_COPY.offlineTitle, body: ERROR_COPY.offlineBody }
                : state.reason === 'store_error'
                    ? { headline: ERROR_COPY.unexpectedTitle, body: ERROR_COPY.unexpectedBody }
                    : {
                        headline: SUBSCRIPTION_COPY.unavailableHeadline,
                        body: SUBSCRIPTION_COPY.unavailableBody,
                    };

        return (
            <OnboardingScreen
                { ...backNavigation }
                headline={ failure.headline }
                supporting={ failure.body }
                footer={ <>
                    <Button label={ ERROR_COPY.retryCta } onPress={ reload } />
                    { accountSettings }
                </> }
            />
        );
    }

    const { offer } = state;
    const selected = answers.plan;
    const selectedProduct = offer[selected];
    const showAnnualTrial = offer.trialEligible && offer.annual.trial !== null;
    const showMonthlyTrial = offer.trialEligible && offer.monthly.trial !== null;
    const showSelectedTrial = offer.trialEligible && selectedProduct.trial !== null;

    return (
        <OnboardingScreen
            { ...backNavigation }
            headline={ SUBSCRIPTION_COPY.planHeader }
            footer={
                <>
                    <Button
                        label={ showSelectedTrial
                            ? SUBSCRIPTION_COPY.trialCta
                            : planCtaLabel(selected) }
                        onPress={ () => router.push('/(onboarding)/account-preview') }
                    />

                    <AppText variant="caption" style={ styles.cancelAnytime }>
                        { SUBSCRIPTION_COPY.cancelAnytime }
                    </AppText>

                    <View style={ styles.links }>
                        <TouchableOpacity
                            onPress={ handleRestore }
                            disabled={ restoreInProgress }
                            accessibilityRole="button"
                            accessibilityState={ {
                                disabled: restoreInProgress,
                                busy: restoreInProgress,
                            } }
                            style={ styles.link }
                        >
                            <AppText variant="caption" style={ styles.linkLabel }>
                                { restoreInProgress
                                    ? SUBSCRIPTION_COPY.restoring
                                    : SUBSCRIPTION_COPY.restore }
                            </AppText>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={ () => router.push('/terms-of-service') }
                            accessibilityRole="link"
                            style={ styles.link }
                        >
                            <AppText variant="caption" style={ styles.linkLabel }>
                                { SUBSCRIPTION_COPY.terms }
                            </AppText>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={ () => router.push('/privacy-policy') }
                            accessibilityRole="link"
                            style={ styles.link }
                        >
                            <AppText variant="caption" style={ styles.linkLabel }>
                                { SUBSCRIPTION_COPY.privacy }
                            </AppText>
                        </TouchableOpacity>
                    </View>
                    { accountSettings }
                </>
            }
        >
            <AppText variant="h2" style={ styles.planTitle } accessibilityRole="header">
                { showSelectedTrial && selectedProduct.trial !== null
                    ? trialHeadline(selectedProduct.trial)
                    : goalHeadline }
            </AppText>

            <View style={ styles.plans } accessibilityRole="radiogroup">
                <SubscriptionPlanCard
                    title={ SUBSCRIPTION_COPY.annualTitle }
                    badge={ SUBSCRIPTION_COPY.annualBadge }
                    trialBadge={
                        showAnnualTrial && offer.annual.trial !== null
                            ? trialBadgeLine(offer.annual.trial)
                            : undefined
                    }
                    description={ SUBSCRIPTION_COPY.annualDescription }
                    priceLine={ cardPriceLine('annual', offer.annual.price, offer.annual.monthlyEquivalent) }
                    timeline={
                        showAnnualTrial && offer.annual.trial !== null
                            ? trialTimeline('annual', offer.annual.price, offer.annual.trial)
                            : undefined
                    }
                    renewalLine={ planRenewalLine('annual', showAnnualTrial) }
                    selected={ selected === 'annual' }
                    onPress={ () => setAnswer('plan', 'annual') }
                    accessibilityLabel={ `${SUBSCRIPTION_COPY.annualTitle}. ${
                        showAnnualTrial && offer.annual.trial !== null
                            ? `${trialBadgeLine(offer.annual.trial)}. `
                            : ''
                    }${offer.annual.price} per year. ${planRenewalLine('annual', showAnnualTrial)}` }
                />

                <SubscriptionPlanCard
                    title={ SUBSCRIPTION_COPY.monthlyTitle }
                    badge={ SUBSCRIPTION_COPY.monthlyBadge }
                    trialBadge={
                        showMonthlyTrial && offer.monthly.trial !== null
                            ? trialBadgeLine(offer.monthly.trial)
                            : undefined
                    }
                    description={ SUBSCRIPTION_COPY.monthlyDescription }
                    priceLine={ cardPriceLine('monthly', offer.monthly.price, null) }
                    renewalLine={ planRenewalLine('monthly', showMonthlyTrial) }
                    selected={ selected === 'monthly' }
                    onPress={ () => setAnswer('plan', 'monthly') }
                    accessibilityLabel={ `${SUBSCRIPTION_COPY.monthlyTitle}. ${
                        showMonthlyTrial && offer.monthly.trial !== null
                            ? `${trialBadgeLine(offer.monthly.trial)}. `
                            : ''
                    }${offer.monthly.price} per month. ${planRenewalLine('monthly', showMonthlyTrial)}` }
                />
            </View>

        </OnboardingScreen>
    );
}

const styles = StyleSheet.create({
    planTitle: {
        marginTop: 20,
        fontSize: 22,
        lineHeight: 28,
    },
    plans: {
        marginTop: 24,
        gap: 12,
    },
    cancelAnytime: {
        textAlign: 'center',
        color: TEXT_COLORS.secondary,
    },
    links: {
        flexDirection: 'row',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: 8,
    },
    link: {
        minHeight: 44,
        minWidth: 44,
        paddingHorizontal: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    linkLabel: {
        color: TEXT_COLORS.secondary,
        textDecorationLine: 'underline',
    },
});
