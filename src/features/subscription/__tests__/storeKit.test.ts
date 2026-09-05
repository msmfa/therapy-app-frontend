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
    });

    it('restores only when Apple reports an active known product', async () => {
        const { restore, PRODUCT_IDS } = loadStoreKit();
        mockGetActiveSubscriptions.mockResolvedValue([
            activeSubscription(PRODUCT_IDS.monthly),
        ]);

        await expect(restore()).resolves.toEqual({ status: 'restored' });
        expect(mockRestorePurchases).toHaveBeenCalled();
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

    it('keeps verified local access during a temporary server outage', async () => {
        const { getEntitlement, PRODUCT_IDS } = loadStoreKit();
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
