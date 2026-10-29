import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Sentry from '@sentry/react-native';
import { useTranslation } from 'react-i18next';
import { toError } from '../../utils/errors';

/**
 * The category reminder pushes are sent with. It only takes effect on a push
 * whose payload names this same category.
 */
export const REMINDER_CATEGORY_ID = 'reminder';

/**
 * Registers the reminder category with the line iOS shows in place of the
 * reminder text when the user has set previews to hidden. Without it iOS shows
 * the bare word "Notification".
 *
 * Placeholder only: `showTitle` stays off, because hiding previews is a privacy
 * choice and the title would partly override it. No actions either.
 */
export async function registerReminderCategory(previewPlaceholder: string): Promise<void> {
    try {
        await Notifications.setNotificationCategoryAsync(REMINDER_CATEGORY_ID, [], { previewPlaceholder });
    } catch (err) {
        Sentry.withScope((scope) => {
            scope.setTag('feature', 'notifications.category');
            Sentry.captureException(toError(err));
        });
        console.warn('registerReminderCategory failed', err);
    }
}

/**
 * Keeps the reminder category's placeholder in the app's language. iOS fixes
 * the text when the category is registered, so it is registered again whenever
 * the language changes. The placeholder is an iOS feature, so Android skips it.
 */
export function useReminderCategory(): void {
    const { t } = useTranslation('onboarding');
    const previewPlaceholder = t('notifications.previewPlaceholder');

    useEffect(() => {
        if (Platform.OS !== 'ios') return;
        void registerReminderCategory(previewPlaceholder);
    }, [previewPlaceholder]);
}
