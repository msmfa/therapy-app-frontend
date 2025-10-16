import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { SQLiteRunResult } from 'expo-sqlite';

type ClearNotesForUser = typeof import('../useNotes')['clearNotesForUser'];
type CancelNotificationById = typeof import('../../../services/notifications')['cancelNotificationById'];

type NoteRow = { notifId: string | null };
type ExecAsync = (source: string) => Promise<void>;
type GetAllAsync = (source: string, ...params: unknown[]) => Promise<NoteRow[]>;
type RunAsync = (source: string, ...params: unknown[]) => Promise<SQLiteRunResult>;

const createRunResult = (): SQLiteRunResult => ({
    lastInsertRowId: 0,
    changes: 0,
});
const mockExecAsync: jest.MockedFunction<ExecAsync> = jest.fn();
const mockGetAllAsync: jest.MockedFunction<GetAllAsync> = jest.fn();
const mockRunAsync: jest.MockedFunction<RunAsync> = jest.fn();

jest.mock('expo-sqlite', () => ({
    openDatabaseAsync: jest.fn(() =>
        Promise.resolve({
            execAsync: mockExecAsync,
            getAllAsync: mockGetAllAsync,
            runAsync: mockRunAsync,
        }),
    ),
}));

jest.mock('../../../services/notifications', () => ({
    cancelNotificationById: jest.fn(),
}));

describe('clearNotesForUser', () => {
    let warnSpy: jest.SpiedFunction<typeof console.warn>;

    let clearNotesForUser: ClearNotesForUser;
    let cancelNotificationById: CancelNotificationById;

    beforeEach(() => {
        jest.clearAllMocks();

        mockExecAsync.mockResolvedValue(undefined);
        mockGetAllAsync.mockResolvedValue([]);
        mockRunAsync.mockResolvedValue(createRunResult());

        warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

        jest.isolateModules(() => {
            const notesModule = require('../useNotes') as typeof import('../useNotes');
            const notificationsModule = require('../../../services/notifications') as typeof import('../../../services/notifications');

            clearNotesForUser = notesModule.clearNotesForUser;
            cancelNotificationById = notificationsModule.cancelNotificationById;
        });

        jest.mocked(cancelNotificationById).mockResolvedValue(undefined);
    });

    afterEach(() => {
        jest.clearAllMocks();
        warnSpy.mockRestore();
    });

    it('clears notes and cancels scheduled reminders for the user', async () => {
        mockGetAllAsync.mockResolvedValue([
            { notifId: 'notif-1' },
            { notifId: null },
            { notifId: 'notif-2' },
        ]);

        const cancelMock = jest.mocked(cancelNotificationById);

        await clearNotesForUser('user-123');

        expect(mockGetAllAsync).toHaveBeenCalledWith(
            `SELECT notifId FROM notes WHERE userId = ?`,
            'user-123',
        );
        expect(cancelMock).toHaveBeenCalledTimes(2);
        expect(cancelMock).toHaveBeenNthCalledWith(1, 'notif-1');
        expect(cancelMock).toHaveBeenNthCalledWith(2, 'notif-2');
        expect(mockRunAsync).toHaveBeenCalledWith(
            `DELETE FROM notes WHERE userId = ?`,
            'user-123',
        );
    });

    it('returns early when the user id is not provided', async () => {
        const cancelMock = jest.mocked(cancelNotificationById);

        await clearNotesForUser('');
        await clearNotesForUser(undefined as unknown as string);

        expect(mockGetAllAsync).not.toHaveBeenCalled();
        expect(cancelMock).not.toHaveBeenCalled();
        expect(mockRunAsync).not.toHaveBeenCalled();
    });

    it('still clears stored notes when cancelling notifications fails', async () => {
        mockGetAllAsync.mockResolvedValue([{ notifId: 'notif-1' }]);

        const cancelMock = jest.mocked(cancelNotificationById);
        cancelMock.mockRejectedValueOnce(new Error('no permission'));

        await clearNotesForUser('user-123');

        expect(cancelMock).toHaveBeenCalledWith('notif-1');
        expect(mockRunAsync).toHaveBeenCalledWith(
            `DELETE FROM notes WHERE userId = ?`,
            'user-123',
        );
    });

    it('throws a descriptive error when the database operation fails', async () => {
        mockGetAllAsync.mockRejectedValueOnce(new Error('db unavailable'));

        await expect(clearNotesForUser('user-123')).rejects.toThrow('Failed to clear local notes');
        expect(mockRunAsync).not.toHaveBeenCalled();
        expect(warnSpy).toHaveBeenCalled();
    });
});
