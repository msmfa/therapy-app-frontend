import { analytics } from './client';
import type { AnalyticsEvents } from './events';

/** Push payloads are untrusted. Only the two known routing kinds can leave the device. */
export function notificationAnalyticsProperties(data: unknown): AnalyticsEvents['notification_opened'] {
    const kind = data && typeof data === 'object' ? (data as { kind?: unknown }).kind : undefined;
    const reminder_kind = kind === 'log_note' || kind === 'review_note' ? kind : 'unknown';
    return {
        reminder_kind,
        destination: kind === 'review_note' ? 'notes' as const : 'note_editor' as const,
    };
}

export type NotificationAnalyticsReceipt = { readonly owner: string | null | undefined };
const receipts = new Map<string, NotificationAnalyticsReceipt>();
const MAX_RECEIPTS = 256;

/** Remember the first receipt across readiness effects and layout remounts. */
export function rememberNotificationReceipt(notificationId: string): NotificationAnalyticsReceipt {
    const existing = receipts.get(notificationId);
    if (existing) return existing;
    const receipt = { owner: analytics.getIdentity() };
    receipts.set(notificationId, receipt);
    if (receipts.size > MAX_RECEIPTS) receipts.delete(receipts.keys().next().value!);
    return receipt;
}

/** Navigation may wait for onboarding/auth, but must not reassign A's tap to B. */
export function captureNotificationOpened(
    notificationId: string,
    data: unknown,
    receipt: NotificationAnalyticsReceipt,
): void {
    // Undefined means cold launch auth was unresolved, not a known signed-out
    // owner. That launch may resolve to its restored account before routing.
    if (receipt.owner !== undefined && receipt.owner !== analytics.getIdentity()) return;
    analytics.capture('notification_opened', notificationAnalyticsProperties(data), {
        // This identifier is used locally for deduplication, never as a property.
        dedupeKey: `notification-open:${notificationId}`,
    });
}
