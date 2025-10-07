/* eslint-env jest */
import { act, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { TherapySessionsProvider, useTherapySessions } from '../TherapySessionsContext';

type MockNotificationContent = {
    data?: { noteId?: string } & Record<string, unknown>;
    [key: string]: unknown;
};

type MockNotificationRequest = {
    identifier: string;
    content: MockNotificationContent;
    trigger: unknown;
};

const scheduledRequests: MockNotificationRequest[] = [];
let mockScheduledCounter = 1;

jest.mock('expo-notifications', () => {
    const scheduleNotificationAsync = jest.fn(async (request: {
        content: MockNotificationContent;
        trigger: unknown;
    }) => {
        const identifier = `mock-${mockScheduledCounter++}`;
        scheduledRequests.push({
            identifier,
            content: request.content,
            trigger: request.trigger,
        });
        return identifier;
    });

    const cancelScheduledNotificationAsync = jest.fn(async (identifier: string) => {
        const index = scheduledRequests.findIndex((item) => item.identifier === identifier);
        if (index !== -1) scheduledRequests.splice(index, 1);
    });

    const getAllScheduledNotificationsAsync = jest.fn(async () =>
        scheduledRequests.map((item) => ({
            identifier: item.identifier,
            content: { ...item.content, data: { ...(item.content?.data ?? {}) } },
            trigger: item.trigger,
        } as MockNotificationRequest)),
    );

    return {
        __esModule: true,
        setNotificationHandler: jest.fn(),
        scheduleNotificationAsync,
        cancelScheduledNotificationAsync,
        getAllScheduledNotificationsAsync,
        AndroidImportance: { DEFAULT: 'default' },
        SchedulableTriggerInputTypes: { DATE: 'DATE' },
        __getScheduledRequests: () => scheduledRequests.map((item) => ({ ...item })),
        __resetNotifications: () => {
            scheduledRequests.splice(0, scheduledRequests.length);
            mockScheduledCounter = 1;
        },
    };
});

import * as Notifications from 'expo-notifications';

jest.mock('expo-device', () => ({
    __esModule: true,
    isDevice: true,
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

jest.mock('../../../components/reminders/reminder-schedule-v2', () => {
    const actual = jest.requireActual('../../../components/reminders/reminder-schedule-v2') as Record<string, unknown>;
    return {
        ...actual,
        scheduleNeuroplasticityReminders: jest.fn(() => []),
    };
});

jest.mock('../../auth/AuthContext', () => ({
    useAuth: () => ({ isAuthenticated: true }),
}));

jest.mock('../../../api/therapy', () => ({
    getTherapySessions: jest.fn(),
    createTherapySession: jest.fn(),
    updateTherapySession: jest.fn(),
    deleteTherapySession: jest.fn(),
    syncTherapySessions: jest.fn(),
}));

type TherapySession = {
    _id: string;
    startsAtUtc: string;
    durationMin: number;
};

const therapyApi = require('../../../api/therapy') as {
    getTherapySessions: jest.MockedFunction<() => Promise<TherapySession[]>>;
    createTherapySession: jest.Mock;
    updateTherapySession: jest.Mock;
    deleteTherapySession: jest.Mock;
    syncTherapySessions: jest.Mock;
};

const notificationsModule = Notifications as typeof Notifications & {
    __getScheduledRequests: () => MockNotificationRequest[];
    __resetNotifications: () => void;
};

const scheduleNotificationAsync = Notifications.scheduleNotificationAsync as jest.Mock;
const cancelScheduledNotificationAsync = Notifications.cancelScheduledNotificationAsync as jest.Mock;
const getAllScheduledNotificationsAsync = Notifications.getAllScheduledNotificationsAsync as jest.Mock;

function renderWithProvider(children: React.ReactNode) {
    return render(<TherapySessionsProvider>{children}</TherapySessionsProvider>);
}

describe('TherapySessionsProvider notifications', () => {
    beforeEach(() => {
        notificationsModule.__resetNotifications();
        scheduleNotificationAsync.mockClear();
        cancelScheduledNotificationAsync.mockClear();
        getAllScheduledNotificationsAsync.mockClear();
        therapyApi.getTherapySessions.mockReset();
    });

    it('replaces previously scheduled post-session notifications on subsequent refreshes', async () => {
        const sessions: TherapySession[] = [
            { _id: 'session-1', startsAtUtc: '2050-01-01T09:00:00.000Z', durationMin: 60 },
            { _id: 'session-2', startsAtUtc: '2050-01-03T14:00:00.000Z', durationMin: 45 },
        ];
        therapyApi.getTherapySessions.mockResolvedValue(sessions);

        let contextValue: ReturnType<typeof useTherapySessions> | undefined;

        function Consumer() {
            contextValue = useTherapySessions();
            return null;
        }

        renderWithProvider(<Consumer />);

        await waitFor(() => {
            expect(scheduleNotificationAsync).toHaveBeenCalledTimes(sessions.length);
        });

        const initialScheduled = notificationsModule.__getScheduledRequests();
        expect(initialScheduled).toHaveLength(sessions.length);
        expect(cancelScheduledNotificationAsync).not.toHaveBeenCalled();

        if (!contextValue) {
            throw new Error('TherapySessions context not initialized');
        }

        // Type assertion after the check
        const context = contextValue;

        await act(async () => {
            await context.refreshSessions();
        });

        await waitFor(() => {
            expect(scheduleNotificationAsync).toHaveBeenCalledTimes(sessions.length * 2);
        });

        expect(cancelScheduledNotificationAsync).toHaveBeenCalledTimes(sessions.length);
        const cancelArgs = cancelScheduledNotificationAsync.mock.calls.map(([id]) => id);
        expect(cancelArgs).toEqual(initialScheduled.map((request) => request.identifier));

        const afterRefresh = notificationsModule.__getScheduledRequests();
        expect(afterRefresh).toHaveLength(sessions.length);
        afterRefresh.forEach((request) => {
            expect(request.content?.data?.noteId).toBe('post-session-note');
        });
    });
});
