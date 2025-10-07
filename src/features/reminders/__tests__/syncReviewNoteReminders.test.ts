import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { syncReviewNoteReminders } from '../review-note-reminder';
import {
    cancelReviewNoteReminderNotifications,
    scheduleReviewNoteReminderNotification,
} from '../../../services/notifications/review-note-reminder';
import { NOTIFICATION_MESSAGES } from '../../../constants/neuroReminders';
import type { Reminder } from '../reminder-schedule-v2';

jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
}));

jest.mock('../../../services/notifications/review-note-reminder', () => ({
    cancelReviewNoteReminderNotifications: jest.fn(),
    scheduleReviewNoteReminderNotification: jest.fn(),
}));

describe('syncReviewNoteReminders', () => {
    const getItemMock = jest.mocked(AsyncStorage.getItem);
    const setItemMock = jest.mocked(AsyncStorage.setItem);
    const removeItemMock = jest.mocked(AsyncStorage.removeItem);
    const cancelMock = jest.mocked(cancelReviewNoteReminderNotifications);
    const scheduleMock = jest.mocked(scheduleReviewNoteReminderNotification);

    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2024-01-01T12:00:00.000Z'));

        jest.clearAllMocks();

        getItemMock.mockResolvedValue(null);
        setItemMock.mockResolvedValue();
        removeItemMock.mockResolvedValue();
        cancelMock.mockResolvedValue();
        scheduleMock.mockResolvedValue('scheduled-id');
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('cancels stored notifications and schedules upcoming reminders', async () => {
        getItemMock.mockResolvedValue(
            JSON.stringify([
                { id: 'stored-1', atUtc: '2023-12-31T20:00:00.000Z', reason: 'post_session' },
            ]),
        );
        scheduleMock.mockResolvedValue('new-1');

        const reminders: Reminder[] = [
            {
                atUtc: '2024-01-02T07:00:00.000Z',
                reason: 'post_sleep',
                gapIndex: 0,
            },
            {
                atUtc: '2023-12-31T19:00:00.000Z',
                reason: 'mid_session',
                gapIndex: 0,
            },
        ];

        await syncReviewNoteReminders(reminders);

        expect(cancelMock).toHaveBeenCalledWith(['stored-1']);
        expect(scheduleMock).toHaveBeenCalledTimes(1);

        const [identifier, body, when, options] = scheduleMock.mock.calls[0];
        expect(identifier).toBe('post_sleep');
        expect(body).toBe(NOTIFICATION_MESSAGES.post_sleep);
        expect(when.toISOString()).toBe('2024-01-02T07:00:00.000Z');
        expect(options).toMatchObject({
            title: 'Keep your therapy insights active',
            data: {
                reason: 'post_sleep',
                atUtc: '2024-01-02T07:00:00.000Z',
                gapIndex: 0,
                category: 'neuroReminder',
            },
        });

        expect(setItemMock).toHaveBeenCalledWith(
            'review.note.reminders',
            JSON.stringify([
                {
                    id: 'new-1',
                    atUtc: '2024-01-02T07:00:00.000Z',
                    reason: 'post_sleep',
                },
            ]),
        );
        expect(removeItemMock).not.toHaveBeenCalled();
    });

    it('clears persisted state when no reminders remain', async () => {
        getItemMock.mockResolvedValue(
            JSON.stringify([
                { id: 'stored-1', atUtc: '2023-12-31T20:00:00.000Z', reason: 'pre_session' },
                { id: 'stored-2', atUtc: '2024-01-01T07:00:00.000Z', reason: 'post_sleep' },
            ]),
        );

        await syncReviewNoteReminders([]);

        expect(cancelMock).toHaveBeenCalledWith(['stored-1', 'stored-2']);
        expect(scheduleMock).not.toHaveBeenCalled();
        expect(removeItemMock).toHaveBeenCalledWith('review.note.reminders');
        expect(setItemMock).not.toHaveBeenCalled();
    });
});
