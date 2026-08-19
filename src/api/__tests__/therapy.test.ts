import { describe, expect, it, beforeEach, afterEach, jest } from '@jest/globals';
import * as therapyModule from '../therapy';
import type { TherapySession } from '../therapy';
import * as clientModule from '../client';

jest.mock('../client', () => ({
  apiGet: jest.fn(),
  apiPost: jest.fn(),
  apiPut: jest.fn(),
  apiDelete: jest.fn(),
}));

const {
  createTherapySession,
  deleteTherapySession,
  getNextSession,
  getTherapySessions,
  syncTherapySessions,
  updateTherapySession,
} = therapyModule;

const { apiGet, apiPost, apiPut, apiDelete } = jest.mocked(clientModule);

const makeSession = (overrides: Partial<TherapySession> = {}): TherapySession => ({
  _id: 'session-id',
  userId: 'user-id',
  startsAtUtc: '2024-01-01T00:00:00.000Z',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

describe('therapy api helpers', () => {
  const january10 = new Date('2024-01-10T12:34:56.000Z');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a therapy session with the expected payload', async () => {
    const response = makeSession({ _id: 'new-session' });
    apiPost.mockResolvedValueOnce(response);

    const result = await createTherapySession(january10, 45);

    expect(apiPost).toHaveBeenCalledWith('/api/therapy-sessions', {
      startsAtUtc: '2024-01-10T12:34:56.000Z',
      durationMin: 45,
    });
    expect(result).toBe(response);
  });

  it('omits duration when not provided on create', async () => {
    const response = makeSession({ _id: 'session-no-duration' });
    apiPost.mockResolvedValueOnce(response);

    await createTherapySession(january10);

    expect(apiPost).toHaveBeenCalledWith('/api/therapy-sessions', {
      startsAtUtc: '2024-01-10T12:34:56.000Z',
      durationMin: undefined,
    });
  });

  it('updates a therapy session using PUT with ISO payload', async () => {
    const response = makeSession({ _id: 'session-123' });
    apiPut.mockResolvedValueOnce(response);

    const result = await updateTherapySession('session-123', january10, 60);

    expect(apiPut).toHaveBeenCalledWith('/api/therapy-sessions/session-123', {
      startsAtUtc: '2024-01-10T12:34:56.000Z',
      durationMin: 60,
    });
    expect(result).toBe(response);
  });

  it('requests therapy sessions with the correct UTC day bounds', async () => {
    const data: TherapySession[] = [];
    apiGet.mockResolvedValueOnce(data);

    const from = new Date('2024-02-01T06:12:00.000Z');
    const to = new Date('2024-02-05T21:30:00.000Z');

    const result = await getTherapySessions(from, to);

    expect(apiGet).toHaveBeenCalledTimes(1);
    const calledUrl = apiGet.mock.calls[0]?.[0];

    expect(calledUrl).toMatch(/^\/api\/therapy-sessions\?/);
    const url = new URL(`https://example.com${calledUrl}`);
    expect(url.searchParams.get('from')).toBe('2024-02-01T00:00:00.000Z');
    expect(url.searchParams.get('to')).toBe('2024-02-05T23:59:59.999Z');
    expect(result).toBe(data);
  });

  it('deletes a therapy session without JSON parsing', async () => {
    apiDelete.mockResolvedValueOnce(undefined);

    await deleteTherapySession('session-delete');

    expect(apiDelete).toHaveBeenCalledWith('/api/therapy-sessions/session-delete', {
      parseJson: false,
    });
  });

  it('syncs therapy sessions with the bulk payload', async () => {
    const payload = [
      { id: 'one', startsAtUtc: '2024-02-01T10:00:00.000Z' },
      { startsAtUtc: '2024-02-02T10:00:00.000Z', durationMin: 60 },
    ];
    const response = { created: 1, updated: 1, deleted: 0 };
    apiPost.mockResolvedValueOnce(response);

    const result = await syncTherapySessions(payload);

    expect(apiPost).toHaveBeenCalledWith('/api/therapy-sessions/sync', {
      sessions: payload,
    });
    expect(result).toBe(response);
  });

  it('sends the edited window with the sync payload using the same UTC bounds as fetching', async () => {
    const payload = [{ startsAtUtc: '2024-02-02T10:00:00.000Z', durationMin: 60 }];
    const response = { created: 0, updated: 0, deleted: 0 };
    apiPost.mockResolvedValueOnce(response);

    // Same instants as the fetch test above: the sync window must widen to
    // identical UTC day bounds, or deletion could reach outside the fetch.
    const from = new Date('2024-02-01T06:12:00.000Z');
    const to = new Date('2024-02-05T21:30:00.000Z');

    await syncTherapySessions(payload, { from, to });

    expect(apiPost).toHaveBeenCalledWith('/api/therapy-sessions/sync', {
      sessions: payload,
      from: '2024-02-01T00:00:00.000Z',
      to: '2024-02-05T23:59:59.999Z',
    });
  });

  describe('getNextSession', () => {
    let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;

    beforeEach(() => {
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    it('returns the earliest upcoming session', async () => {
      apiGet.mockResolvedValueOnce([
        makeSession({ _id: 'past-1', startsAtUtc: '2020-02-20T12:00:00.000Z' }),
        makeSession({ _id: 'future-1', startsAtUtc: '2099-03-05T09:00:00.000Z' }),
        makeSession({ _id: 'future-2', startsAtUtc: '2099-03-03T12:00:00.000Z' }),
      ]);

      const result = await getNextSession();

      expect(apiGet).toHaveBeenCalledTimes(1);
      expect(result?.toISOString()).toBe('2099-03-03T12:00:00.000Z');
    });

    it('returns null when fetching sessions fails', async () => {
      apiGet.mockRejectedValueOnce(new Error('network'));

      const result = await getNextSession();

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();

      expect(apiGet).toHaveBeenCalledTimes(1);
    });
  });
});
