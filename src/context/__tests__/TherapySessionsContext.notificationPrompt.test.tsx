import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { describe, beforeEach, expect, it, jest } from '@jest/globals';
import { TherapySessionsProvider, useTherapySessions } from '../therapy-sessions/TherapySessionsContext';
import * as therapyModule from '../../api/therapy';
import { askForNotificationsAfterSessionAdded } from '../../services/notifications/permission';

// Users who skip onboarding's notifications step (the sample plan, a new
// phone, a reinstall) used to be asked nowhere else, so their reminders were
// dropped for want of a registered device. Every way of adding a session must
// lead to the permission prompt.

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
  askForNotificationsAfterSessionAdded: jest.fn(),
}));

const { getCalendar, createSession, updateSession, deleteSession, replaceSchedule, clearFutureSchedule } =
  jest.mocked(therapyModule);
const ask = jest.mocked(askForNotificationsAfterSessionAdded);

const DAY_MS = 24 * 60 * 60 * 1000;
const tomorrow = () => new Date(Date.now() + DAY_MS);

const calendar = (): therapyModule.CalendarSnapshot => ({
  revision: 1,
  timeZone: 'UTC',
  morningReminderMinutes: 420,
  eveningReminderMinutes: 1200,
  sessions: [],
  series: [],
  reminders: [],
});

const written: therapyModule.SessionWriteResult = {
  revision: 2,
  session: { _id: 'new', startsAtUtc: tomorrow().toISOString(), durationMin: 50 },
  created: 1,
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TherapySessionsProvider>{children}</TherapySessionsProvider>
);

async function renderProvider() {
  const view = renderHook(() => useTherapySessions(), { wrapper });
  await waitFor(() => expect(view.result.current.revision).toBe(1));
  return view;
}

describe('asking for notification permission after a session is added', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ask.mockResolvedValue(undefined);
    getCalendar.mockResolvedValue(calendar());
    createSession.mockResolvedValue(written);
    updateSession.mockResolvedValue({ revision: 2, session: written.session });
    deleteSession.mockResolvedValue({ revision: 2, deleted: 1 });
    replaceSchedule.mockResolvedValue({ revision: 2, deleted: 0, created: 1 });
    clearFutureSchedule.mockResolvedValue({ revision: 2, deleted: 1 });
  });

  it('asks once a session is added from the calendar', async () => {
    const { result } = await renderProvider();
    await act(async () => {
      await result.current.addSession({ startsAtUtc: tomorrow(), durationMin: 50 });
    });
    expect(ask).toHaveBeenCalledTimes(1);
  });

  it('asks once onboarding adds its series', async () => {
    const { result } = await renderProvider();
    await act(async () => {
      await result.current.addSeries({ firstSessionAt: tomorrow(), cadence: 'weekly', durationMin: 50 });
    });
    expect(createSession).toHaveBeenCalledTimes(1);
    expect(ask).toHaveBeenCalledTimes(1);
  });

  it('asks once the schedule page saves a schedule', async () => {
    const { result } = await renderProvider();
    await act(async () => {
      await result.current.replaceSchedule({ firstSessionAt: tomorrow(), cadence: 'weekly', durationMin: 50 });
    });
    expect(ask).toHaveBeenCalledTimes(1);
  });

  it('does not ask when the session was not saved', async () => {
    const { result } = await renderProvider();
    createSession.mockRejectedValueOnce(new Error('offline'));
    await act(async () => {
      await expect(result.current.addSession({ startsAtUtc: tomorrow(), durationMin: 50 })).rejects.toThrow('offline');
    });
    expect(ask).not.toHaveBeenCalled();
  });

  it('does not ask for moves and deletes, which add nothing', async () => {
    const { result } = await renderProvider();
    await act(async () => {
      await result.current.updateSession('new', { startsAtUtc: tomorrow(), scope: 'this' });
      await result.current.removeSession('new', 'this');
      await result.current.clearFutureSessions();
    });
    expect(ask).not.toHaveBeenCalled();
  });

  it('never holds up the save while the prompt is on screen', async () => {
    ask.mockReturnValue(new Promise<void>(() => {}));
    const { result } = await renderProvider();
    let saved: therapyModule.SessionWriteResult | undefined;
    await act(async () => {
      saved = await result.current.addSession({ startsAtUtc: tomorrow(), durationMin: 50 });
    });
    expect(saved).toEqual(written);
    expect(ask).toHaveBeenCalledTimes(1);
  });
});
