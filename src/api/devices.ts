import { Platform } from 'react-native';
import { apiPost, apiDelete } from './client';
import { getDeviceTimeZone } from '../hooks/useTimeZoneSync';

export async function registerDeviceToken(pushToken: string, platform: string): Promise<void> {
    // Sent with the token because this request is what makes the account
    // reachable by the reminder cron, and the cron needs a zone to resolve the
    // reminder hours against. Relying on the profile sync alone left accounts
    // push-eligible but zone-less, and their reminders fell back to UTC.
    const timeZone = getDeviceTimeZone();

    await apiPost('/api/devices', {
        pushToken,
        platform,
        ...(timeZone ? { timeZone } : {}),
    });
}

export async function unregisterDeviceToken(pushToken: string): Promise<void> {
    await apiDelete<void>('/api/devices', { body: { pushToken } });
}

export const currentPlatform = Platform.OS === 'android' ? 'android' : 'ios';
