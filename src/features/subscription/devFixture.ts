import type { PurchaseResult, SubscriptionOffer } from './types';
import { PRODUCT_IDS } from './productIds';

/**
 * Placeholder products for local development only.
 *
 * NOT PRICES. These figures are invented so the onboarding flow can be walked
 * and reviewed end to end before the App Store products exist. They are reached
 * only when `__DEV__` is true and EXPO_PUBLIC_DEV_SUBSCRIPTION_FIXTURE=1, so no
 * release build can display them. Delete this file when storeKit.ts is wired to
 * the real store.
 */
export const DEV_FIXTURE_OFFER: SubscriptionOffer = {
    annual: {
        id: 'annual',
        productId: PRODUCT_IDS.annual,
        price: '£39.99',
        monthlyEquivalent: '£3.33',
        trial: { periods: 1, period: 'month' },
    },
    monthly: {
        id: 'monthly',
        productId: PRODUCT_IDS.monthly,
        price: '£4.99',
        monthlyEquivalent: null,
        trial: { periods: 1, period: 'week' },
    },
    trialEligible: true,
};

/** A purchase that always succeeds, so the flow continues to Notifications. */
export const DEV_FIXTURE_PURCHASE: PurchaseResult = { status: 'purchased' };
