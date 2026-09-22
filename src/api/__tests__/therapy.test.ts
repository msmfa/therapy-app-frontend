import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import * as therapyModule from '../therapy';
import * as clientModule from '../client';

// jest.setup mocks this module for every suite that renders the provider;
// this suite is about the real helpers.
jest.unmock('../therapy');

jest.mock('../client', () => ({
  apiGet: jest.fn(),
  apiPost: jest.fn(),
  apiPut: jest.fn(),
  apiDelete: jest.fn(),
}));

const { getCalendar, createSession, updateSession, deleteSession } = therapyModule;
const { apiGet, apiPost, apiPut, apiDelete } = jest.mocked(clientModule);

const wireCalendar = {
  revision: 7,
  timeZone: 'Europe/London',
  morningReminderMinutes: 450,
  eveningReminderMinutes: 1215,
  sessions: [{ id: 'abc', startsAtUtc: '2026-09-15T13:30:00.000Z', durationMin: 50, seriesId: 'ser', exception: false }],
  series: [{ id: 'ser', cadence: 'weekly', startsAtUtc: '2026-09-15T13:30:00.000Z', timeZone: 'Europe/London' }],
  reminders: [],
};

describe('calendar api helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches the calendar for the exact window and maps ids to the shape the app uses', async () => {
    apiGet.mockResolvedValueOnce(wireCalendar);
    const from = new Date('2026-06-03T00:00:00.000Z');
    const to = new Date('2027-09-01T23:59:59.999Z');

    const result = await getCalendar(from, to);

    const url = new URL(`https://example.com${apiGet.mock.calls[0]?.[0]}`);
    expect(url.pathname).toBe('/api/calendar');
    expect(url.searchParams.get('from')).toBe(from.toISOString());
    expect(url.searchParams.get('to')).toBe(to.toISOString());
    // Every consumer of the session list was written against `_id`.
    expect(result.sessions[0]).toEqual({
      _id: 'abc', startsAtUtc: '2026-09-15T13:30:00.000Z', durationMin: 50, seriesId: 'ser', exception: false,
    });
    expect(result.revision).toBe(7);
  });

  it('creates a weekly series and sends the revision it last saw as If-Match', async () => {
    apiPost.mockResolvedValueOnce({ revision: 8, session: wireCalendar.sessions[0], series: wireCalendar.series[0], created: 52 });

    const result = await createSession(
      { startsAtUtc: new Date('2026-09-15T13:30:00.000Z'), durationMin: 50, repeat: 'weekly' },
      7,
    );

    expect(apiPost).toHaveBeenCalledWith(
      '/api/therapy-sessions',
      { startsAtUtc: '2026-09-15T13:30:00.000Z', durationMin: 50, repeat: 'weekly' },
      { headers: { 'If-Match': '"7"' } },
    );
    expect(result.session._id).toBe('abc');
    expect(result.created).toBe(52);
  });

  it('sends no If-Match when the client has never loaded the calendar', async () => {
    apiPost.mockResolvedValueOnce({ revision: 1, session: wireCalendar.sessions[0], created: 1 });

    await createSession({ startsAtUtc: new Date('2026-09-15T13:30:00.000Z') });

    expect(apiPost).toHaveBeenCalledWith('/api/therapy-sessions', { startsAtUtc: '2026-09-15T13:30:00.000Z' }, {});
  });

  it('updates one appointment with the scope of the edit', async () => {
    apiPut.mockResolvedValueOnce({ revision: 9, session: wireCalendar.sessions[0] });

    await updateSession('abc', { startsAtUtc: new Date('2026-09-15T15:00:00.000Z'), scope: 'future' }, 8);

    expect(apiPut).toHaveBeenCalledWith(
      '/api/therapy-sessions/abc',
      { startsAtUtc: '2026-09-15T15:00:00.000Z', scope: 'future' },
      { headers: { 'If-Match': '"8"' } },
    );
  });

  it('deletes with the scope in the query, defaulting to this appointment only', async () => {
    apiDelete.mockResolvedValue({ revision: 10, deleted: 1 });

    await deleteSession('abc');
    await deleteSession('abc', 'future', 10);

    expect(apiDelete).toHaveBeenNthCalledWith(1, '/api/therapy-sessions/abc?scope=this', {});
    expect(apiDelete).toHaveBeenNthCalledWith(2, '/api/therapy-sessions/abc?scope=future', { headers: { 'If-Match': '"10"' } });
  });
});
