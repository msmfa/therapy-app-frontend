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

    it('requests a password reset with trimmed email and returns message', async () => {
        apiPost.mockResolvedValueOnce({ message: 'Reset email sent' });

        const message = await requestPasswordReset('   person@example.com   ');

        expect(apiPost).toHaveBeenCalledWith(
            '/api/auth/forgot-password',
            { email: 'person@example.com' },
            { auth: false },
        );
        expect(message).toBe('Reset email sent');
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
