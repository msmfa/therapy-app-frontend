import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { describe, beforeEach, expect, it, jest } from '@jest/globals';

/**
 * Travelling does not change the user's sessions, so a schedule effect keyed
 * only on [sessions] never re-runs. The displayed reminders then keep the
 * instants computed for the old zone while useTimeZoneSync has already moved
 * the backend to the new one — the UI says 10:00, the push arrives at 07:00.
 */
let mockZone = 'America/Los_Angeles';
const appStateListeners: Array<(state: string) => void> = [];

jest.mock('../../hooks/useTimeZoneSync', () => ({
  getDeviceTimeZone: () => mockZone,
  useTimeZoneSync: () => undefined,
}));

jest.mock('../auth/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: true }),
}));

jest.mock('../../api/therapy', () => ({
  // Spread the real module so helpers the context relies on (toUtcDayRange,
  // which separates the editable window from the wider read window) are not
  // silently undefined here.
  ...(jest.requireActual('../../api/therapy') as Record<string, unknown>),
  getTherapySessions: jest.fn(async () => [
    { id: 's1', startsAtUtc: '2030-01-06T18:00:00.000Z', durationMin: 60 },
    { id: 's2', startsAtUtc: '2030-01-20T18:00:00.000Z', durationMin: 60 },
  ]),
  syncTherapySessions: jest.fn(),
}));

import { AppState } from 'react-native';
import { TherapySessionsProvider, useTherapySessions } from '../therapy-sessions/TherapySessionsContext';

// Spy rather than mock the module: replacing react-native wholesale breaks
// the jest-expo preset.
jest.spyOn(AppState, 'addEventListener').mockImplementation(
  ((_event: string, handler: (state: string) => void) => {
    appStateListeners.push(handler);
    return {
      remove: () => {
        const index = appStateListeners.indexOf(handler);
        if (index >= 0) appStateListeners.splice(index, 1);
      },
    };
  }) as never,
);

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TherapySessionsProvider>{children}</TherapySessionsProvider>
);

const foreground = () => {
  act(() => {
    appStateListeners.forEach((listener) => listener('active'));
  });
};

describe('reminders follow the device zone', () => {
  beforeEach(() => {
    appStateListeners.length = 0;
    mockZone = 'America/Los_Angeles';
  });

  it('recomputes when the device zone changes with the sessions unchanged', async () => {
    const { result } = renderHook(() => useTherapySessions(), { wrapper });

    await waitFor(() => expect(result.current.neuroReminders.length).toBeGreaterThan(0));
    const before = result.current.neuroReminders.map((r) => r.atUtc);

    // The user flies LA -> NY. Same sessions, different wall clock.
    mockZone = 'America/New_York';
    foreground();

    await waitFor(() => {
      expect(result.current.neuroReminders.map((r) => r.atUtc)).not.toEqual(before);
    });

    // And the new instants really are on the New York clock.
    result.current.neuroReminders.forEach((reminder) => {
      const hour = Number(
        new Intl.DateTimeFormat('en-US', {
          timeZone: 'America/New_York',
          hour: '2-digit',
          hour12: false,
        }).format(new Date(reminder.atUtc)),
      ) % 24;
      expect([7, 20]).toContain(hour);
    });
  });

  it('does not churn when the zone is unchanged', async () => {
    const { result } = renderHook(() => useTherapySessions(), { wrapper });

    await waitFor(() => expect(result.current.neuroReminders.length).toBeGreaterThan(0));
    const before = result.current.neuroReminders;

    foreground();
    foreground();

    await waitFor(() => {
      expect(result.current.neuroReminders.map((r) => r.atUtc)).toEqual(
        before.map((r) => r.atUtc),
      );
    });
  });
});
