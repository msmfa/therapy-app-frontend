import { describe, expect, it, jest } from '@jest/globals';
import { readApiError } from '../utils';

describe('readApiError', () => {
    const createResponse = (options: { statusText?: string; body?: string; shouldThrow?: boolean }) => {
        const { statusText = 'Request failed', body = '', shouldThrow = false } = options;
        const textMock = shouldThrow
            ? jest.fn<() => Promise<string>>().mockRejectedValue(new Error('network error'))
            : jest.fn<() => Promise<string>>().mockResolvedValue(body);

        return {
            statusText,
            text: textMock,
        } as unknown as Response;
    };

    it('falls back to statusText when reading body fails', async () => {
        const response = createResponse({ statusText: 'Bad Request', shouldThrow: true });
        await expect(readApiError(response)).resolves.toBe('Bad Request');
    });

    it('returns parsed message field when present', async () => {
        const response = createResponse({
            body: JSON.stringify({ message: 'Email already exists' }),
        });

        await expect(readApiError(response)).resolves.toBe('Email already exists');
    });

    it('prefers raw response text when JSON parsing fails', async () => {
        const response = createResponse({ body: '<html>Service Unavailable</html>' });

        await expect(readApiError(response)).resolves.toBe('<html>Service Unavailable</html>');
    });

    it('returns stringified JSON when object lacks message fields', async () => {
        const payload = { detail: 'invalid input' };
        const response = createResponse({ body: JSON.stringify(payload) });

        await expect(readApiError(response)).resolves.toBe(JSON.stringify(payload));
    });

    it('handles JSON string payloads', async () => {
        const response = createResponse({ body: JSON.stringify('Too many requests') });

        await expect(readApiError(response)).resolves.toBe('Too many requests');
    });

    it('returns fallback when body is empty', async () => {
        const response = createResponse({ statusText: 'Unauthorized', body: '' });

        await expect(readApiError(response)).resolves.toBe('Unauthorized');
    });
});
