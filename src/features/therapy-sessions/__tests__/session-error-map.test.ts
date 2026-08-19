import { describe, expect, it } from '@jest/globals';
import { ApiError } from '../../../api/client';
import { mapSessionError } from '../session-error-map';

describe('mapSessionError', () => {
  it('returns rate limit copy for 429 responses', () => {
    expect(mapSessionError(new ApiError(429, { message: 'Too many requests' }))).toEqual({
      title: 'Please wait a moment',
      message: 'We are loading your therapy sessions too quickly right now. Try again in a few seconds.',
      actionLabel: 'Try again',
      retryable: true,
    });
  });

  it('returns offline copy for transport-level failures (status 0)', () => {
    // The API client wraps fetch's TypeError into ApiError(0), so this is the
    // shape offline errors actually arrive in.
    expect(mapSessionError(new ApiError(0, { message: 'Network request failed', code: 'network' }))).toEqual({
      title: 'No internet connection',
      message: 'You appear to be offline. Reconnect to the internet and try again.',
      actionLabel: 'Try again',
      retryable: true,
    });
  });

  it('returns timeout copy for 408 responses', () => {
    expect(mapSessionError(new ApiError(408, { message: 'Request timed out' })).title).toBe(
      'Connection timed out',
    );
  });
});
