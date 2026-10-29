import { useEffect } from 'react';
import { useTherapySessions } from '../context/therapy-sessions/TherapySessionsContext';
import { askForNotificationsOnOpen } from '../services/notifications/permission';

/**
 * Asks for notification permission once the calendar shows a reminder still
 * to come. Mounted inside the signed-in, paid area, so it reaches the users
 * no add ever does: a reinstall, a new phone, a series set up long ago.
 */
export function useAskForNotificationsOnOpen(): void {
    const { hydrated, nextReminder } = useTherapySessions();
    const hasReminderToCome = hydrated && nextReminder !== null;

    useEffect(() => {
        if (hasReminderToCome) void askForNotificationsOnOpen();
    }, [hasReminderToCome]);
}
