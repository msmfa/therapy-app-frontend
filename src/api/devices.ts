import { Platform } from 'react-native';
import { apiPost, apiDelete } from './client';

export async function registerDeviceToken(pushToken: string, platform: string): Promise<void> {
  await apiPost('/devices', { pushToken, platform });
}

export async function unregisterDeviceToken(pushToken: string): Promise<void> {
  await apiDelete<void>('/devices', { body: { pushToken } });
}

export const currentPlatform = Platform.OS === 'android' ? 'android' : 'ios';
