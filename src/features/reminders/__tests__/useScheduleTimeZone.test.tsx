import { renderHook, waitFor } from '@testing-library/react-native';

import { useScheduleTimeZone } from '../useScheduleTimeZone';
import * as cacheModule from '../remindersCache';

jest.mock('../remindersCache', () => ({
    readRemindersCache: jest.fn(),
}));

const { readRemindersCache } = jest.mocked(cacheModule);

const cacheEntry = (timeZone: string) => ({
    reminders: [],
    timeZone,
    morningReminderMinutes: 450,
    eveningReminderMinutes: 1215,
    deviceTimeZone: 'Europe/London',
    sessionsSignature: 'sig',
    localDate: '2026-09-01',
});

describe('useScheduleTimeZone', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('falls back to the device zone before a schedule has been fetched', async () => {
        readRemindersCache.mockResolvedValue(null);

        const { result } = renderHook(() => useScheduleTimeZone('Europe/London'));

        await waitFor(() => {
            expect(readRemindersCache).toHaveBeenCalled();
        });
        expect(result.current).toBe('Europe/London');
    });

    it('prefers the zone the server resolved the schedule in', async () => {
        // The divergence case: the server scheduled the pushes in a different
        // zone than the device currently reports (travel, or zone sync down).
        // Review windows have to open where the pushes actually fired.
        readRemindersCache.mockResolvedValue(cacheEntry('America/New_York'));

        const { result } = renderHook(() => useScheduleTimeZone('Europe/London'));

        await waitFor(() => {
            expect(result.current).toBe('America/New_York');
        });
    });
});
