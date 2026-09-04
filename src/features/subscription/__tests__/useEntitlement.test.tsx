import { act, renderHook, waitFor } from '@testing-library/react-native';
import { AppState, type AppStateStatus } from 'react-native';
import { getEntitlement } from '../storeKit';
import { useEntitlement } from '../useEntitlement';
import type { EntitlementState } from '../types';

jest.mock('../storeKit', () => ({
    getEntitlement: jest.fn(),
}));

let mockUserId = 'user-one';

jest.mock('../../../context/auth/AuthContext', () => ({
    useAuth: () => ({ isAuthenticated: true, user: { id: mockUserId } }),
}));

const mockGetEntitlement = jest.mocked(getEntitlement);

describe('useEntitlement', () => {
    let appStateHandler: ((state: AppStateStatus) => void) | null;
    let removeListener: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        mockUserId = 'user-one';
        appStateHandler = null;
        removeListener = jest.fn();
        jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, handler) => {
            appStateHandler = handler;
            return { remove: removeListener };
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('loads the current StoreKit entitlement', async () => {
        mockGetEntitlement.mockResolvedValue({
            status: 'active',
            plan: 'annual',
            productId: 'com.plasticbrains.app.subscription.annual',
            expiresAt: null,
        });

        const { result } = renderHook(() => useEntitlement());

        expect(result.current.state).toEqual({ status: 'loading' });
        await waitFor(() => expect(result.current.state.status).toBe('active'));
        expect(mockGetEntitlement).toHaveBeenCalledWith({ syncWithServer: true });
    });

    it('reloads after an explicit refresh', async () => {
        mockGetEntitlement
            .mockResolvedValueOnce({ status: 'inactive' })
            .mockResolvedValueOnce({
                status: 'active',
                plan: 'monthly',
                productId: 'com.plasticbrains.app.subscription.monthly',
                expiresAt: null,
            });

        const { result } = renderHook(() => useEntitlement());
        await waitFor(() => expect(result.current.state.status).toBe('inactive'));

        act(() => result.current.refresh());

        await waitFor(() => expect(result.current.state.status).toBe('active'));
        expect(mockGetEntitlement).toHaveBeenCalledTimes(2);
    });

    it('rechecks when the app returns to the foreground', async () => {
        mockGetEntitlement
            .mockResolvedValueOnce({ status: 'inactive' })
            .mockResolvedValueOnce({
                status: 'active',
                plan: 'annual',
                productId: 'com.plasticbrains.app.subscription.annual',
                expiresAt: null,
            });

        const { result, unmount } = renderHook(() => useEntitlement());
        await waitFor(() => expect(result.current.state.status).toBe('inactive'));

        act(() => appStateHandler?.('active'));

        await waitFor(() => expect(result.current.state.status).toBe('active'));
        expect(mockGetEntitlement).toHaveBeenCalledTimes(2);

        unmount();
        expect(removeListener).toHaveBeenCalled();
    });

    it('reports a store error instead of leaving the guard loading forever', async () => {
        mockGetEntitlement.mockRejectedValue(new Error('StoreKit failed'));

        const { result } = renderHook(() => useEntitlement());

        await waitFor(() => {
            expect(result.current.state).toEqual({
                status: 'unknown',
                reason: 'store_error',
            });
        });
    });

    it('does not reuse one account entitlement after the account changes', async () => {
        let resolveSecond!: (value: { status: 'inactive' }) => void;
        const secondResult = new Promise<{ status: 'inactive' }>((resolve) => {
            resolveSecond = resolve;
        });
        mockGetEntitlement
            .mockResolvedValueOnce({
                status: 'active',
                plan: 'annual',
                productId: 'com.plasticbrains.app.subscription.annual',
                expiresAt: null,
            })
            .mockReturnValueOnce(secondResult);

        const { result, rerender } = renderHook(() => useEntitlement());
        await waitFor(() => expect(result.current.state.status).toBe('active'));

        mockUserId = 'user-two';
        rerender({});

        expect(result.current.state).toEqual({ status: 'loading' });
        expect(mockGetEntitlement).toHaveBeenCalledTimes(2);

        resolveSecond({ status: 'inactive' });
        await waitFor(() => expect(result.current.state.status).toBe('inactive'));
    });

    it('masks the previous entitlement during the account-change render itself', async () => {
        let resolveSecond!: (value: { status: 'inactive' }) => void;
        mockGetEntitlement
            .mockResolvedValueOnce({
                status: 'active',
                plan: 'annual',
                productId: 'com.plasticbrains.app.subscription.annual',
                expiresAt: null,
            })
            .mockImplementationOnce(() => new Promise((resolve) => {
                resolveSecond = resolve;
            }));

        const observedDuringRender: EntitlementState[] = [];
        const { result, rerender } = renderHook(() => {
            const entitlement = useEntitlement();
            observedDuringRender.push(entitlement.state);
            return entitlement;
        });
        await waitFor(() => expect(result.current.state.status).toBe('active'));

        mockUserId = 'user-two';
        rerender({});

        expect(observedDuringRender.at(-1)).toEqual({ status: 'loading' });
        resolveSecond({ status: 'inactive' });
        await waitFor(() => expect(result.current.state.status).toBe('inactive'));
    });
});
