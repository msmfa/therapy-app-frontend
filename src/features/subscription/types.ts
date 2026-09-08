export type PlanId = 'annual' | 'monthly';

export type TrialPeriod = 'day' | 'week' | 'month' | 'year';

export type SubscriptionTrial = {
    /** Number of StoreKit introductory-offer periods. */
    periods: number;
    period: TrialPeriod;
};

/**
 * A plan as the store describes it.
 *
 * Every price is a string the store has already localised. The app never builds
 * a price from a number and a currency symbol of its own, and never carries a
 * default: a screen with no product data shows the unavailable state instead of
 * a figure we invented.
 */
export type SubscriptionProduct = {
    id: PlanId;
    /** Store product identifier, e.g. com.plastic-brains.app.annual. */
    productId: string;
    /** Localised recurring price, e.g. "£39.99". */
    price: string;
    /**
     * For the annual plan, the same total expressed per month, when the store
     * gives us enough to derive it. Null when it does not.
     */
    monthlyEquivalent: string | null;
    /** Free introductory offer reported by StoreKit, or null when there is none. */
    trial: SubscriptionTrial | null;
};

export type SubscriptionOffer = {
    annual: SubscriptionProduct;
    monthly: SubscriptionProduct;
    /**
     * Whether Apple reports this Apple ID as eligible for the introductory
     * offer. Trial messaging is hidden entirely when this is false, so a
     * previous subscriber is never shown a trial they cannot have.
     */
    trialEligible: boolean;
};

export type SubscriptionOfferState =
    | { status: 'loading' }
    | { status: 'ready'; offer: SubscriptionOffer }
    | { status: 'unavailable'; reason: 'not_configured' | 'network' | 'store_error' };

export type PurchaseResult =
    | { status: 'purchased' }
    | { status: 'restored' }
    | { status: 'cancelled' }
    | { status: 'pending' }
    /** Apple completed it, but the server rejected its app-account link. */
    | { status: 'unlinked' }
    | { status: 'no_entitlement' }
    | { status: 'failed' };

export type EntitlementResult =
    | {
        status: 'active';
        plan: PlanId;
        productId: string;
        expiresAt: Date | null;
    }
    | { status: 'inactive' }
    | {
        status: 'unknown';
        reason: 'not_configured' | 'network' | 'store_error';
    };

export type EntitlementState = { status: 'loading' } | EntitlementResult;
