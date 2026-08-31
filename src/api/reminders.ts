import { apiGet } from './client';
import type { Reminder } from '../features/reminders/types';

export type RemindersResponse = {
    /**
     * The zone the server resolved the schedule in, which is the zone the
     * pushes will be sent in. Not necessarily the device zone: it comes from
     * the user's profile, and falls back to UTC before `useTimeZoneSync` has
     * had a chance to report the device's.
     */
    timeZone: string;
    reminders: Reminder[];
};

/**
 * Every review reminder still ahead of now, as the server will send them.
 *
 * Unbounded on purpose. The schedule only extends as far as the user's last
 * session, and the one-per-day cap keeps it small, so paging it would add a
 * window the client would then have to keep in step with the calendar's.
 */
export async function getReminders(): Promise<RemindersResponse> {
    return apiGet<RemindersResponse>('/api/reminders');
}
