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
    // The screen's whole text. One display line rather than a heading over a
    // sentence: what the app is, said once, with nothing to read past it.
    headline: 'A therapy journal that reminds you to review your therapy notes',
    primaryCta: 'Build my plan',
    secondaryCta: 'I already have an account',
} as const;

export type GoalId = 'remember' | 'practise' | 'prepare' | 'habit';

export type GoalOption = {
    id: GoalId;
    label: string;
    /** The Subscription headline this goal leads to. */
    subscriptionHeadline: string;
    /**
     * The same goal in the second person, for screens that say it back.
     *
     * The option itself is worded as the user choosing it - "my next session" -
     * which is right on the question and wrong everywhere the app repeats the
     * answer to them.
     */
    restated: string;
    /**
     * Two lines on the notes screen saying what the notes do for this goal.
     * Two, not more: the card sits above the artwork it is describing, and
     * every extra line pushes that artwork off the screen.
     *
     * The screen shows the goal back as a heading, so this is the part that
     * has to earn it: what the notes and their reviews actually do for the
     * thing the user said they wanted.
     */
    noteSupport: string;
};

export const GOAL_OPTIONS: GoalOption[] = [
    {
        id: 'practise',
        label: 'Put therapy insights into practice',
        subscriptionHeadline: 'Put therapy insights into practice',
        restated: 'Put therapy insights into practice',
        noteSupport:
            'Notifications between sessions help you put into practice what you discussed in your last session.',
    },
    {
        id: 'prepare',
        label: 'Be better prepared for my next session',
        subscriptionHeadline: 'Feel prepared for your next session',
        restated: 'Be better prepared for your next session',
        noteSupport:
            "The evening before your next session you'll be notified to review your last note.",
    },
    {
        id: 'habit',
        label: 'Track my progress over time',
        subscriptionHeadline: 'Track your progress over time',
        restated: 'Track your progress over time',
        noteSupport:
            "Reflect on your logged notes from weeks and months ago to see which areas you're improving in and which you want to work on.",
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
    supporting: 'This allows us to tell the best times to send you your reminders.',
    primaryCta: 'Choose reminder times',
} as const;

export const REMINDER_TIMES_COPY = {
    headline: 'Choose times that fit your routine',
    supporting: "You'll only receive one morning reminder a week, after your session.",
    morningLabel: 'Morning reviews',
    eveningLabel: 'Evening reviews',
    testimonial: {
        quote: 'I like the reminder before my next session. I used to find it hard to think about what to talk about then I’d leave the session and finally remember things I wanted to bring up. With the pre-session reminder I just pick up from where I left off.',
        name: 'Sarah',
        role: 'Plastic Brains User',
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
        'These times come from research into memory consolidation, sleep, spaced retrieval and context reinstatement.',
    primaryCta: 'After your note',
} as const;

export const REVIEWS_PREVIEW_COPY = {
    headline: 'Your Custom Reminders',
    /**
     * Reviews live inside the gap between two sessions, so a schedule that
     * varies, or one we have not been told about yet, produces no dated reviews
     * at all. The screen shows a one-week example rather than nothing, and says
     * plainly that the dates are not yet the user's own.
     */
    exampleGapNote:
        "These dates use a one-week gap as an example. Once we know when your following session is, your reviews will move to the real gap between them.",
    sampleNote:
        "These dates come from the example session in your sample plan. Add your next session later and we'll replace them with your real schedule.",
    primaryCta: 'Your notes',
} as const;

export const planHeadline = (): string => 'Your custom plan';

/**
 * Each goal as the end of the sentence "what you told us matters most: ...".
 *
 * `remember` is not one of the three options offered any more, but a draft
 * saved before it was dropped still carries it, so it keeps its line.
 */
const GOAL_PRIORITY: Record<GoalId, string> = {
    remember: 'remembering what came up in your sessions',
    practise: 'putting what comes up in therapy into practice through the week',
    prepare: 'walking into your next session feeling prepared',
    habit: 'seeing your progress build up over time',
};

/**
 * Why the reviews land where they do.
 *
 * Two reasons, and the screen owes the user both: the research the schedule is
 * built on, and the answer they gave about what they wanted out of it. Without
 * the second the times read as the same plan everybody gets. The goal is the
 * one answer that shifts what the reviews are for, so it is the one named.
 */
export const evidenceStatement = (goal: GoalId | null): string =>
    goal === null
        ? PLAN_COPY.evidenceStatement
        : `${PLAN_COPY.evidenceStatement} They are also shaped by what you told us matters most: ${GOAL_PRIORITY[goal]}.`;

export const samplePlanBody = (cadence: CadenceId | null): string =>
    cadence === 'varies' ? PLAN_COPY.sampleVariableBody : PLAN_COPY.sampleBody;

/**
 * The goal the user chose, said back to them with what the notes do for it.
 *
 * The notes screen shows this rather than a list of every answer: the goal is
 * the one answer that says why they are here, and reading three of their own
 * answers back was a receipt rather than a reason.
 */
export const goalSupport = (goal: GoalId | null): GoalOption | null =>
    GOAL_OPTIONS.find((option) => option.id === goal) ?? null;

export const NOTE_PREVIEW_COPY = {
    headline: 'Your notes',
    researchLink: 'Why these five questions?',
    privacyTitle: 'Your note stays yours',
    privacyBody:
		'The contents of your therapy notes are encrypted and stored only on this iPhone. They are never uploaded to our servers.',
    // The notification shown landing over the notes when the goal is the
    // next session: the reminder that arrives the evening before it.
    reminderTitle: 'Plastic Brains',
    reminderBody: "Review your notes before tomorrow's session",
    reminderTime: 'now',
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

export const planBillingPeriod = (plan: PlanId): 'year' | 'month' =>
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

/** Trial access and billing, phrased for the featured card. */
export const trialTimeline = (
    plan: PlanId,
    price: string,
    trial: SubscriptionTrial,
): { icon: 'unlock' | 'star'; text: string }[] => {
    const days = trialLengthDays(trial);
    return [
        { icon: 'unlock', text: 'Today: Start your free trial' },
        { icon: 'star', text: `Day ${days}: You'll be charged ${price}/${planBillingPeriod(plan)}` },
    ];
};

export const trialEndLine = (plan: PlanId, price: string): string =>
    `Your ${plan} subscription begins at ${price} per ${planBillingPeriod(plan)} unless cancelled.`;

export const ACCOUNT_COPY = {
    // The screen's name, shown beside the back arrow. What the step is for is
    // said in the body underneath, which is where a sentence belongs.
    headline: 'Account',
    body: 'Create an account to connect your schedule, reminder times and subscription. Your note contents still stay only on this iPhone.',
    authenticatedBody: 'Your schedule, reminder times and subscription will be connected to your account. Your note contents still stay only on this iPhone.',
    continue: 'Continue',
    apple: 'Continue with Apple',
    email: 'Continue with email',
    // The three things the body says the account connects, shown back as
    // they were answered, so the promise is concrete rather than a sentence.
    sessionLabel: 'Next session',
    noSession: 'Add your next session in Calendar',
    remindersLabel: 'Reminder times',
    subscriptionLabel: 'Subscription',
    subscriptionActive: 'Already active',
    cancelAnytime: 'You can cancel at any time through Apple subscriptions.',
    // The sentence introduces the links and does not repeat their names: the
    // two documents are their own targets underneath, and naming them twice
    // read as a list of four.
    legalIntro: 'By continuing, you agree to:',
    legalTerms: 'Terms of Service',
    legalPrivacy: 'Privacy Policy',
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
