import { Platform } from 'react-native';
import {
    getAppAccountToken,
    getServerEntitlement,
    verifySubscriptionTransaction,
} from '../../api/subscriptions';
import { BASE_URL, USE_DEV_SUBSCRIPTION_FIXTURE } from '../../constants/env';
import { DEV_FIXTURE_OFFER, DEV_FIXTURE_PURCHASE } from './devFixture';
import {
    ENTITLEMENT_PRODUCT_IDS,
    PRODUCT_IDS,
    planForProductId,
} from './productIds';
import type {
    EntitlementResult,
    PlanId,
    PurchaseResult,
    SubscriptionOffer,
    SubscriptionProduct,
} from './types';
import type {
    ActiveSubscription,
    ProductSubscriptionIOS,
    Purchase,
} from 'expo-iap';

export { PRODUCT_IDS };

/**
 * The single seam between the app and the App Store.
 *
 * Nothing else in the app talks directly to expo-iap. That keeps the product
 * catalogue and a future server-verification step behind one stable boundary.
 */

/**
 * Whether to answer from the local placeholder products instead of the store.
 *
 * A normal development bundle uses `__DEV__`. A locally installed dev-client
 * can request a production-mode Metro bundle, so it may use the fixture only
 * when its API is also an explicit private-network HTTP address. A shipped app
 * points at HTTPS production and therefore cannot reach this path.
 */
const usesPrivateDevelopmentApi = (): boolean => {
    try {
        const url = new URL(BASE_URL);
        if (url.protocol !== 'http:') return false;

        const { hostname } = url;
        if (hostname === 'localhost' || hostname === '127.0.0.1') return true;
        if (hostname.startsWith('10.') || hostname.startsWith('192.168.')) return true;

        const private172 = hostname.match(/^172\.(\d{1,2})\./);
        if (private172 === null) return false;
        const secondOctet = Number(private172[1]);
        return secondOctet >= 16 && secondOctet <= 31;
    } catch {
        return false;
    }
};

const devFixtureActive = (): boolean =>
    USE_DEV_SUBSCRIPTION_FIXTURE && (__DEV__ || usesPrivateDevelopmentApi());

type IapModule = typeof import('expo-iap');

let iapModulePromise: Promise<IapModule> | null = null;
let connectionPromise: Promise<boolean> | null = null;
let purchaseInFlight: Promise<PurchaseResult> | null = null;
let listenersInstalled = false;
// StoreKit may replay an unfinished transaction before app authentication has
// hydrated. Keep the in-memory transaction too so the auth-triggered
// entitlement refresh can finish it immediately, without waiting for another
// process launch to make Apple replay it again.
const transactionsWaitingForAuth = new Map<string, Purchase>();
let purchaseWaiter: {
    productId: string;
    settle: (result: PurchaseResult) => void;
} | null = null;

const settlePurchaseWaiter = (productId: string | null, result: PurchaseResult): void => {
    if (purchaseWaiter === null) return;
    if (productId !== null && purchaseWaiter.productId !== productId) return;

    const { settle } = purchaseWaiter;
    purchaseWaiter = null;
    settle(result);
};

const installStoreListeners = (iap: IapModule): void => {
    if (listenersInstalled) return;

    // Keep these listeners for the process lifetime. Apple can approve a
    // pending purchase after its original screen has gone away; that later
    // transaction still has to be verified and finished.
    const updatedSubscription = iap.purchaseUpdatedListener((transaction) => {
        if (!ENTITLEMENT_PRODUCT_IDS.includes(transaction.productId)) return;

        void completePurchase(iap, transaction)
            .then((result) => {
                transactionsWaitingForAuth.delete(transaction.id);
                settlePurchaseWaiter(transaction.productId, result);
            })
            .catch((error: unknown) => {
                if (responseStatus(error) === 401) {
                    transactionsWaitingForAuth.set(transaction.id, transaction);
                    settlePurchaseWaiter(transaction.productId, { status: 'unlinked' });
                    return;
                }
                settlePurchaseWaiter(transaction.productId, { status: 'failed' });
            });
    });

    try {
        iap.purchaseErrorListener((error) => {
            settlePurchaseWaiter(error.productId ?? null, purchaseErrorResult(error));
        });
        listenersInstalled = true;
    } catch (error) {
        updatedSubscription.remove();
        throw error;
    }
};

const retryTransactionsWaitingForAuth = async (iap: IapModule): Promise<void> => {
    for (const [id, transaction] of transactionsWaitingForAuth) {
        try {
            await completePurchase(iap, transaction);
            transactionsWaitingForAuth.delete(id);
        } catch (error) {
            // A 401 still means auth is not usable. All other server failures
            // are handled by completePurchase itself; leave an unexpected
            // failure queued for StoreKit to replay rather than losing it.
            if (responseStatus(error) !== 401) throw error;
        }
    }
};

const getIapModule = (): Promise<IapModule> => {
    if (iapModulePromise === null) {
        // Lazy loading keeps the development fixture usable in Expo Go. The
        // real store path still requires a development build containing the
        // native expo-iap module.
        iapModulePromise = Promise.resolve()
            .then(() => require('expo-iap') as IapModule)
            .catch((error: unknown) => {
                iapModulePromise = null;
                throw error;
            });
    }

    return iapModulePromise;
};

const ensureConnection = async (iap: IapModule): Promise<void> => {
    // expo-iap can emit unfinished transactions as soon as the connection
    // opens, so its listeners must exist first.
    installStoreListeners(iap);

    if (connectionPromise === null) {
        connectionPromise = iap.initConnection().catch((error: unknown) => {
            connectionPromise = null;
            throw error;
        });
    }

    if (!await connectionPromise) {
        connectionPromise = null;
        throw new Error('The App Store connection is unavailable.');
    }
};

const errorCode = (error: unknown): string | null => {
    if (typeof error !== 'object' || error === null || !('code' in error)) return null;
    return typeof error.code === 'string' ? error.code : null;
};

const networkErrorCodes = new Set([
    'network-error',
    'remote-error',
    'service-disconnected',
    'service-timeout',
]);

const unavailableErrorCodes = new Set([
    'activity-unavailable',
    'billing-unavailable',
    'feature-not-supported',
    'iap-not-available',
    'not-prepared',
]);

const availabilityReason = (
    error: unknown,
): 'not_configured' | 'network' | 'store_error' => {
    const code = errorCode(error);
    if (code !== null && networkErrorCodes.has(code)) return 'network';
    if (code !== null && unavailableErrorCodes.has(code)) return 'not_configured';
    return 'store_error';
};

const purchaseErrorResult = (error: unknown): PurchaseResult => {
    const code = errorCode(error);
    if (code === 'user-cancelled') return { status: 'cancelled' };
    if (code === 'deferred-payment' || code === 'pending') return { status: 'pending' };
    return { status: 'failed' };
};

const responseStatus = (error: unknown): number | undefined => {
    if (!error || typeof error !== 'object' || !('status' in error)) return undefined;
    const status = (error as { status?: unknown }).status;
    return typeof status === 'number' ? status : undefined;
};

const isDefinitiveServerRejection = (error: unknown): boolean => {
    const status = responseStatus(error);
    return status !== undefined
        && status >= 400
        && status < 500
        // An unfinished transaction can be replayed by StoreKit before auth
        // hydration. Keep it queued so it can retry after sign-in.
        && status !== 401
        && status !== 408
        && status !== 429;
};

const isIosStoreAvailable = (): boolean => Platform.OS === 'ios';

const isIosSubscription = (product: unknown): product is ProductSubscriptionIOS => {
    if (typeof product !== 'object' || product === null) return false;
    const candidate = product as { platform?: unknown; type?: unknown; id?: unknown };
    return candidate.platform === 'ios' && candidate.type === 'subs' && typeof candidate.id === 'string';
};

const formatMonthlyEquivalent = (product: ProductSubscriptionIOS): string | null => {
    if (typeof product.price !== 'number' || !Number.isFinite(product.price)) return null;

    try {
        return new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: product.currency,
        }).format(product.price / 12);
    } catch {
        return null;
    }
};

const trialDuration = (product: ProductSubscriptionIOS): SubscriptionProduct['trial'] => {
    if (product.introductoryPricePaymentModeIOS !== 'free-trial') return null;

    const periods = Number(product.introductoryPriceNumberOfPeriodsIOS);
    if (!Number.isFinite(periods) || periods <= 0) return null;

    const period = product.introductoryPriceSubscriptionPeriodIOS;
    if (period === undefined || period === null || period === 'empty') return null;

    return { periods, period };
};

const toSubscriptionProduct = (
    plan: PlanId,
    product: ProductSubscriptionIOS,
): SubscriptionProduct => ({
    id: plan,
    productId: product.id,
    price: product.displayPrice,
    monthlyEquivalent: plan === 'annual' ? formatMonthlyEquivalent(product) : null,
    trial: trialDuration(product),
});

const activeEntitlement = (subscriptions: ActiveSubscription[]): EntitlementResult => {
    for (const subscription of subscriptions) {
        if (!subscription.isActive) continue;

        const plan = planForProductId(subscription.productId);
        if (plan === null) continue;

        return {
            status: 'active',
            plan,
            productId: subscription.productId,
            expiresAt:
                typeof subscription.expirationDateIOS === 'number'
                    ? new Date(subscription.expirationDateIOS)
                    : null,
        };
    }

    return { status: 'inactive' };
};

type ServerSyncResult = {
    entitlement: EntitlementResult | null;
    /** The server conclusively rejected the signed transaction/account link. */
    rejected: boolean;
    /** StoreKit supplied a signed transaction the backend could attempt to link. */
    hadSignedTransaction: boolean;
};

const syncActiveSubscriptions = async (
    subscriptions: ActiveSubscription[],
): Promise<ServerSyncResult> => {
    let rejected = false;
    let hadSignedTransaction = false;
    for (const subscription of subscriptions) {
        if (!subscription.isActive || planForProductId(subscription.productId) === null) continue;
        if (!subscription.purchaseToken) continue;
        hadSignedTransaction = true;

        try {
            const result = await verifySubscriptionTransaction(subscription.purchaseToken);
            if (result.status === 'active') {
                return { entitlement: result, rejected: false, hadSignedTransaction: true };
            }
            rejected = true;
        } catch (error) {
            // Signature, product, or account-link failures are definitive. A
            // timeout, rate limit, or server error is not: paying customers
            // keep short-term access and the next foreground retries.
            if (isDefinitiveServerRejection(error)) {
                rejected = true;
            }
            // The caller still has StoreKit's verified local state. A later app
            // foreground retries the server sync, and Apple notifications can
            // update an already-linked subscription without the app running.
        }
    }
    return { entitlement: null, rejected, hadSignedTransaction };
};

export type LoadOfferResult =
    | { status: 'ready'; offer: SubscriptionOffer }
    | { status: 'unavailable'; reason: 'not_configured' | 'network' | 'store_error' };

export async function loadOffer(): Promise<LoadOfferResult> {
    if (devFixtureActive()) {
        return { status: 'ready', offer: DEV_FIXTURE_OFFER };
    }

    if (!isIosStoreAvailable()) {
        return { status: 'unavailable', reason: 'not_configured' };
    }

    try {
        const iap = await getIapModule();
        await ensureConnection(iap);

        const products = await iap.fetchProducts({
            skus: [PRODUCT_IDS.annual, PRODUCT_IDS.monthly],
            type: 'subs',
        });
        const iosProducts = (products ?? []).filter(isIosSubscription);
        const annual = iosProducts.find((product) => product.id === PRODUCT_IDS.annual);
        const monthly = iosProducts.find((product) => product.id === PRODUCT_IDS.monthly);

        // StoreKit omits unknown or incomplete product ids. Showing a made-up
        // price in that situation would be misleading, so the paywall remains
        // unavailable until both products are configured.
        if (annual === undefined || monthly === undefined) {
            return { status: 'unavailable', reason: 'not_configured' };
        }

        const trialProduct = [annual, monthly].find(
            (product) => trialDuration(product) !== null && product.subscriptionGroupIdIOS,
        );
        let trialEligible = false;
        if (trialProduct?.subscriptionGroupIdIOS) {
            try {
                trialEligible = await iap.isEligibleForIntroOfferIOS(
                    trialProduct.subscriptionGroupIdIOS,
                );
            } catch {
                // Hiding an offer is safer than promising one when Apple cannot
                // answer the eligibility query.
                trialEligible = false;
            }
        }

        return {
            status: 'ready',
            offer: {
                annual: toSubscriptionProduct('annual', annual),
                monthly: toSubscriptionProduct('monthly', monthly),
                trialEligible,
            },
        };
    } catch (error) {
        return { status: 'unavailable', reason: availabilityReason(error) };
    }
}

async function completePurchase(
    iap: IapModule,
    transaction: Purchase,
): Promise<PurchaseResult> {
    if (transaction.purchaseState === 'pending') return { status: 'pending' };
    if (transaction.purchaseState !== 'purchased') return { status: 'failed' };

    const verified = await iap.isTransactionVerifiedIOS(transaction.productId);
    if (!verified) return { status: 'failed' };

    let serverRejected = !transaction.purchaseToken;
    if (transaction.purchaseToken) {
        try {
            const serverEntitlement = await verifySubscriptionTransaction(transaction.purchaseToken);
            serverRejected = serverEntitlement.status !== 'active';
        } catch (error) {
            if (responseStatus(error) === 401) {
                // Do not finish an Apple transaction just because app auth was
                // not ready when the process-wide listener received it. Apple
                // will replay the unfinished transaction after sign-in.
                throw error;
            }
            // StoreKit itself has verified the transaction. Do not strand a
            // paid customer or leave Apple's queue blocked because our server
            // is temporarily unreachable; the active-entitlement refresh will
            // retry and the server remains the durable source of truth.
            serverRejected = isDefinitiveServerRejection(error);
        }
    }

    await iap.finishTransaction({ purchase: transaction, isConsumable: false });
    // A missing signed transaction or permanent 4xx means the receipt cannot
    // grant this app account access. Finish Apple's queue, but never turn that
    // into the onboarding latch that opens the paid app.
    return serverRejected ? { status: 'unlinked' } : { status: 'purchased' };
}

const performPurchase = async (plan: PlanId): Promise<PurchaseResult> => {
    if (!isIosStoreAvailable()) return { status: 'failed' };

    try {
        const iap = await getIapModule();
        await ensureConnection(iap);
        const productId = PRODUCT_IDS[plan];
        let appAccountToken: string | undefined;
        try {
            appAccountToken = await getAppAccountToken();
        } catch {
            // Local Xcode StoreKit testing can run without a reachable backend.
            // A release build must bind the purchase before Apple presents its
            // sheet, otherwise the server cannot safely link the transaction.
            if (!__DEV__) return { status: 'failed' };
        }

        return await new Promise<PurchaseResult>((resolve) => {
            purchaseWaiter = { productId, settle: resolve };

            void iap.requestPurchase({
                request: {
                    apple: {
                        sku: productId,
                        ...(appAccountToken ? { appAccountToken } : {}),
                    },
                },
                type: 'subs',
            }).catch((error: unknown) => {
                settlePurchaseWaiter(productId, purchaseErrorResult(error));
            });
        });
    } catch (error) {
        return purchaseErrorResult(error);
    }
};

export async function purchase(plan: PlanId): Promise<PurchaseResult> {
    if (devFixtureActive()) {
        return DEV_FIXTURE_PURCHASE;
    }

    if (purchaseInFlight === null) {
        purchaseInFlight = performPurchase(plan).finally(() => {
            purchaseInFlight = null;
        });
    }

    return purchaseInFlight;
}

export async function restore(
    options: { syncWithServer?: boolean } = {},
): Promise<PurchaseResult> {
    if (devFixtureActive()) {
        return { status: 'restored' };
    }

    if (!isIosStoreAvailable()) return { status: 'failed' };

    try {
        const iap = await getIapModule();
        await ensureConnection(iap);
        await iap.restorePurchases();
        // A restore used by onboarding has to prove both halves: Apple says the
        // subscription is active, and the backend accepts it for this signed-in
        // app account. Reusing getEntitlement also preserves the intentional
        // fail-open behaviour during a temporary server outage.
        const entitlement = await getEntitlement({
            syncWithServer: options.syncWithServer === true,
        });
        return entitlement.status === 'active'
            ? { status: 'restored' }
            : { status: 'no_entitlement' };
    } catch {
        return { status: 'failed' };
    }
}

/** Read the current Apple-ID entitlement without presenting any store UI. */
export async function getEntitlement(
    options: { syncWithServer?: boolean } = {},
): Promise<EntitlementResult> {
    if (devFixtureActive()) {
        return {
            status: 'active',
            plan: 'annual',
            productId: PRODUCT_IDS.annual,
            expiresAt: null,
        };
    }

    if (!isIosStoreAvailable()) {
        return { status: 'unknown', reason: 'not_configured' };
    }

    try {
        const iap = await getIapModule();
        await ensureConnection(iap);
        if (options.syncWithServer) {
            await retryTransactionsWaitingForAuth(iap);
        }
        const subscriptions = await iap.getActiveSubscriptions(ENTITLEMENT_PRODUCT_IDS);
        const local = activeEntitlement(subscriptions);

        if (options.syncWithServer) {
            let localReceiptRejected = false;
            let localHadSignedTransaction = false;
            if (local.status === 'active') {
                const synced = await syncActiveSubscriptions(subscriptions);
                if (synced.entitlement) return synced.entitlement;
                localReceiptRejected = synced.rejected;
                localHadSignedTransaction = synced.hadSignedTransaction;
            }

            let serverEntitlementKnown = false;
            try {
                const stored = await getServerEntitlement();
                serverEntitlementKnown = true;
                // An account entitlement is valid across devices even if this
                // device is signed into another Apple ID.
                if (stored.status === 'active') return stored;
            } catch {
                // Local StoreKit remains a safe short-term fallback; server
                // state is retried on every foreground.
            }

            if (
                localReceiptRejected
                || (local.status === 'active' && serverEntitlementKnown && !localHadSignedTransaction)
            ) {
                // The receipt is real, but not valid for this app account, and
                // this account has no separate server entitlement of its own.
                // A local subscription without a signed transaction cannot be
                // linked at all, so a conclusive inactive server answer also
                // cannot be turned into a restore for an arbitrary account.
                return { status: 'inactive' };
            }
        }

        return local;
    } catch (error) {
        if (options.syncWithServer) {
            try {
                return await getServerEntitlement();
            } catch {
                // Report the StoreKit reason below; it is more useful to the UI.
            }
        }
        return { status: 'unknown', reason: availabilityReason(error) };
    }
}

/**
 * Start StoreKit's transaction observer early in app startup.
 *
 * Store availability is deliberately non-fatal here; the paywall presents a
 * retryable error if the user later reaches it while the store is unavailable.
 */
export async function initializeStoreKit(): Promise<void> {
    if (devFixtureActive() || !isIosStoreAvailable()) return;

    try {
        const iap = await getIapModule();
        await ensureConnection(iap);
    } catch {
        // Handled by loadOffer/getEntitlement when StoreKit is actually needed.
    }
}

/** The native bridge is installed; product availability is checked at runtime. */
export const STORE_CONFIGURED = true;
