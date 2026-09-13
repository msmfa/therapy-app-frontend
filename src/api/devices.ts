import { Platform } from 'react-native';
import { apiPost, apiDelete } from './client';
import { getDeviceTimeZone } from '../hooks/useTimeZoneSync';
import { deviceLanguageTags } from '../i18n';

export async function registerDeviceToken(pushToken: string, platform: string): Promise<void> {
    // Sent with the token because this request is what makes the account
    // reachable by the reminder cron, and the cron needs a zone to resolve the
    // reminder hours against. Relying on the profile sync alone left accounts
    // push-eligible but zone-less, and their reminders fell back to UTC.
    const timeZone = getDeviceTimeZone();

    // The *device's* language, not the app's. The server stores this as
    // `deviceLocale` and uses it for push copy only when the account has no
    // explicit `locale`, which is what "System" means. Sending the app's
    // current language here instead would overwrite that distinction on every
    // launch, since registration runs far more often than the user changes a
    // setting.
    const locale = deviceLanguageTags()[0];

    await apiPost('/api/devices', {
        pushToken,
        platform,
        ...(timeZone ? { timeZone } : {}),
        ...(locale ? { locale } : {}),
    });
}

export async function unregisterDeviceToken(pushToken: string): Promise<void> {
    await apiDelete<void>('/api/devices', { body: { pushToken } });
}

export const currentPlatform = Platform.OS === 'android' ? 'android' : 'ios';
