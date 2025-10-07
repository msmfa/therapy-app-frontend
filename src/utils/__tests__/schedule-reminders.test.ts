/* eslint-env jest */
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

jest.mock('expo-notifications', () => ({
    __esModule: true,
    setNotificationHandler: jest.fn(),
    scheduleNotificationAsync: jest.fn(),
    cancelScheduledNotificationAsync: jest.fn(),
    getAllScheduledNotificationsAsync: jest.fn(),
    AndroidImportance: { DEFAULT: 'default' },
    SchedulableTriggerInputTypes: {
        DATE: 'DATE',
    },
}));

jest.mock('expo-device', () => ({
    __esModule: true,
    isDevice: true,
}));

jest.mock('../../components/reminders/reminder-schedule-v2', () => ({
    __esModule: true,
    getPostSessionNoteReminders: jest.fn(),
}));

jest.mock('@sentry/react-native', () => {
    const withScope = jest.fn((callback: (scope: { setTag: jest.Mock; setContext: jest.Mock }) => void) => {
        const scope = { setTag: jest.fn(), setContext: jest.fn() };
        callback(scope);
    });
    const captureException = jest.fn();

    return {
        __esModule: true,
        withScope,
        captureException,
        default: { withScope, captureException },
    };
});

import * as Notifications from 'expo-notifications';
import { getPostSessionNoteReminders } from '../../components/reminders/reminder-schedule-v2';
import { scheduleTherapySessionNotifications } from '../schedule-reminders';

const scheduleNotificationAsync = Notifications
    .scheduleNotificationAsync as jest.MockedFunction<typeof Notifications.scheduleNotificationAsync>;
const getPostSessionNoteRemindersMock = getPostSessionNoteReminders as jest.MockedFunction<
    typeof getPostSessionNoteReminders
>;
const cancelScheduledNotificationAsync = Notifications
    .cancelScheduledNotificationAsync as jest.MockedFunction<
        typeof Notifications.cancelScheduledNotificationAsync
    >;
const getAllScheduledNotificationsAsync = Notifications
    .getAllScheduledNotificationsAsync as jest.MockedFunction<typeof Notifications.getAllScheduledNotificationsAsync>;

describe('scheduleTherapySessionNotifications', () => {
    beforeEach(() => {
        scheduleNotificationAsync.mockResolvedValue('notification-id');
        getPostSessionNoteRemindersMock.mockReset();
        cancelScheduledNotificationAsync.mockClear();
        getAllScheduledNotificationsAsync.mockClear();
        getAllScheduledNotificationsAsync.mockResolvedValue([]);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('schedules a notification for every reminder planned for future sessions', async () => {
        getPostSessionNoteRemindersMock.mockReturnValue([
            {
                sessionId: 'session-1',
                sessionStartsAtUtc: '2050-01-01T09:00:00.000Z',
                remindAtUtc: '2050-01-01T09:10:00.000Z',
            },
            {
                sessionId: 'session-2',
                sessionStartsAtUtc: '2050-01-02T15:00:00.000Z',
                remindAtUtc: '2050-01-02T15:15:00.000Z',
            },
            {
                sessionId: 'session-3',
                sessionStartsAtUtc: '2050-01-05T12:00:00.000Z',
                remindAtUtc: '2050-01-05T12:05:00.000Z',
            },
        ]);

        const sessions = [
            { _id: 'session-1', startsAtUtc: '2050-01-01T09:00:00.000Z', durationMin: 60 },
            { _id: 'session-2', startsAtUtc: '2050-01-02T15:00:00.000Z', durationMin: 45 },
            { _id: 'session-3', startsAtUtc: '2050-01-05T12:00:00.000Z', durationMin: 5 },
        ];

        await scheduleTherapySessionNotifications(
            'note-123',
            'Remember to reflect on your session',
            sessions,
            10,
        );

        expect(scheduleNotificationAsync).toHaveBeenCalledTimes(3);

        const [firstCall] = scheduleNotificationAsync.mock.calls;
        const payload = firstCall?.[0];
        const trigger = payload?.trigger as { type?: string; date?: Date } | undefined;

        expect(payload?.content).toMatchObject({
            title: 'Time to log your therapy session',
            body: 'Remember to reflect on your session',
            data: { noteId: 'note-123' },
        });
        expect(trigger).toBeDefined();
        expect(trigger?.type).toBe('DATE');
        expect(trigger?.date).toEqual(new Date('2050-01-01T09:10:00.000Z'));
    });

    it('does not schedule any notifications when the planner returns no reminders', async () => {
        getPostSessionNoteRemindersMock.mockReturnValue([]);

        await scheduleTherapySessionNotifications(
            'note-123',
            'Remember to reflect on your session',
            [
                { _id: 'session-1', startsAtUtc: '2050-01-01T09:00:00.000Z', durationMin: 60 },
            ],
            10,
        );

        expect(scheduleNotificationAsync).not.toHaveBeenCalled();
    });

    it('cancels existing notifications tied to the note before scheduling new reminders', async () => {
        getPostSessionNoteRemindersMock.mockReturnValue([
            {
                sessionId: 'session-1',
                sessionStartsAtUtc: '2050-01-01T09:00:00.000Z',
                remindAtUtc: '2050-01-01T09:10:00.000Z',
            },
        ]);

        getAllScheduledNotificationsAsync.mockResolvedValue(
            [
                {
                    identifier: 'existing-1',
                    content: { data: { noteId: 'note-123' } },
                    trigger: null,
                },
                {
                    identifier: 'other-note',
                    content: { data: { noteId: 'note-456' } },
                    trigger: null,
                },
            ] as unknown as Notifications.NotificationRequest[],
        );

        await scheduleTherapySessionNotifications(
            'note-123',
            'Remember to reflect on your session',
            [
                { _id: 'session-1', startsAtUtc: '2050-01-01T09:00:00.000Z', durationMin: 60 },
            ],
            10,
        );

        expect(cancelScheduledNotificationAsync).toHaveBeenCalledTimes(1);
        expect(cancelScheduledNotificationAsync).toHaveBeenCalledWith('existing-1');
        expect(scheduleNotificationAsync).toHaveBeenCalledTimes(1);
    });
});
