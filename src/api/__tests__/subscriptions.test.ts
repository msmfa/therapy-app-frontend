import { apiGet, apiPost } from '../client';
import {
    getAppAccountToken,
    getServerEntitlement,
    verifySubscriptionTransaction,
} from '../subscriptions';

jest.mock('../client', () => ({
    apiGet: jest.fn(),
    apiPost: jest.fn(),
}));

const mockGet = jest.mocked(apiGet);
const mockPost = jest.mocked(apiPost);

describe('subscriptions API', () => {
    beforeEach(() => jest.clearAllMocks());

    it('gets the stable StoreKit account token', async () => {
        mockGet.mockResolvedValue({ appAccountToken: 'account-token' });

        await expect(getAppAccountToken()).resolves.toBe('account-token');
        expect(mockGet).toHaveBeenCalledWith('/api/subscriptions/app-account-token');
    });

    it('posts Apple signed transaction data and parses the expiry', async () => {
        mockPost.mockResolvedValue({
            entitlement: {
                status: 'active',
                plan: 'monthly',
                productId: 'com.plasticbrains.app.subscription.monthly',
                expiresAt: '2027-01-01T00:00:00.000Z',
            },
        });

        await expect(
            verifySubscriptionTransaction('header.payload.signature'),
        ).resolves.toEqual({
            status: 'active',
            plan: 'monthly',
            productId: 'com.plasticbrains.app.subscription.monthly',
            expiresAt: new Date('2027-01-01T00:00:00.000Z'),
        });
        expect(mockPost).toHaveBeenCalledWith('/api/subscriptions/verify', {
            signedTransaction: 'header.payload.signature',
        });
    });

    it('reads an inactive server entitlement', async () => {
        mockGet.mockResolvedValue({ entitlement: { status: 'inactive' } });

        await expect(getServerEntitlement()).resolves.toEqual({ status: 'inactive' });
    });
});
