import { BASE_URL } from '../const';
import { readApiError } from './utils';

export async function requestPasswordReset(email: string): Promise<void> {
    const response = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
    });

    if (!response.ok) {
        throw new Error(await readApiError(response));
    }
}

export async function resetPassword(token: string, password: string): Promise<void> {
    const response = await fetch(`${BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim(), password }),
    });

    if (!response.ok) {
        throw new Error(await readApiError(response));
    }
}
