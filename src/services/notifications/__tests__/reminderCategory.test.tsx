import { renderHook, act } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { i18next } from '../../../i18n';
import { REMINDER_CATEGORY_ID, useReminderCategory } from '../reminderCategory';

const mockSetCategory = jest.fn().mockResolvedValue(undefined);
jest.mock('expo-notifications', () => ({
    setNotificationCategoryAsync: (...args: unknown[]) => mockSetCategory(...args),
}));
jest.mock('@sentry/react-native', () => ({ withScope: jest.fn(), captureException: jest.fn() }));

const originalOS = Platform.OS;
const setOS = (os: typeof Platform.OS) => Object.defineProperty(Platform, 'OS', { value: os, configurable: true });

beforeEach(async () => {
    mockSetCategory.mockClear();
    setOS('ios');
    await i18next.changeLanguage('en');
});
afterAll(() => setOS(originalOS));

const placeholderIn = (lng: string) => i18next.t('notifications.previewPlaceholder', { ns: 'onboarding', lng });

/**
 * With previews hidden, iOS shows "Notification" unless the category carries
 * a placeholder. The placeholder is fixed at registration, so a language
 * change must register it again, or a Spanish user keeps the English line.
 */
it('registers the reminder category with a translated placeholder and re-registers on a language change', async () => {
    renderHook(() => useReminderCategory());

    expect(mockSetCategory).toHaveBeenCalledTimes(1);
    expect(mockSetCategory).toHaveBeenLastCalledWith(REMINDER_CATEGORY_ID, [], { previewPlaceholder: placeholderIn('en') });

    await act(async () => { await i18next.changeLanguage('es'); });

    expect(placeholderIn('es')).not.toBe(placeholderIn('en'));
    expect(mockSetCategory).toHaveBeenCalledTimes(2);
    expect(mockSetCategory).toHaveBeenLastCalledWith(REMINDER_CATEGORY_ID, [], { previewPlaceholder: placeholderIn('es') });
});

/** Hiding previews is a privacy choice, so the title is not shown in their place. */
it('sets the placeholder only: no actions and no showTitle', () => {
    renderHook(() => useReminderCategory());

    const [, actions, options] = mockSetCategory.mock.calls[0] as [string, unknown[], Record<string, unknown>];
    expect(actions).toEqual([]);
    expect(Object.keys(options)).toEqual(['previewPlaceholder']);
});

it('does nothing on Android, where the placeholder does not exist', () => {
    setOS('android');
    renderHook(() => useReminderCategory());

    expect(mockSetCategory).not.toHaveBeenCalled();
});
