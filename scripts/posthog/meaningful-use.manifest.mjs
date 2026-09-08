// Native query/cohort shapes verified against official PostHog API docs and
// PostHog/posthog frontend/src/queries/schema/schema-general.ts + posthog/api/cohort.py.
const property = (key, ...value) => ({ key, type: 'event', operator: 'exact', value });
const production = property('environment', 'production');
const event = (name, ...properties) => ({ kind: 'EventsNode', event: name, properties });
const group = (name, nodes) => ({ kind: 'GroupNode', operator: 'OR', name, nodes });
const base = (days) => ({
    dateRange: { date_from: `-${days}d` }, properties: [production],
    filterTestAccounts: true, aggregation_group_type_index: null,
});
const funnel = (series, window, unit, extra = {}) => ({
    kind: 'InsightVizNode', source: {
        ...base(180), kind: 'FunnelsQuery', series,
        funnelsFilter: {
            funnelOrderType: 'ordered', funnelVizType: 'steps', funnelStepReference: 'total',
            funnelWindowInterval: window, funnelWindowIntervalUnit: unit,
            funnelAggregateByHogQL: null,
            ...extra.funnelsFilter,
        },
        ...(extra.breakdownFilter ? { breakdownFilter: extra.breakdownFilter } : {}),
    },
});
const behavior = (name, minimum, ...properties) => ({
    type: 'behavioral', key: name, value: 'performed_event_multiple', event_type: 'events',
    operator: 'gte', operator_value: minimum, time_value: 60, time_interval: 'day',
    negation: false, event_filters: [production, ...properties],
});
const cohort = (name, description, values) => ({
    name, description, is_static: false,
    filters: { filterTestAccounts: true, properties: { type: 'AND', values } },
});
const newNote = () => event('note_saved', property('operation', 'new'));
const returningReview = () => event('review_completed',
    property('is_first_review_for_note', 'true'), property('note_saved_on_previous_visit', 'true'));

export const manifest = {
    version: 1,
    target: { appHost: 'https://eu.posthog.com', projectId: '260159', projectName: 'Plastic Brains' },
    dashboard: {
        name: 'Plastic Brains — meaningful use',
        description: 'Opted-in production users only. Project internal/test filters apply. These measures describe product use, not clinical outcomes or all customers. Windows differ by tile; recent funnel entrants and retention cohorts have incomplete follow-up. Billing records remain authoritative for subscriber totals.',
    },
    insights: [
        {
            name: 'Onboarding completion',
            description: 'Unique people who viewed Welcome in the last 180 days → subscription preview → completed onboarding, ordered within 14 days. Denominator: observed Welcome viewers. Late opt-in omits earlier steps; recent entrants remain immature. Optional-path detail is outside this primary funnel.',
            query: funnel([
                event('onboarding_step_viewed', property('step', 'welcome')),
                event('onboarding_step_viewed', property('step', 'subscription_preview')),
                event('onboarding_completed'),
            ], 14, 'day'),
        },
        {
            name: 'Checkout reliability',
            description: 'Unique people starting a purchase in the last 180 days → purchased client result within 1 hour. Denominator: observed purchase starters; multiple attempts by one person are not an attempt-level success rate. Cancelled/pending/failed and restore outcomes remain separate events for investigation. This is checkout UX, not verified subscription conversion.',
            query: funnel([
                event('checkout_started', property('operation', 'purchase')),
                event('checkout_result', property('operation', 'purchase'), property('outcome', 'purchased')),
            ], 1, 'hour'),
        },
        {
            name: 'First meaningful return',
            description: 'Unique people saving a new note in the last 180 days → a first review of a note known locally to have been saved on a previous visit, within 60 days. Denominator: observed new-note savers. The second event proves its own note provenance; this person funnel cannot join that note to a particular first-step note. Do not compare recent entrants with cohorts given a full 60 days.',
            query: funnel([newNote(), returningReview()], 60, 'day'),
        },
        {
            name: 'Repeat meaningful use',
            description: 'Weekly unique people performing a new note save OR a completed review, over the rolling last 60 days. One person performing both actions counts once in each weekly bucket. This is an active-person count, with no all-customer denominator; first/last calendar buckets can be partial. It is not a rolling 60-day unique-person sum.',
            query: { kind: 'InsightVizNode', source: {
                ...base(60), kind: 'TrendsQuery', interval: 'week',
                series: [{ ...group('New note OR completed review', [newNote(), event('review_completed')]), math: 'dau' }],
                trendsFilter: { display: 'ActionsLineGraph', showLegend: true },
            } },
        },
        {
            name: 'Meaningful return retention',
            description: 'Weekly recurring retention over the last 180 days, with 9 intervals (start week plus 8 subsequent weeks, about 60 days). Each row denominator is all observed people saving a new note in that start week, including those who never return. Return event: completed review. Compare only equally mature cells. This is event-based product retention, not eligible-therapy-cycle retention or attendance.',
            query: { kind: 'InsightVizNode', source: {
                ...base(180), kind: 'RetentionQuery', retentionFilter: {
                    targetEntity: { type: 'events', id: 'note_saved', properties: [property('operation', 'new')] },
                    returningEntity: { type: 'events', id: 'review_completed' },
                    period: 'Week', totalIntervals: 9, retentionType: 'retention_recurring',
                    retentionReference: 'total', cumulative: false, timeWindowMode: 'strict_calendar_dates',
                },
            } },
        },
        {
            name: 'Notification follow-through',
            description: 'Unique people opening a notification in the last 180 days → intentionally opening a note OR completing a review within 30 minutes. Denominator: observed notification openers, broken down by reminder_kind on step 1. This excludes deliveries/due reminders and new-note composer saves; log_note and review_note paths can differ. Association is not proof of causation.',
            query: funnel([
                event('notification_opened'),
                group('Opened note OR completed review', [event('note_opened'), event('review_completed')]),
            ], 30, 'minute', {
                funnelsFilter: { breakdownAttributionType: 'step', breakdownAttributionValue: 0 },
                breakdownFilter: { breakdown_type: 'event', breakdown: 'reminder_kind' },
            }),
        },
        {
            name: 'Important failures',
            description: 'Total critical_action_failed events over the last 60 days by operation and normalized error code. This is failure volume, not a rate: compare each operation with its appropriate successful-action/attempt volume separately. Repeated failures by one person count separately; no free-text error payloads are used.',
            query: { kind: 'InsightVizNode', source: {
                ...base(60), kind: 'TrendsQuery', interval: 'week',
                series: [{ ...event('critical_action_failed'), math: 'total' }],
                breakdownFilter: { breakdowns: [{ property: 'operation', type: 'event' }, { property: 'error_code', type: 'event' }] },
                trendsFilter: { display: 'ActionsTable', showLegend: true },
            } },
        },
    ],
    cohorts: [
        cohort('Power users — 60 days',
            'Opted-in production people with at least 2 new-note saves AND at least 4 completed reviews during the last 60 days. Project internal/test exclusions apply. Initial product-use threshold to tune; not therapeutic success.',
            [behavior('note_saved', 2, property('operation', 'new')), behavior('review_completed', 4)]),
        cohort('Activated — 60 days',
            'Opted-in production people with at least one completed review in the last 60 days where is_first_review_for_note and note_saved_on_previous_visit are both true. Bounded local provenance undercounts cross-device/reinstalled histories; not first-ever lifetime activation.',
            [behavior('review_completed', 1, property('is_first_review_for_note', 'true'), property('note_saved_on_previous_visit', 'true'))]),
    ],
};
