import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import * as clientModule from '../client';
import { requestPasswordReset, resetPassword } from '../auth';

jest.mock('../client', () => ({
    apiPost: jest.fn(),
}));

const { apiPost } = jest.mocked(clientModule);

describe('auth password helpers', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it.each([
        { message: 'Reset email sent', code: 'password_reset_requested' },
        { message: 'Legacy reset confirmation' },
    ])('preserves password reset confirmation metadata: %j', async (response) => {
        apiPost.mockResolvedValueOnce(response);

        const result = await requestPasswordReset('   person@example.com   ');

        expect(apiPost).toHaveBeenCalledWith(
            '/api/auth/forgot-password',
            { email: 'person@example.com' },
            { auth: false },
        );
        expect(result).toEqual(response);
    });

    it('resets the password with the account email, trimmed token and auth disabled', async () => {
        apiPost.mockResolvedValueOnce(undefined);

        await resetPassword('  User@Example.com  ', '  RESET123  ', 'NewPassword!23');

        expect(apiPost).toHaveBeenCalledWith(
            '/api/auth/reset-password',
            {
                email: 'User@Example.com',
                token: 'RESET123',
                password: 'NewPassword!23',
            },
            { auth: false, parseJson: false },
        );
    });
});
