import * as AppleAuthentication from 'expo-apple-authentication';
import { deleteCurrentUser } from '../users';
import { ApiError, apiDelete } from '../client';

jest.mock('expo-apple-authentication', () => ({ signInAsync: jest.fn() }));
jest.mock('../client', () => ({ ...jest.requireActual('../client'), apiDelete: jest.fn() }));
beforeEach(() => { jest.resetAllMocks(); });

it('reauthorizes with Apple when requested and sends the fresh code to deletion', async () => {
    jest.mocked(apiDelete).mockRejectedValueOnce(new ApiError(409, { message: 'Confirm with Apple', code: 'apple_reauthentication_required' })).mockResolvedValueOnce(undefined);
    jest.mocked(AppleAuthentication.signInAsync).mockResolvedValue({ authorizationCode: 'fresh-authorization-code' } as never);
    await deleteCurrentUser();
    expect(AppleAuthentication.signInAsync).toHaveBeenCalledWith({ requestedScopes: [] });
    expect(apiDelete).toHaveBeenLastCalledWith('/api/users/me', {
        body: { appleAuthorizationCode: 'fresh-authorization-code' }, parseJson: false, timeoutMs: 30000,
    });
});
it('stops deletion if the Apple confirmation is cancelled', async () => {
    jest.mocked(apiDelete).mockRejectedValueOnce(new ApiError(409, { message: 'Confirm with Apple', code: 'apple_reauthentication_required' }));
    const cancelled = Object.assign(new Error('Cancelled'), { code: 'ERR_REQUEST_CANCELED' });
    jest.mocked(AppleAuthentication.signInAsync).mockRejectedValue(cancelled);
    await expect(deleteCurrentUser()).rejects.toBe(cancelled);
    expect(apiDelete).toHaveBeenCalledTimes(1);
});
