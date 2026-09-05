import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import * as therapyModule from '../therapy';
import type { TherapySession } from '../therapy';
import * as clientModule from '../client';

jest.mock('../client', () => ({
  apiGet: jest.fn(),
  apiPost: jest.fn(),
}));

const {
  getTherapySessions,
  syncTherapySessions,
} = therapyModule;

const { apiGet, apiPost } = jest.mocked(clientModule);

describe('therapy api helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
      baseSessions: [],
    });
    expect(result).toBe(response);
  });

  it('keeps the sync deletion window at the exact editable instants', async () => {
    const payload = [{ startsAtUtc: '2024-02-02T10:00:00.000Z', durationMin: 60 }];
    const response = { created: 0, updated: 0, deleted: 0 };
    apiPost.mockResolvedValueOnce(response);

    // Fetching may widen safely, but deletion must not. These could be local
    // midnight boundaries in a non-UTC zone; widening them to their UTC day
    // would include appointments from a hidden part of the previous local day.
    const from = new Date('2024-02-01T06:12:00.000Z');
    const to = new Date('2024-02-05T21:30:00.000Z');

    await syncTherapySessions(payload, { from, to });

    expect(apiPost).toHaveBeenCalledWith('/api/therapy-sessions/sync', {
      sessions: payload,
      baseSessions: [],
      from: '2024-02-01T06:12:00.000Z',
      to: '2024-02-05T21:30:00.000Z',
    });
  });
});
