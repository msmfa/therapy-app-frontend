import type { PlanId } from './types';

type SubscriptionCatalogEntry = {
    /** The product shown to new customers. */
    currentProductId: string;
    /**
     * Products that are no longer sold but must keep granting access to existing
     * subscribers. When replacing a product, move its old id into this list.
     */
    legacyProductIds: readonly string[];
};

/**
 * The only place where App Store product identifiers live.
 *
 * Prices, billing periods and introductory offers are deliberately absent:
 * StoreKit supplies those at runtime, so changing them in App Store Connect
 * does not require editing display copy in the app.
 */
export const SUBSCRIPTION_CATALOG: Record<PlanId, SubscriptionCatalogEntry> = {
    annual: {
        currentProductId: 'com.plasticbrains.app.subscription.annual',
        legacyProductIds: [],
    },
    monthly: {
        currentProductId: 'com.plasticbrains.app.subscription.monthly',
        legacyProductIds: [],
    },
};

/** The two products currently offered to new subscribers. */
export const PRODUCT_IDS: Record<PlanId, string> = {
    annual: SUBSCRIPTION_CATALOG.annual.currentProductId,
    monthly: SUBSCRIPTION_CATALOG.monthly.currentProductId,
};

/** Current and retired ids that still count as an active subscription. */
export const ENTITLEMENT_PRODUCT_IDS = Array.from(
    new Set(
        (Object.keys(SUBSCRIPTION_CATALOG) as PlanId[]).flatMap((plan) => [
            SUBSCRIPTION_CATALOG[plan].currentProductId,
            ...SUBSCRIPTION_CATALOG[plan].legacyProductIds,
        ]),
    ),
);

export function planForProductId(productId: string): PlanId | null {
    for (const plan of Object.keys(SUBSCRIPTION_CATALOG) as PlanId[]) {
        const product = SUBSCRIPTION_CATALOG[plan];
        if (product.currentProductId === productId || product.legacyProductIds.includes(productId)) {
            return plan;
        }
    }

    return null;
}
