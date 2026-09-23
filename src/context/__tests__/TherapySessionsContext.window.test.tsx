import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { describe, beforeEach, expect, it, jest } from '@jest/globals';
import { TherapySessionsProvider, useTherapySessions } from '../therapy-sessions/TherapySessionsContext';
import * as therapyModule from '../../api/therapy';

let mockIsAuthenticated = true;

jest.mock('../auth/AuthContext', () => ({
    useAuth: () => ({
        isAuthenticated: mockIsAuthenticated,
        user: { id: 'user-1' },
    }),
}));

jest.mock('../../api/therapy', () => ({
    getCalendar: jest.fn(), createSession: jest.fn(), updateSession: jest.fn(), deleteSession: jest.fn(),
}));

const { getCalendar } = jest.mocked(therapyModule);

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <TherapySessionsProvider>{children}</TherapySessionsProvider>
);

const DAY_MS = 24 * 60 * 60 * 1000;

const session = (id: string, startsAtMs: number): therapyModule.TherapySession => ({
    _id: id,
    startsAtUtc: new Date(startsAtMs).toISOString(),
    durationMin: 50,
});

const calendar = (sessions: therapyModule.TherapySession[]): therapyModule.CalendarSnapshot => ({
    revision: 1, timeZone: 'UTC', morningReminderMinutes: 420, eveningReminderMinutes: 1200,
    sessions, series: [], reminders: [],
});

describe('TherapySessionsProvider session windows', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockIsAuthenticated = true;
        getCalendar.mockResolvedValue(calendar([]));
    });

    // The review feature attributes a note to the gap between two sessions,
    // and the session that opened the gap is in the past by the morning after.
    // A fetch that starts at local midnight today loses it, attribution
    // returns null, and no reminder after the first evening can be ticked.
    it('keeps past sessions available to the schedule while the editable list starts today', async () => {
        const now = Date.now();
        const past = session('past', now - 3 * DAY_MS);
        const future = session('future', now + 4 * DAY_MS);
        getCalendar.mockResolvedValue(calendar([past, future]));

        const { result } = renderHook(() => useTherapySessions(), { wrapper });

        await waitFor(() => expect(result.current.scheduleSessions).toHaveLength(2));
        expect(result.current.reminderScheduleSettings?.timeZone).toBe('UTC');

        // The replay list holds both ends of the gap.
        expect(result.current.scheduleSessions.map((s) => s._id)).toEqual(['past', 'future']);
        // Every existing consumer still sees only the editable window.
        expect(result.current.sessions.map((s) => s._id)).toEqual(['future']);
    });

    it('fetches from well before today so the gap-opening session is included', async () => {
        const { result } = renderHook(() => useTherapySessions(), { wrapper });

        await waitFor(() => expect(result.current.reminderScheduleSettings?.timeZone).toBe('UTC'));

        const [from, to] = getCalendar.mock.calls[0];
        // Far enough back to cover any gap between sessions, and still
        // reaching a year ahead.
        expect(Date.now() - from.getTime()).toBeGreaterThanOrEqual(89 * DAY_MS);
        expect(to.getTime() - Date.now()).toBeGreaterThanOrEqual(364 * DAY_MS);
    });
});
