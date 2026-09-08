import { analytics } from '../client';
import { captureNotificationOpened, notificationAnalyticsProperties, rememberNotificationReceipt } from '../notificationAnalytics';

let mockOwner: string | null | undefined = 'A';
jest.mock('../client', () => ({ analytics: { capture: jest.fn(), getIdentity: () => mockOwner } }));
beforeEach(() => { mockOwner = 'A'; jest.clearAllMocks(); });

it('only exports the known routing kind and static destination', () => {
    expect(notificationAnalyticsProperties({ kind: 'review_note', body: 'private note', userId: 'private-id', token: 'secret' }))
        .toEqual({ reminder_kind: 'review_note', destination: 'notes' });
    expect(notificationAnalyticsProperties({ kind: 'log_note', sessionAt: 'private-date' }))
        .toEqual({ reminder_kind: 'log_note', destination: 'note_editor' });
    expect(notificationAnalyticsProperties({ kind: 'private arbitrary text' }))
        .toEqual({ reminder_kind: 'unknown', destination: 'note_editor' });
    expect(notificationAnalyticsProperties(null))
        .toEqual({ reminder_kind: 'unknown', destination: 'note_editor' });
});

it('uses the notification identifier only as a local deduplication key', () => {
    captureNotificationOpened('private-notification-id', { kind: 'review_note', message: 'private text' }, rememberNotificationReceipt('private-notification-id'));
    expect(analytics.capture).toHaveBeenCalledWith('notification_opened', {
        reminder_kind: 'review_note', destination: 'notes',
    }, { dedupeKey: 'notification-open:private-notification-id' });
});

it('does not reassign a deferred A notification when the same last response is read under B', () => {
    const receipt = rememberNotificationReceipt('deferred-A');
    mockOwner = 'B';
    expect(rememberNotificationReceipt('deferred-A')).toBe(receipt);
    captureNotificationOpened('deferred-A', { kind: 'review_note' }, receipt);
    expect(analytics.capture).not.toHaveBeenCalled();
});

it('allows an unresolved cold-launch receipt after account hydration, while known signed-out receipts stay unassigned', () => {
    mockOwner = undefined;
    const coldLaunch = rememberNotificationReceipt('cold-launch');
    mockOwner = null;
    const signedOut = rememberNotificationReceipt('signed-out');
    mockOwner = 'A';
    captureNotificationOpened('cold-launch', { kind: 'log_note' }, coldLaunch);
    captureNotificationOpened('signed-out', { kind: 'log_note' }, signedOut);
    expect(analytics.capture).toHaveBeenCalledTimes(1);
    expect(analytics.capture).toHaveBeenCalledWith('notification_opened', expect.any(Object), { dedupeKey: 'notification-open:cold-launch' });
});
