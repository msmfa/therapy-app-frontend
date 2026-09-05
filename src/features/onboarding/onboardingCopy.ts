/**
 * Every user-facing string in the onboarding flow, in one place.
 *
 * Screens read from here rather than inlining copy, so wording can be reviewed
 * and localised without touching layout. British English, sentence case, no
 * exclamation marks. Anything with a date, time or price is a function of the
 * value rather than a fixed string.
 */

import type {
    PlanId,
    SubscriptionTrial,
} from '../subscription/types';

export const ONBOARDING_QUESTION_COUNT = 4;

export const WELCOME_COPY = {
    headline: 'Get more from your therapy sessions.',
    body: 'A therapy journal that helps you remember what came up and prepare for your next session.',
    primaryCta: 'Build my plan',
    secondaryCta: 'I already have an account',
} as const;

export type GoalId = 'remember' | 'practise' | 'prepare' | 'habit';

export type GoalOption = {
    id: GoalId;
    label: string;
    /** The Subscription headline this goal leads to. */
    subscriptionHeadline: string;
};

export const GOAL_OPTIONS: GoalOption[] = [
    {
        id: 'practise',
        label: 'Put therapy insights into practice throughout the week',
        subscriptionHeadline: 'Put therapy insights into practice',
    },
    {
        id: 'prepare',
        label: 'Be better prepared for my next session',
        subscriptionHeadline: 'Feel prepared for your next session',
    },
    {
        id: 'habit',
        label: 'Track my progress over time',
        subscriptionHeadline: 'Track your progress over time',
    },
];

export const GOAL_COPY = {
    headline: 'What would help you get more from therapy?',
    supporting: 'Choose the outcome that matters most to you.',
    primaryCta: 'Continue',
} as const;

export const SESSION_DATE_COPY = {
    headline: 'When is your next session?',
    supporting: "We'll use it to time your first note and shape the reviews that follow.",
    dateLabel: 'Date',
    timeLabel: 'Time',
    validation: 'Choose a future therapy session.',
    rangeValidation: 'Choose a session within the next six months.',
    primaryCta: 'Continue',
    sampleCta: "I haven't booked it yet",
} as const;

export type CadenceId = 'weekly' | 'fortnightly' | 'monthly' | 'varies';

export type CadenceOption = {
    id: CadenceId;
    label: string;
};

/**
 * How the recurrence is actually stepped lives in sessionSeries.ts. A "days
 * between sessions" number was a second, worse source of truth: a month is not
 * 28 days, and the two answers drifted.
 */
export const CADENCE_OPTIONS: CadenceOption[] = [
    { id: 'weekly', label: 'Every week' },
    { id: 'fortnightly', label: 'Every two weeks' },
    { id: 'monthly', label: 'Once a month' },
    { id: 'varies', label: 'It varies' },
];

export const CADENCE_COPY = {
    headline: 'How often are your sessions?',
    supporting: 'This helps us space reviews across the real gap between sessions.',
    primaryCta: 'Choose reminder times',
} as const;

export const REMINDER_TIMES_COPY = {
    headline: 'Choose times that fit your routine',
    supporting:
		"We'll choose the useful days between sessions. You choose when morning and evening reviews feel manageable. You can update these in Settings at any time.",
    morningLabel: 'Morning reviews',
    morningHint: 'For revisiting a note after sleep',
    eveningLabel: 'Evening reviews',
    eveningHint: 'For returning to it later in the week',
    testimonial: {
        quote: "I like that the app keeps me accountable for reviewing my notes weekly. Makes me feel like I'm actually doing the work when I look back and see my week full of green bars.",
        name: 'Mark',
        role: 'Plastic Brains user',
    },
    primaryCta: 'See my plan',
} as const;

export const PLAN_COPY = {
    sampleHeadline: 'See how your plan could work',
    sampleBody:
        "This example shows how reminders can fit between sessions. Add your booked session later and we'll replace these dates with your real plan.",
    sampleVariableBody:
        "This example uses a one-week gap to show how reminders work. Add your booked sessions later and we'll use the real gap between them.",
    evidenceStatement:
        'The timing draws on research into memory consolidation, sleep, spaced retrieval and context reinstatement.',
    primaryCta: 'After your note',
} as const;

export const REVIEWS_PREVIEW_COPY = {
    headline: 'Why these times?',
    primaryCta: 'Your notes',
} as const;

export const planHeadline = (): string => 'Your custom plan';

export const samplePlanBody = (cadence: CadenceId | null): string =>
    cadence === 'varies' ? PLAN_COPY.sampleVariableBody : PLAN_COPY.sampleBody;

export const NOTE_PREVIEW_COPY = {
    headline: 'Your notes',
    researchLink: 'Why these five questions?',
    privacyTitle: 'Your note stays yours',
    privacyBody:
		'The contents of your therapy notes are encrypted and stored only on this iPhone. They are never uploaded to our servers.',
    primaryCta: 'See plans',
} as const;

export const remainingQuestions = (shown: number, total: number): string => {
    const remaining = total - shown;
    return remaining === 1 ? '1 more question included' : `${remaining} more questions included`;
};

export const SUBSCRIPTION_COPY = {
    fallbackHeadline: 'Keep therapy with you between sessions',
    body: 'Keep the plan you just built—capture, revisit and prepare—around every therapy session.',
    planTitle: 'Your plan is ready',
    samplePlanTitle: 'Your sample plan is ready',
    samplePlanNote: 'Add your next session later and these example dates will be replaced with your real schedule.',
    nextSessionLabel: 'Next session',
    sampleSessionLabel: 'Example session',
    firstNoteLabel: 'First note',
    reviewTimesLabel: 'Review times',
    testimonial: {
        quote: 'As a therapist who has my own therapist, I wouldn’t have thought I would benefit from something like this. But with such a high caseload, it really helps me feel ready for my own therapy sessions.',
        name: 'Catherine',
        role: 'CBT therapist',
    },
    annualCta: 'Continue with annual',
    monthlyCta: 'Continue with monthly',
    annualTitle: 'Annual',
    annualBadge: 'Best value',
    annualRenewal: 'Renews annually until cancelled.',
    // Shown instead when Apple reports the user cannot have the trial, so the
    // first charge is not left implied.
    annualRenewalNoTrial: 'Billed today. Renews annually until cancelled.',
    monthlyTitle: 'Monthly',
    monthlyBadge: 'Flexible',
    monthlyRenewal: 'Renews monthly until cancelled.',
    monthlyRenewalNoTrial: 'Billed today. Renews monthly until cancelled.',
    planHeader: 'Your plan',
    annualDescription: 'Notes, reviews, reminders and more',
    monthlyDescription: 'The same plan, month by month',
    trialCta: 'Start your free trial',
    cancelAnytime: 'Cancel anytime',
    trialTodayLabel: 'Today',
    trialTodayBody: 'Full access begins',
    trialCancelNote: 'Cancel anytime in your Apple ID subscription settings.',
    restore: 'Restore purchases',
    restoring: 'Restoring…',
    terms: 'Terms',
    privacy: 'Privacy',
    unavailableHeadline: "We can't load subscriptions right now",
    unavailableBody: 'Check your connection and try again.',
    unavailableCta: 'Try again',
} as const;

const planBillingPeriod = (plan: PlanId): 'year' | 'month' =>
    plan === 'annual' ? 'year' : 'month';

const trialDurationLine = (trial: SubscriptionTrial): string =>
    `${trial.periods} ${trial.period}${trial.periods === 1 ? '' : 's'}`;

/** The purchase button when no trial is on offer; a trial uses `trialCta`. */
export const planCtaLabel = (plan: PlanId): string =>
    plan === 'annual' ? SUBSCRIPTION_COPY.annualCta : SUBSCRIPTION_COPY.monthlyCta;

/** A plain-language headline for whichever trial the selected plan carries. */
export const trialHeadline = (trial: SubscriptionTrial): string =>
    trial.periods === 1
        ? `Your first ${trial.period}'s on us`
        : `Your first ${trial.periods} ${trial.period}s are on us`;

export const planPriceLine = (plan: PlanId, price: string, showTrial: boolean): string =>
    `${showTrial ? 'Then ' : ''}${price} per ${planBillingPeriod(plan)}`;
export const trialBadgeLine = (trial: SubscriptionTrial): string =>
    `${trialDurationLine(trial)} free`;
export const monthlyEquivalentLine = (price: string): string => `${price} per month`;
/** "£79.99/year (that's £6.67/month)" for the featured card. */
export const cardPriceLine = (
    plan: PlanId,
    price: string,
    monthlyEquivalent: string | null,
): string => {
    const per = `${price}/${planBillingPeriod(plan)}`;
    return monthlyEquivalent === null
        ? per
        : `${per} (that's ${monthlyEquivalent}/month)`;
};

const trialLengthDays = (trial: SubscriptionTrial): number => {
    switch (trial.period) {
        case 'day': return trial.periods;
        case 'week': return trial.periods * 7;
        case 'month': return trial.periods * 30;
        case 'year': return trial.periods * 365;
    }
};

/** The three moments of the trial, phrased for the featured card. */
export const trialTimeline = (
    plan: PlanId,
    price: string,
    trial: SubscriptionTrial,
): { icon: 'unlock' | 'bell' | 'star'; text: string }[] => {
    const days = trialLengthDays(trial);
    return [
        { icon: 'unlock', text: 'Today: Start your free trial' },
        { icon: 'bell', text: `Day ${Math.max(days - 2, 1)}: Get a trial reminder` },
        { icon: 'star', text: `Day ${days}: You'll be charged ${price}/${planBillingPeriod(plan)}` },
    ];
};

export const trialEndLine = (plan: PlanId, price: string): string =>
    `Your ${plan} subscription begins at ${price} per ${planBillingPeriod(plan)} unless cancelled.`;

export const ACCOUNT_COPY = {
    headline: 'Save your between-session plan',
    body: 'Create an account to connect your schedule, reminder times and subscription. Your note contents still stay only on this iPhone.',
    authenticatedHeadline: 'Continue with your account',
    authenticatedBody: 'Your schedule, reminder times and subscription will be connected to your account. Your note contents still stay only on this iPhone.',
    continue: 'Continue',
    apple: 'Continue with Apple',
    email: 'Continue with email',
    existing: 'Already have an account? Sign in',
    legalPrefix: 'By continuing, you agree to the ',
    legalTerms: 'Terms of Service',
    legalMiddle: ' and acknowledge the ',
    legalPrivacy: 'Privacy Policy',
    legalSuffix: '.',
} as const;

export const PURCHASE_COPY = {
    continue: 'Continue',
    // Backing out is not a failure, so it does not borrow the error title.
    cancelledTitle: 'No subscription started',
    cancelled: "Your subscription wasn't started. Try again when you're ready.",
    pendingTitle: 'Purchase pending',
    pending: 'Apple is still processing this purchase. You can continue when it is approved.',
    errorTitle: "We couldn't start your subscription",
    errorBody: "You haven't been charged. Please try again.",
    errorPrimary: 'Try again',
    errorSecondary: 'Back to plans',
    unlinkedTitle: "We couldn't connect this subscription",
    unlinkedBody:
		'Apple completed the transaction, but it is not linked to this Plastic Brains account. Try Restore purchases from the original account. You will not be charged again for the same active subscription.',
    restoreEmpty: "We couldn't find an active subscription for this Apple ID.",
    restoreErrorTitle: "We couldn't restore purchases",
    restoreError: 'Check your connection and try again.',
    restoredTitle: 'Subscription restored',
    restored: 'Your subscription is active on this Apple ID.',
} as const;

export const NOTIFICATIONS_COPY = {
    body: 'Turn on notifications so your plan can reach you at the times you chose.',
    privacy: 'Notifications show the reminder, never anything you wrote.',
    primaryCta: 'Turn on notifications',
    secondaryCta: 'Not now',
    deniedHeadline: 'Turn on notifications in Settings',
    deniedBody:
		"Notifications are currently off. You can enable them in iPhone Settings when you're ready.",
    deniedPrimaryCta: 'Open Settings',
    registrationErrorTitle: "We couldn't turn on notifications",
    registrationErrorBody: 'Check your connection and try again, or choose Not now.',
} as const;

export const notificationsHeadline = (weekday: string, time: string): string =>
    `Get your first note reminder ${weekday} at ${time}`;

export const SUCCESS_COPY = {
    headline: 'Your between-session plan is ready',
    withoutRemindersBody: 'Save it now. You can turn on notifications later in Settings.',
    primaryCta: 'Save and see my plan',
    sampleHeadline: 'Your sample plan is ready',
    sampleBody:
        "Save your preferences now. Add your next session in Calendar and we'll build the real plan around it.",
    samplePrimaryCta: 'Save and add my session',
} as const;

export const successBody = (weekday: string, time: string): string =>
    `Save it now and your first note reminder will arrive ${weekday} at ${time}.`;

/**
 * Which Success wording is true.
 *
 * Keyed on whether notification delivery is ready (permission plus a registered
 * push token), never on permission alone. The session plan is written when the
 * user taps the final CTA, so this copy deliberately describes what will happen
 * after that save instead of claiming the reminder already exists.
 */
export const successCopy = (
    reminderScheduled: boolean,
    weekday: string,
    time: string,
): { headline: string; body: string } =>
    reminderScheduled
        ? { headline: SUCCESS_COPY.headline, body: successBody(weekday, time) }
        : {
            headline: SUCCESS_COPY.headline,
            body: SUCCESS_COPY.withoutRemindersBody,
        };

/** A plan's billing line, which must make an immediate first charge explicit. */
export const planRenewalLine = (plan: PlanId, showTrial: boolean): string => {
    if (plan === 'annual') {
        return showTrial
            ? SUBSCRIPTION_COPY.annualRenewal
            : SUBSCRIPTION_COPY.annualRenewalNoTrial;
    }

    return showTrial
        ? SUBSCRIPTION_COPY.monthlyRenewal
        : SUBSCRIPTION_COPY.monthlyRenewalNoTrial;
};

export const ERROR_COPY = {
    saveTitle: "We couldn't save your plan",
    saveBody: 'Your answers are still here. Please try again.',
    offlineTitle: "You're offline",
    offlineBody: 'Reconnect to continue setting up your plan.',
    signInTitle: 'Sign in to save your plan',
    signInBody: 'Your answers are still here. Sign in to finish setting up.',
    signInCta: 'Continue',
    unexpectedTitle: 'Something went wrong',
    unexpectedBody: 'Your answers are still here. Please try again.',
    retryCta: 'Try again',
} as const;
