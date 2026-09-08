import type {
    ActiveSubscription,
    ProductSubscriptionIOS,
    Purchase,
    PurchaseError,
} from 'expo-iap';
import { ApiError } from '../../../api/client';

const mockInitConnection = jest.fn<Promise<boolean>, []>();
const mockFetchProducts = jest.fn<Promise<ProductSubscriptionIOS[]>, [unknown]>();
const mockEligibility = jest.fn<Promise<boolean>, [string]>();
const mockRequestPurchase = jest.fn<Promise<Purchase | Purchase[] | null>, [unknown]>();
const mockFinishTransaction = jest.fn<Promise<void>, [unknown]>();
const mockRestorePurchases = jest.fn<Promise<void>, []>();
const mockGetActiveSubscriptions = jest.fn<Promise<ActiveSubscription[]>, [string[]?]>();
const mockVerifyTransaction = jest.fn<Promise<boolean>, [string]>();
const mockGetAppAccountToken = jest.fn<Promise<string>, []>();
const mockVerifySubscriptionTransaction = jest.fn();
const mockGetServerEntitlement = jest.fn();
const mockCapture = jest.fn();
let mockAnalyticsGeneration = 0;
let mockAnalyticsOwner = 'A';
const mockAnalyticsReady = jest.fn();

jest.mock('../../analytics/client', () => ({
    analytics: {
        getIdentity: () => mockAnalyticsOwner,
        beginOperationWhenReady: () => mockAnalyticsReady(),
    },
}));

jest.mock('../../../api/subscriptions', () => ({
    getAppAccountToken: mockGetAppAccountToken,
    verifySubscriptionTransaction: mockVerifySubscriptionTransaction,
    getServerEntitlement: mockGetServerEntitlement,
}));

let mockPurchaseUpdatedHandler: ((purchase: Purchase) => void) | null = null;
let mockPurchaseErrorHandler: ((error: PurchaseError) => void) | null = null;
const mockUpdatedRemove = jest.fn();
const mockErrorRemove = jest.fn();

jest.mock('expo-iap', () => ({
    initConnection: mockInitConnection,
    fetchProducts: mockFetchProducts,
    isEligibleForIntroOfferIOS: mockEligibility,
    requestPurchase: mockRequestPurchase,
    finishTransaction: mockFinishTransaction,
    restorePurchases: mockRestorePurchases,
    getActiveSubscriptions: mockGetActiveSubscriptions,
    isTransactionVerifiedIOS: mockVerifyTransaction,
    purchaseUpdatedListener: jest.fn((handler: (purchase: Purchase) => void) => {
        mockPurchaseUpdatedHandler = handler;
        return { remove: mockUpdatedRemove };
    }),
    purchaseErrorListener: jest.fn((handler: (error: PurchaseError) => void) => {
        mockPurchaseErrorHandler = handler;
        return { remove: mockErrorRemove };
    }),
}));

type StoreKit = typeof import('../storeKit');

const loadStoreKit = (): StoreKit => require('../storeKit') as StoreKit;

const product = (
    id: string,
    overrides: Partial<ProductSubscriptionIOS> = {},
): ProductSubscriptionIOS => ({
    currency: 'GBP',
    description: 'Full access',
    displayNameIOS: id.includes('annual') ? 'Annual' : 'Monthly',
    displayPrice: id.includes('annual') ? '£39.99' : '£4.99',
    id,
    introductoryPricePaymentModeIOS: 'empty',
    isFamilyShareableIOS: false,
    jsonRepresentationIOS: '{}',
    platform: 'ios',
    price: id.includes('annual') ? 39.99 : 4.99,
    title: id.includes('annual') ? 'Annual' : 'Monthly',
    type: 'subs',
    typeIOS: 'auto-renewable-subscription',
    ...overrides,
});

const transaction = (productId: string): Purchase => ({
    id: 'transaction-1',
    isAutoRenewing: true,
    productId,
    purchaseState: 'purchased',
    quantity: 1,
    store: 'apple',
    transactionDate: Date.now(),
    purchaseToken: 'header.payload.signature',
});

const activeSubscription = (productId: string): ActiveSubscription => ({
    isActive: true,
    productId,
    transactionDate: Date.now(),
    transactionId: 'transaction-1',
});

describe('real StoreKit bridge', () => {
    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();
        mockAnalyticsGeneration = 0;
        mockAnalyticsOwner = 'A';
        mockAnalyticsReady.mockImplementation(async () => {
            const generation = mockAnalyticsGeneration;
            return {
                enabled: true,
                isCurrent: () => generation === mockAnalyticsGeneration,
                capture: (...args: unknown[]) => {
                    if (generation === mockAnalyticsGeneration) mockCapture(...args);
                },
            };
        });
        delete process.env.EXPO_PUBLIC_DEV_SUBSCRIPTION_FIXTURE;
        mockPurchaseUpdatedHandler = null;
        mockPurchaseErrorHandler = null;

        mockInitConnection.mockResolvedValue(true);
        mockEligibility.mockResolvedValue(true);
        mockFinishTransaction.mockResolvedValue();
        mockRestorePurchases.mockResolvedValue();
        mockGetActiveSubscriptions.mockResolvedValue([]);
        mockVerifyTransaction.mockResolvedValue(true);
        mockGetAppAccountToken.mockResolvedValue('5af19095-68b5-4ca8-a214-f0844133da2f');
        mockVerifySubscriptionTransaction.mockResolvedValue({
            status: 'active',
            plan: 'annual',
            productId: 'com.plasticbrains.app.subscription.annual',
            expiresAt: new Date(Date.UTC(2027, 0, 1)),
        });
        mockGetServerEntitlement.mockResolvedValue({ status: 'inactive' });

        mockFetchProducts.mockResolvedValue([
            product('com.plasticbrains.app.subscription.annual', {
                introductoryPricePaymentModeIOS: 'free-trial',
                introductoryPriceNumberOfPeriodsIOS: '2',
                introductoryPriceSubscriptionPeriodIOS: 'week',
                subscriptionGroupIdIOS: 'therapy-subscriptions',
            }),
            product('com.plasticbrains.app.subscription.monthly', {
                introductoryPricePaymentModeIOS: 'free-trial',
                introductoryPriceNumberOfPeriodsIOS: '1',
                introductoryPriceSubscriptionPeriodIOS: 'week',
                subscriptionGroupIdIOS: 'therapy-subscriptions',
            }),
        ]);
    });

    it('loads Apple-localised prices and each plan\'s trial duration', async () => {
        const { loadOffer, PRODUCT_IDS } = loadStoreKit();
        const result = await loadOffer();

        expect(mockFetchProducts).toHaveBeenCalledWith({
            skus: [PRODUCT_IDS.annual, PRODUCT_IDS.monthly],
            type: 'subs',
        });
        expect(mockEligibility).toHaveBeenCalledWith('therapy-subscriptions');
        expect(result).toMatchObject({
            status: 'ready',
            offer: {
                annual: {
                    price: '£39.99',
                    trial: { periods: 2, period: 'week' },
                },
                monthly: {
                    price: '£4.99',
                    trial: { periods: 1, period: 'week' },
                },
                trialEligible: true,
            },
        });
    });

    it('does not show a partial or invented offer when a product is missing', async () => {
        mockFetchProducts.mockResolvedValue([
            product('com.plasticbrains.app.subscription.annual'),
        ]);
        const { loadOffer } = loadStoreKit();

        await expect(loadOffer()).resolves.toEqual({
            status: 'unavailable',
            reason: 'not_configured',
        });
    });

    it('finishes a verified purchase and reports success', async () => {
        mockInitConnection.mockImplementation(async () => {
            expect(mockPurchaseUpdatedHandler).not.toBeNull();
            return true;
        });
        const { purchase, PRODUCT_IDS } = loadStoreKit();
        const annualTransaction = transaction(PRODUCT_IDS.annual);
        mockRequestPurchase.mockImplementation(async () => {
            mockPurchaseUpdatedHandler?.(annualTransaction);
            return null;
        });

        await expect(purchase('annual')).resolves.toEqual({ status: 'purchased' });
        expect(mockRequestPurchase).toHaveBeenCalledWith({
            request: {
                apple: {
                    sku: PRODUCT_IDS.annual,
                    appAccountToken: '5af19095-68b5-4ca8-a214-f0844133da2f',
                },
            },
            type: 'subs',
        });
        expect(mockVerifyTransaction).toHaveBeenCalledWith(PRODUCT_IDS.annual);
        expect(mockVerifySubscriptionTransaction).toHaveBeenCalledWith(
            'header.payload.signature',
        );
        expect(mockFinishTransaction).toHaveBeenCalledWith({
            purchase: annualTransaction,
            isConsumable: false,
        });
        expect(mockUpdatedRemove).not.toHaveBeenCalled();
        expect(mockErrorRemove).not.toHaveBeenCalled();
        expect(mockCapture.mock.calls).toEqual([
            ['checkout_started', { operation: 'purchase', plan: 'annual', entry_point: 'onboarding' }],
            ['checkout_result', { operation: 'purchase', plan: 'annual', entry_point: 'onboarding', outcome: 'purchased' }],
        ]);
    });

    it('captures one canonical checkout for concurrent callers and drops a late result after account change', async () => {
        const { purchase } = loadStoreKit();
        let rejectRequest!: (error: unknown) => void;
        let requestStarted!: () => void;
        const started = new Promise<void>((resolve) => { requestStarted = resolve; });
        mockRequestPurchase.mockImplementation(() => new Promise((_, reject) => {
            rejectRequest = reject;
            requestStarted();
        }));

        const first = purchase('monthly', { entryPoint: 'account' });
        const duplicate = purchase('monthly', { entryPoint: 'account' });
        await started;
        expect(mockCapture.mock.calls).toEqual([
            ['checkout_started', { operation: 'purchase', plan: 'monthly', entry_point: 'account' }],
        ]);
        mockAnalyticsGeneration += 1;
        rejectRequest({ code: 'network-error', message: 'private server payload' });
        await expect(Promise.all([first, duplicate])).resolves.toEqual([{ status: 'failed' }, { status: 'failed' }]);
        expect(mockCapture).toHaveBeenCalledTimes(1);
    });

    it('waits for bounded analytics preparation before opening an immediate post-auth checkout', async () => {
        let ready!: () => void;
        const wait = new Promise<void>((resolve) => { ready = resolve; });
        const prepare = mockAnalyticsReady.getMockImplementation()!;
        mockAnalyticsReady.mockImplementation(async () => { await wait; return prepare(); });
        const { purchase, PRODUCT_IDS } = loadStoreKit();
        mockRequestPurchase.mockImplementation(async () => { mockPurchaseUpdatedHandler?.(transaction(PRODUCT_IDS.annual)); return null; });
        const result = purchase('annual');
        await Promise.resolve();
        expect(mockRequestPurchase).not.toHaveBeenCalled();
        expect(mockGetAppAccountToken).not.toHaveBeenCalled();
        expect(mockCapture).not.toHaveBeenCalled();
        ready();
        await expect(result).resolves.toEqual({ status: 'purchased' });
        expect(mockCapture.mock.calls.map(([event]) => event)).toEqual(['checkout_started', 'checkout_result']);
    });

    it('does not open A checkout for B when the account changes during analytics preparation', async () => {
        let ready!: () => void;
        const wait = new Promise<void>((resolve) => { ready = resolve; });
        const prepare = mockAnalyticsReady.getMockImplementation()!;
        mockAnalyticsReady.mockImplementation(async () => { await wait; return prepare(); });
        const { purchase } = loadStoreKit();
        const result = purchase('annual');
        mockAnalyticsOwner = 'B';
        mockAnalyticsGeneration += 1;
        ready();
        await expect(result).resolves.toEqual({ status: 'cancelled' });
        expect(mockRequestPurchase).not.toHaveBeenCalled();
        expect(mockGetAppAccountToken).not.toHaveBeenCalled();
        expect(mockCapture).not.toHaveBeenCalled();
    });

    it('a rejected analytics initialization never prevents a verified purchase', async () => {
        mockAnalyticsReady.mockRejectedValue(new Error('Analytics unavailable'));
        const { purchase, PRODUCT_IDS } = loadStoreKit();
        mockRequestPurchase.mockImplementation(async () => { mockPurchaseUpdatedHandler?.(transaction(PRODUCT_IDS.annual)); return null; });
        await expect(purchase('annual')).resolves.toEqual({ status: 'purchased' });
        expect(mockCapture).not.toHaveBeenCalled();
    });

    it.each(['purchased', 'cancelled', 'pending'] as const)('preserves %s after analytics times out or is disabled', async (status) => {
        mockAnalyticsReady.mockResolvedValue({ enabled: false, isCurrent: () => false, capture: () => false });
        const { purchase, PRODUCT_IDS } = loadStoreKit();
        mockRequestPurchase.mockImplementation(async () => {
            if (status === 'purchased') mockPurchaseUpdatedHandler?.(transaction(PRODUCT_IDS.annual));
            else mockPurchaseErrorHandler?.({ code: status === 'cancelled' ? 'user-cancelled' : 'deferred-payment', productId: PRODUCT_IDS.annual } as PurchaseError);
            return null;
        });
        await expect(purchase('annual')).resolves.toEqual({ status });
        expect(mockRequestPurchase).toHaveBeenCalledTimes(1);
        expect(mockCapture).not.toHaveBeenCalled();
    });

    it('does not grant access when the server rejects the app-account link', async () => {
        mockVerifySubscriptionTransaction.mockRejectedValue(
            new ApiError(403, { message: 'Different account' }),
        );
        const { purchase, PRODUCT_IDS } = loadStoreKit();
        const annualTransaction = transaction(PRODUCT_IDS.annual);
        mockRequestPurchase.mockImplementation(async () => {
            mockPurchaseUpdatedHandler?.(annualTransaction);
            return null;
        });

        await expect(purchase('annual')).resolves.toEqual({ status: 'unlinked' });
        expect(mockFinishTransaction).toHaveBeenCalledWith({
            purchase: annualTransaction,
            isConsumable: false,
        });
    });

    it('keeps a locally verified purchase usable during a server outage', async () => {
        mockVerifySubscriptionTransaction.mockRejectedValue(
            new ApiError(503, { message: 'Unavailable' }),
        );
        const { purchase, PRODUCT_IDS } = loadStoreKit();
        const monthlyTransaction = transaction(PRODUCT_IDS.monthly);
        mockRequestPurchase.mockImplementation(async () => {
            mockPurchaseUpdatedHandler?.(monthlyTransaction);
            return null;
        });

        await expect(purchase('monthly')).resolves.toEqual({ status: 'purchased' });
        expect(mockFinishTransaction).toHaveBeenCalled();
    });

    it('does not unlock onboarding when Apple omits the signed transaction', async () => {
        const { purchase, PRODUCT_IDS } = loadStoreKit();
        const unsignedTransaction = {
            ...transaction(PRODUCT_IDS.annual),
            purchaseToken: null,
        };
        mockRequestPurchase.mockImplementation(async () => {
            mockPurchaseUpdatedHandler?.(unsignedTransaction);
            return null;
        });

        await expect(purchase('annual')).resolves.toEqual({ status: 'unlinked' });
        expect(mockVerifySubscriptionTransaction).not.toHaveBeenCalled();
        expect(mockFinishTransaction).toHaveBeenCalled();
    });

    it('leaves a transaction unfinished when it arrives before app authentication', async () => {
        mockVerifySubscriptionTransaction.mockRejectedValue(
            new ApiError(401, { message: 'Unauthorized' }),
        );
        const { purchase, PRODUCT_IDS } = loadStoreKit();
        const annualTransaction = transaction(PRODUCT_IDS.annual);
        mockRequestPurchase.mockImplementation(async () => {
            mockPurchaseUpdatedHandler?.(annualTransaction);
            return null;
        });

        await expect(purchase('annual')).resolves.toEqual({ status: 'unlinked' });
        expect(mockFinishTransaction).not.toHaveBeenCalled();
    });

    it('retries and finishes a pre-auth transaction after authentication', async () => {
        mockVerifySubscriptionTransaction.mockRejectedValueOnce(
            new ApiError(401, { message: 'Unauthorized' }),
        );
        const { purchase, getEntitlement, PRODUCT_IDS } = loadStoreKit();
        const annualTransaction = transaction(PRODUCT_IDS.annual);
        mockRequestPurchase.mockImplementation(async () => {
            mockPurchaseUpdatedHandler?.(annualTransaction);
            return null;
        });

        await expect(purchase('annual')).resolves.toEqual({ status: 'unlinked' });
        expect(mockFinishTransaction).not.toHaveBeenCalled();

        mockVerifySubscriptionTransaction.mockResolvedValue({
            status: 'active',
            plan: 'annual',
            productId: PRODUCT_IDS.annual,
            expiresAt: new Date(Date.UTC(2027, 0, 1)),
        });
        mockGetActiveSubscriptions.mockResolvedValue([
            {
                ...activeSubscription(PRODUCT_IDS.annual),
                purchaseToken: annualTransaction.purchaseToken,
            },
        ]);

        await expect(getEntitlement({ syncWithServer: true })).resolves.toMatchObject({
            status: 'active',
        });
        expect(mockFinishTransaction).toHaveBeenCalledWith({
            purchase: annualTransaction,
            isConsumable: false,
        });
    });

    it('reports a failed native purchase without capturing its raw error', async () => {
        const Sentry = require('@sentry/react-native') as { captureException: jest.Mock };
        Sentry.captureException.mockClear();
        const { purchase, PRODUCT_IDS } = loadStoreKit();
        mockRequestPurchase.mockImplementation(async () => {
            mockPurchaseErrorHandler?.({
                code: 'unknown' as PurchaseError['code'],
                message: 'private-native-receipt',
                productId: PRODUCT_IDS.monthly,
            });
            return null;
        });

        await expect(purchase('monthly')).resolves.toEqual({ status: 'failed' });
        expect(Sentry.captureException).toHaveBeenCalledTimes(1);
        expect(Sentry.captureException.mock.calls[0][0]).toMatchObject({ message: 'store purchase failed' });
    });

    it('settles a failed purchase even when diagnostic capture throws', async () => {
        const Sentry = require('@sentry/react-native') as { captureException: jest.Mock };
        Sentry.captureException.mockImplementationOnce(() => { throw new Error('SDK failure'); });
        const { purchase, PRODUCT_IDS } = loadStoreKit();
        mockRequestPurchase.mockImplementation(async () => {
            mockPurchaseErrorHandler?.({
                code: 'unknown' as PurchaseError['code'],
                message: 'Native failure',
                productId: PRODUCT_IDS.monthly,
            });
            return null;
        });

        await expect(purchase('monthly')).resolves.toEqual({ status: 'failed' });
        expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    });

    it('reports an Apple cancellation without treating it as a failure', async () => {
        const { purchase, PRODUCT_IDS } = loadStoreKit();
        mockRequestPurchase.mockImplementation(async () => {
            mockPurchaseErrorHandler?.({
                code: 'user-cancelled' as PurchaseError['code'],
                message: 'Cancelled',
                productId: PRODUCT_IDS.monthly,
            });
            return null;
        });

        await expect(purchase('monthly')).resolves.toEqual({ status: 'cancelled' });
        // Backing out is the user's choice, not an incident.
        const Sentry = require('@sentry/react-native') as { captureException: jest.Mock };
        expect(Sentry.captureException).not.toHaveBeenCalled();
        expect(mockCapture).toHaveBeenLastCalledWith('checkout_result', {
            operation: 'purchase', plan: 'monthly', entry_point: 'onboarding', outcome: 'cancelled',
        });
        expect(mockCapture.mock.calls.some(([event]) => event === 'critical_action_failed')).toBe(false);
    });

    it('finishes a purchase approved after the original request became pending', async () => {
        const { purchase, PRODUCT_IDS } = loadStoreKit();
        const pendingTransaction = {
            ...transaction(PRODUCT_IDS.annual),
            purchaseState: 'pending' as const,
        };
        mockRequestPurchase.mockImplementation(async () => {
            mockPurchaseUpdatedHandler?.(pendingTransaction);
            return null;
        });

        await expect(purchase('annual')).resolves.toEqual({ status: 'pending' });

        const approvedTransaction = transaction(PRODUCT_IDS.annual);
        mockPurchaseUpdatedHandler?.(approvedTransaction);
        await Promise.resolve();
        await Promise.resolve();

        expect(mockFinishTransaction).toHaveBeenCalledWith({
            purchase: approvedTransaction,
            isConsumable: false,
        });
        expect(mockCapture.mock.calls.filter(([event]) => event === 'checkout_result')).toEqual([
            ['checkout_result', { operation: 'purchase', plan: 'annual', entry_point: 'onboarding', outcome: 'pending' }],
        ]);
    });

    it('restores only when Apple reports an active known product', async () => {
        const { restore, PRODUCT_IDS } = loadStoreKit();
        mockGetActiveSubscriptions.mockResolvedValue([
            activeSubscription(PRODUCT_IDS.monthly),
        ]);

        await expect(restore()).resolves.toEqual({ status: 'restored' });
        expect(mockRestorePurchases).toHaveBeenCalled();
        expect(mockCapture).toHaveBeenLastCalledWith('checkout_result', {
            operation: 'restore', plan: 'unknown', entry_point: 'onboarding', outcome: 'restored',
        });
    });

    it('does not restore a receipt the server links to another app account', async () => {
        const { restore, PRODUCT_IDS } = loadStoreKit();
        mockGetActiveSubscriptions.mockResolvedValue([
            {
                ...activeSubscription(PRODUCT_IDS.monthly),
                purchaseToken: 'other.account.receipt',
            },
        ]);
        mockVerifySubscriptionTransaction.mockRejectedValue(
            new ApiError(403, { message: 'Different account' }),
        );
        mockGetServerEntitlement.mockResolvedValue({ status: 'inactive' });

        await expect(restore({ syncWithServer: true })).resolves.toEqual({
            status: 'no_entitlement',
        });
    });

    it('does not restore an un-linkable local subscription to a new app account', async () => {
        const { restore, PRODUCT_IDS } = loadStoreKit();
        mockGetActiveSubscriptions.mockResolvedValue([
            activeSubscription(PRODUCT_IDS.monthly),
        ]);
        mockGetServerEntitlement.mockResolvedValue({ status: 'inactive' });

        await expect(restore({ syncWithServer: true })).resolves.toEqual({
            status: 'no_entitlement',
        });
        expect(mockVerifySubscriptionTransaction).not.toHaveBeenCalled();
    });

    it('reports the current active entitlement and plan', async () => {
        const { getEntitlement, PRODUCT_IDS } = loadStoreKit();
        mockGetActiveSubscriptions.mockResolvedValue([
            {
                ...activeSubscription(PRODUCT_IDS.annual),
                expirationDateIOS: Date.UTC(2027, 0, 1),
            },
        ]);

        await expect(getEntitlement()).resolves.toEqual({
            status: 'active',
            plan: 'annual',
            productId: PRODUCT_IDS.annual,
            expiresAt: new Date(Date.UTC(2027, 0, 1)),
        });
    });

    it('reports inactive when none of the configured products is active', async () => {
        const { getEntitlement } = loadStoreKit();

        await expect(getEntitlement()).resolves.toEqual({ status: 'inactive' });
    });

    it('rejects a local receipt that the server links to another app account', async () => {
        const { getEntitlement, PRODUCT_IDS } = loadStoreKit();
        mockGetActiveSubscriptions.mockResolvedValue([
            {
                ...activeSubscription(PRODUCT_IDS.annual),
                purchaseToken: 'other.account.receipt',
            },
        ]);
        mockVerifySubscriptionTransaction.mockRejectedValue(
            new ApiError(403, { message: 'Different account' }),
        );
        mockGetServerEntitlement.mockResolvedValue({ status: 'inactive' });

        await expect(getEntitlement({ syncWithServer: true })).resolves.toEqual({
            status: 'inactive',
        });
    });

    it.each([0, 408, 429, 503])(
        'does not grant or restore an inactive account after verification fails with status %i',
        async (status) => {
            const { getEntitlement, restore, PRODUCT_IDS } = loadStoreKit();
            mockGetActiveSubscriptions.mockResolvedValue([
                {
                    ...activeSubscription(PRODUCT_IDS.monthly),
                    purchaseToken: 'other.account.receipt',
                },
            ]);
            mockVerifySubscriptionTransaction.mockRejectedValue(
                new ApiError(status, { message: 'Verification temporarily unavailable' }),
            );
            mockGetServerEntitlement.mockResolvedValue({ status: 'inactive' });

            await expect(getEntitlement({ syncWithServer: true })).resolves.toEqual({
                status: 'inactive',
            });
            await expect(restore({ syncWithServer: true })).resolves.toEqual({
                status: 'no_entitlement',
            });
        },
    );

    it('keeps verified local access and restore during a temporary server outage', async () => {
        const { getEntitlement, restore, PRODUCT_IDS } = loadStoreKit();
        mockGetActiveSubscriptions.mockResolvedValue([
            {
                ...activeSubscription(PRODUCT_IDS.monthly),
                purchaseToken: 'valid.local.receipt',
            },
        ]);
        mockVerifySubscriptionTransaction.mockRejectedValue(
            new ApiError(0, { message: 'Offline', code: 'network' }),
        );
        mockGetServerEntitlement.mockRejectedValue(
            new ApiError(0, { message: 'Offline', code: 'network' }),
        );

        await expect(getEntitlement({ syncWithServer: true })).resolves.toMatchObject({
            status: 'active',
            plan: 'monthly',
        });
        await expect(restore({ syncWithServer: true })).resolves.toEqual({
            status: 'restored',
        });
    });

    it('returns unknown when local receipts are empty and the account server is unavailable', async () => {
        const { getEntitlement } = loadStoreKit();
        mockGetServerEntitlement.mockRejectedValue(
            new ApiError(0, { message: 'Offline', code: 'network' }),
        );
        await expect(getEntitlement({ syncWithServer: true })).resolves.toEqual({
            status: 'unknown', reason: 'network',
        });
    });

    it('returns inactive when the server conclusively reports no account subscription', async () => {
        const { getEntitlement } = loadStoreKit();
        await expect(getEntitlement({ syncWithServer: true })).resolves.toEqual({ status: 'inactive' });
    });

    it('uses the app-account entitlement on a device with no local purchase', async () => {
        const { getEntitlement, PRODUCT_IDS } = loadStoreKit();
        mockGetActiveSubscriptions.mockResolvedValue([]);
        mockGetServerEntitlement.mockResolvedValue({
            status: 'active',
            plan: 'annual',
            productId: PRODUCT_IDS.annual,
            expiresAt: new Date(Date.UTC(2027, 0, 1)),
        });

        await expect(getEntitlement({ syncWithServer: true })).resolves.toMatchObject({
            status: 'active',
            plan: 'annual',
        });
    });
});

describe('development fixture', () => {
    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();
        process.env.EXPO_PUBLIC_DEV_SUBSCRIPTION_FIXTURE = '1';
    });

    afterAll(() => {
        delete process.env.EXPO_PUBLIC_DEV_SUBSCRIPTION_FIXTURE;
    });

    it('serves both plans without loading the native bridge', async () => {
        const { loadOffer } = loadStoreKit();
        const result = await loadOffer();

        expect(result.status).toBe('ready');
        expect(mockInitConnection).not.toHaveBeenCalled();
    });
});
