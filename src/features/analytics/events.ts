export const ONBOARDING_STEPS = ['welcome', 'goal', 'session_date', 'session_cadence', 'reminder_times', 'plan_preview', 'reviews_preview', 'note_preview', 'subscription_preview', 'account_preview', 'notifications_preview', 'success'] as const;
export type OnboardingStep = typeof ONBOARDING_STEPS[number];
export type ReviewKind = 'post_session' | 'post_sleep' | 'mid_session' | 'pre_session' | 'unprompted';
export type AnalyticsErrorCode = 'network' | 'storage' | 'auth' | 'store' | 'unknown';
type Checkout = { operation: 'purchase' | 'restore'; plan: 'monthly' | 'annual' | 'unknown'; entry_point: 'onboarding' | 'account' | 'settings' };
export interface AnalyticsEvents {
    onboarding_step_viewed: { step: OnboardingStep; flow_version: '1' };
    onboarding_completed: { plan_mode: 'real' | 'sample' };
    checkout_started: Checkout;
    checkout_result: Checkout & { outcome: 'purchased' | 'cancelled' | 'pending' | 'failed' | 'restored' | 'unlinked' | 'no_entitlement' };
    note_saved: { operation: 'new' | 'edit'; is_first_note: boolean; entry_point: 'notes' | 'note_editor' | 'notification' };
    note_opened: { entry_point: 'notes' | 'notification'; note_age_bucket?: 'same_day' | '1_7_days' | '8_30_days' | 'over_30_days' };
    review_completed: { review_kind: ReviewKind; first_review: boolean; entry_point: 'notes' | 'notification'; is_first_review_for_note?: boolean; note_saved_on_previous_visit?: boolean };
    notification_setup_result: { stage: 'permission' | 'registration'; outcome: 'granted' | 'denied' | 'provisional' | 'not_determined' | 'registered' | 'failed' | 'skipped'; entry_point: 'onboarding' | 'settings' | 'app_start' };
    notification_opened: { reminder_kind: 'log_note' | 'review_note' | 'unknown'; destination: 'notes' | 'note_editor' };
    critical_action_failed: { operation: 'note_save' | 'review_save' | 'checkout' | 'onboarding_save' | 'notification_registration'; error_code: AnalyticsErrorCode };
}
export type AnalyticsEvent = keyof AnalyticsEvents;
type Rule = { values?: readonly string[]; boolean?: true; optional?: true };
const choice = (...values: string[]): Rule => ({ values });
const bool: Rule = { boolean: true };
const checkout = { operation: choice('purchase', 'restore'), plan: choice('monthly', 'annual', 'unknown'), entry_point: choice('onboarding', 'account', 'settings') };
const RULES: Record<AnalyticsEvent, Record<string, Rule>> = {
    onboarding_step_viewed: { step: choice(...ONBOARDING_STEPS), flow_version: choice('1') },
    onboarding_completed: { plan_mode: choice('real', 'sample') },
    checkout_started: checkout,
    checkout_result: { ...checkout, outcome: choice('purchased', 'cancelled', 'pending', 'failed', 'restored', 'unlinked', 'no_entitlement') },
    note_saved: { operation: choice('new', 'edit'), is_first_note: bool, entry_point: choice('notes', 'note_editor', 'notification') },
    note_opened: { entry_point: choice('notes', 'notification'), note_age_bucket: { ...choice('same_day', '1_7_days', '8_30_days', 'over_30_days'), optional: true } },
    review_completed: { review_kind: choice('post_session', 'post_sleep', 'mid_session', 'pre_session', 'unprompted'), first_review: bool, entry_point: choice('notes', 'notification'), is_first_review_for_note: { ...bool, optional: true }, note_saved_on_previous_visit: { ...bool, optional: true } },
    notification_setup_result: { stage: choice('permission', 'registration'), outcome: choice('granted', 'denied', 'provisional', 'not_determined', 'registered', 'failed', 'skipped'), entry_point: choice('onboarding', 'settings', 'app_start') },
    notification_opened: { reminder_kind: choice('log_note', 'review_note', 'unknown'), destination: choice('notes', 'note_editor') },
    critical_action_failed: { operation: choice('note_save', 'review_save', 'checkout', 'onboarding_save', 'notification_registration'), error_code: choice('network', 'storage', 'auth', 'store', 'unknown') },
};

/** Runtime defense: TS types do not protect against JS callers or SDK enrichment. */
export function allowedEventProperties(event: string, input: unknown): Record<string, string | boolean> | null {
    if (!Object.prototype.hasOwnProperty.call(RULES, event) || !input || typeof input !== 'object') return null;
    const result: Record<string, string | boolean> = {};
    for (const [key, rule] of Object.entries(RULES[event as AnalyticsEvent])) {
        const value = (input as Record<string, unknown>)[key];
        if (value === undefined && rule.optional) continue;
        if (rule.boolean ? typeof value !== 'boolean' : typeof value !== 'string' || !rule.values?.includes(value)) return null;
        result[key] = value as string | boolean;
    }
    return result;
}
