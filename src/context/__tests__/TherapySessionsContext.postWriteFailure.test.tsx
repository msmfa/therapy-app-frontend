import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { TherapySessionsProvider, useTherapySessions } from '../therapy-sessions/TherapySessionsContext';
import * as therapyModule from '../../api/therapy';

jest.mock('../auth/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: true, user: { id: 'user-1' } }),
}));

jest.mock('../../api/therapy', () => ({
  getCalendar: jest.fn(),
  createSession: jest.fn(),
  updateSession: jest.fn(),
  deleteSession: jest.fn(),
  replaceSchedule: jest.fn(),
  clearFutureSchedule: jest.fn(),
}));

jest.mock('../../services/notifications/permission', () => ({
  askForNotificationsAfterSessionAdded: jest.fn(async () => undefined),
}));

const { getCalendar, createSession, updateSession, deleteSession, replaceSchedule, clearFutureSchedule } =
  jest.mocked(therapyModule);

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TherapySessionsProvider>{children}</TherapySessionsProvider>
);

const DAY_MS = 24 * 60 * 60 * 1000;
const inDays = (days: number) => new Date(Date.now() + days * DAY_MS);

const session = (id: string, at: Date, extra: Partial<therapyModule.TherapySession> = {}): therapyModule.TherapySession =>
  ({ _id: id, startsAtUtc: at.toISOString(), durationMin: 50, ...extra });

const weekly = (id: string, at: Date): therapyModule.TherapySeries =>
  ({ id, cadence: 'weekly', startsAtUtc: at.toISOString(), timeZone: 'UTC', durationMin: 50 });

const review = (id: string, after: therapyModule.TherapySession, before: therapyModule.TherapySession): therapyModule.CalendarReminder => ({
  id,
  kind: 'review_note',
  dueAtUtc: after.startsAtUtc,
  localDate: after.startsAtUtc.slice(0, 10),
  sessionId: after._id,
  nextSessionId: before._id,
  status: 'pending',
});

// One appointment on its own, then three of a weekly series.
const oneOff = session('one-off', inDays(2));
const first = session('first', inDays(3), { seriesId: 'rule' });
const second = session('second', inDays(10), { seriesId: 'rule' });
const third = session('third', inDays(17), { seriesId: 'rule' });

const loaded: therapyModule.CalendarSnapshot = {
  revision: 7,
  timeZone: 'UTC',
  morningReminderMinutes: 420,
  eveningReminderMinutes: 1200,
  sessions: [oneOff, first, second, third],
  series: [weekly('rule', new Date(first.startsAtUtc))],
  reminders: [review('r1', first, second), review('r2', second, third)],
};

const ids = (list: { _id: string }[]) => list.map((row) => row._id);

describe('when a write is saved but the calendar cannot be fetched after it', () => {
  let restoreConsole = () => {};

  beforeEach(() => {
    jest.clearAllMocks();
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    restoreConsole = () => consoleError.mockRestore();
    getCalendar.mockReset();
    getCalendar.mockResolvedValueOnce(loaded);
    getCalendar.mockRejectedValue(new TypeError('Network request failed'));
  });

  afterEach(() => {
    restoreConsole();
    jest.useRealTimers();
  });

  const renderLoaded = async () => {
    const { result } = renderHook(() => useTherapySessions(), { wrapper });
    await waitFor(() => expect(result.current.revision).toBe(7));
    return result;
  };

  /** The revision the next edit carries: the one the server checks it against. */
  const nextEditRevision = async (result: { current: ReturnType<typeof useTherapySessions> }) => {
    updateSession.mockClear();
    updateSession.mockResolvedValueOnce({ revision: 9, session: first });
    await act(async () => {
      await result.current.updateSession('first', { durationMin: 60, scope: 'this' });
    });
    return updateSession.mock.calls[0]?.[2];
  };

  it('stops showing a deleted appointment, and it is no longer the next one', async () => {
    const result = await renderLoaded();
    deleteSession.mockResolvedValueOnce({ revision: 8, deleted: 1 });

    await act(async () => { await result.current.removeSession('one-off', 'this'); });

    expect(ids(result.current.sessions)).toEqual(['first', 'second', 'third']);
    expect(result.current.nextSession?._id).toBe('first');
    // Everything this delete did is on screen, so the next edit may build on it.
    expect(result.current.revision).toBe(8);
  });

  it('stops showing the rest of a series deleted from one appointment on, and its reminders', async () => {
    const result = await renderLoaded();
    deleteSession.mockResolvedValueOnce({ revision: 8, deleted: 2 });

    await act(async () => { await result.current.removeSession('second', 'future'); });

    expect(ids(result.current.sessions)).toEqual(['one-off', 'first']);
    expect(result.current.reminders).toEqual([]);
    expect(result.current.revision).toBe(8);
  });

  it('shows nothing from now on after clearing the future, and does not claim the new revision', async () => {
    const result = await renderLoaded();
    clearFutureSchedule.mockResolvedValueOnce({ revision: 8, deleted: 4 });

    await act(async () => { await result.current.clearFutureSessions(); });

    expect(result.current.sessions).toEqual([]);
    expect(result.current.nextSession).toBeNull();
    expect(result.current.revision).toBe(7);
  });

  it('replaces the old schedule with the first new session, and the next edit is checked against the old revision', async () => {
    const result = await renderLoaded();
    const fresh = session('fresh', inDays(5), { seriesId: 'fresh-rule' });
    replaceSchedule.mockResolvedValueOnce({
      revision: 8, deleted: 4, created: 52, session: fresh, series: weekly('fresh-rule', inDays(5)),
    });

    await act(async () => {
      await result.current.replaceSchedule({ firstSessionAt: inDays(5), cadence: 'weekly', durationMin: 50 });
    });

    expect(ids(result.current.sessions)).toEqual(['fresh']);
    expect(result.current.nextSession?._id).toBe('fresh');
    expect(result.current.reminders).toEqual([]);
    // The other 51 are not on screen, so an edit made from this view must be
    // refused as stale rather than saved over a calendar the user has not seen.
    expect(await nextEditRevision(result)).toBe(7);
  });

  it('does not show the later sessions of a series moved from one appointment on at their old times', async () => {
    const result = await renderLoaded();
    const moved = new Date(Date.parse(second.startsAtUtc) + 60 * 60 * 1000);
    updateSession.mockResolvedValueOnce({ revision: 8, session: session('second', moved, { seriesId: 'split' }) });

    await act(async () => {
      await result.current.updateSession('second', { startsAtUtc: moved, scope: 'future' });
    });

    expect(ids(result.current.sessions)).toEqual(['one-off', 'first', 'second']);
    expect(result.current.sessions[2]?.startsAtUtc).toBe(moved.toISOString());
    expect(await nextEditRevision(result)).toBe(7);
  });

  it('does not claim the revision of a new series whose other sessions it has not seen', async () => {
    const result = await renderLoaded();
    const start = session('start', inDays(4), { seriesId: 'new-rule' });
    createSession.mockResolvedValueOnce({ revision: 8, session: start, series: weekly('new-rule', inDays(4)), created: 52 });

    await act(async () => {
      await result.current.addSession({ startsAtUtc: inDays(4), durationMin: 50, repeat: 'weekly' });
    });

    expect(ids(result.current.sessions)).toContain('start');
    expect(await nextEditRevision(result)).toBe(7);
  });

  it('reports a failed load to a screen whose own load the refetch replaced', async () => {
    const result = await renderLoaded();
    // A screen's load hangs on a poor connection and never answers.
    getCalendar.mockImplementationOnce(() => new Promise(() => {}));
    let screenLoad: Promise<void> = Promise.resolve();
    act(() => { screenLoad = result.current.refreshSessions(); });
    const settled = screenLoad.then(() => 'loaded', () => 'failed');
    await waitFor(() => expect(result.current.reminderScheduleStatus).toBe('loading'));

    // A delete is saved, and the refetch that replaces the screen's load fails.
    deleteSession.mockResolvedValueOnce({ revision: 8, deleted: 1 });
    await act(async () => { await result.current.removeSession('one-off', 'this'); });
    expect(getCalendar).toHaveBeenCalledTimes(3);

    expect(result.current.reminderScheduleStatus).toBe('error');
    expect(await settled).toBe('failed');
  });

  it('keeps trying to fetch the calendar until it succeeds', async () => {
    jest.useFakeTimers();
    const result = await renderLoaded();
    clearFutureSchedule.mockResolvedValueOnce({ revision: 8, deleted: 4 });
    await act(async () => { await result.current.clearFutureSessions(); });
    expect(getCalendar).toHaveBeenCalledTimes(2);

    // The first retry fails too.
    await act(async () => { jest.advanceTimersByTime(15_000); });
    expect(getCalendar).toHaveBeenCalledTimes(3);

    getCalendar.mockResolvedValueOnce({ ...loaded, revision: 8, sessions: [], reminders: [] });
    await act(async () => { jest.advanceTimersByTime(30_000); });
    await waitFor(() => expect(result.current.revision).toBe(8));
    expect(getCalendar).toHaveBeenCalledTimes(4);
  });

  it('keeps trying when another write fails to refetch while a retry is still waiting', async () => {
    jest.useFakeTimers();
    const result = await renderLoaded();
    deleteSession.mockResolvedValueOnce({ revision: 8, deleted: 2 });
    await act(async () => { await result.current.removeSession('second', 'future'); });
    expect(getCalendar).toHaveBeenCalledTimes(2);

    // The retry's request hangs on a poor connection.
    let releaseHungFetch = (_snapshot: therapyModule.CalendarSnapshot) => {};
    getCalendar.mockImplementationOnce(() => new Promise((resolve) => { releaseHungFetch = resolve; }));
    await act(async () => { jest.advanceTimersByTime(15_000); });
    expect(getCalendar).toHaveBeenCalledTimes(3);

    // Another edit is saved, and its own refetch fails while the retry waits.
    updateSession.mockResolvedValueOnce({ revision: 9, session: { ...first, durationMin: 60 } });
    await act(async () => { await result.current.updateSession('first', { durationMin: 60, scope: 'this' }); });
    expect(getCalendar).toHaveBeenCalledTimes(4);

    // The hung request answers late, and that answer is superseded.
    await act(async () => { releaseHungFetch(loaded); });

    const fresh = review('r-fresh', oneOff, first);
    getCalendar.mockResolvedValueOnce({
      ...loaded, revision: 9, sessions: [oneOff, { ...first, durationMin: 60 }], series: [], reminders: [fresh],
    });
    await act(async () => { jest.advanceTimersByTime(30_000); });
    expect(getCalendar).toHaveBeenCalledTimes(5);
    await waitFor(() => expect(result.current.reminders).toEqual([fresh]));
  });
});
