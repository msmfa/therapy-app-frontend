/**
 * Every user-facing string in the onboarding flow, in one place.
 *
 * Screens read from here rather than inlining copy, so wording can be reviewed
 * without touching layout. Anything with a date, time or price is a function of
 * the value rather than a fixed string.
 *
 * The constants this module used to export became functions when the app gained
 * a second language. An object literal here is evaluated at import time, which
 * is before the stored language preference has been read, so every screen would
 * have been fixed in the device's language for the life of the process and
 * would not have followed a change of setting. Calling `t` per read costs
 * nothing measurable and removes the ordering problem entirely.
 */

import type {
    PlanId,
    SubscriptionTrial,
} from '../subscription/types';
import { t } from '../../i18n/translate';

export const ONBOARDING_QUESTION_COUNT = 4;

export const welcomeCopy = () => ({
    // The screen's whole text. One display line rather than a heading over a
    // sentence: what the app is, said once, with nothing to read past it.
    headline: t('onboarding:welcome.headline'),
    primaryCta: t('onboarding:welcome.primaryCta'),
    secondaryCta: t('onboarding:welcome.secondaryCta'),
});

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
     */
    noteSupport: string;
};

/** The goals actually offered, in the order they are shown. */
const OFFERED_GOALS = ['practise', 'prepare', 'habit'] as const;

export const goalOptions = (): GoalOption[] =>
    OFFERED_GOALS.map((id) => ({
        id,
        label: t(`onboarding:goalOption.${id}.label`),
        subscriptionHeadline: t(`onboarding:goalOption.${id}.subscriptionHeadline`),
        restated: t(`onboarding:goalOption.${id}.restated`),
        noteSupport: t(`onboarding:goalOption.${id}.noteSupport`),
    }));

export const goalCopy = () => ({
    headline: t('onboarding:goal.headline'),
    supporting: t('onboarding:goal.supporting'),
    primaryCta: t('onboarding:goal.primaryCta'),
});

export const sessionDateCopy = () => ({
    headline: t('onboarding:sessionDate.headline'),
    supporting: t('onboarding:sessionDate.supporting'),
    dateLabel: t('onboarding:sessionDate.dateLabel'),
    timeLabel: t('onboarding:sessionDate.timeLabel'),
    validation: t('onboarding:sessionDate.validation'),
    rangeValidation: t('onboarding:sessionDate.rangeValidation'),
    primaryCta: t('onboarding:sessionDate.primaryCta'),
    sampleCta: t('onboarding:sessionDate.sampleCta'),
});

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
const CADENCE_IDS = ['weekly', 'fortnightly', 'monthly', 'varies'] as const;

export const cadenceOptions = (): CadenceOption[] =>
    CADENCE_IDS.map((id) => ({ id, label: t(`onboarding:cadenceOption.${id}`) }));

export const cadenceCopy = () => ({
    headline: t('onboarding:cadence.headline'),
    supporting: t('onboarding:cadence.supporting'),
    primaryCta: t('onboarding:cadence.primaryCta'),
});

/**
 * Whose words the reminder-times screen carries.
 *
 * One testimonial for each goal on offer, so the person speaking is someone
 * who wanted what this user said they wanted. A general endorsement of the app
 * asks the reader to do the translating themselves.
 *
 * `remember` is a retired goal that older drafts can still hold, and a draft
 * resumed before the first question has no goal at all. Both fall back to the
 * preparation quote, which is the one the screen carried for everybody before
 * the three existed.
 */
const TESTIMONIAL_GOALS = ['practise', 'prepare', 'habit'] as const;

type TestimonialGoal = (typeof TESTIMONIAL_GOALS)[number];

const testimonialGoal = (goal: GoalId | null): TestimonialGoal =>
    TESTIMONIAL_GOALS.includes(goal as TestimonialGoal) ? (goal as TestimonialGoal) : 'prepare';

export const reminderTimesCopy = (goal: GoalId | null = null) => ({
    headline: t('onboarding:reminderTimes.headline'),
    supporting: t('onboarding:reminderTimes.supporting'),
    morningLabel: t('onboarding:reminderTimes.morningLabel'),
    eveningLabel: t('onboarding:reminderTimes.eveningLabel'),
    testimonial: {
        quote: t(`onboarding:reminderTimes.testimonial.${testimonialGoal(goal)}.quote`),
        name: t(`onboarding:reminderTimes.testimonial.${testimonialGoal(goal)}.name`),
        role: t(`onboarding:reminderTimes.testimonial.${testimonialGoal(goal)}.role`),
    },
    primaryCta: t('onboarding:reminderTimes.primaryCta'),
});

export const planCopy = () => ({
    sampleHeadline: t('onboarding:plan.sampleHeadline'),
    sampleBody: t('onboarding:plan.sampleBody'),
    sampleVariableBody: t('onboarding:plan.sampleVariableBody'),
    evidenceStatement: t('onboarding:plan.evidenceStatement'),
    primaryCta: t('onboarding:plan.primaryCta'),
});

export const reviewsPreviewCopy = () => ({
    headline: t('onboarding:reviewsPreview.headline'),
    /** What the step before this one leads to, said before the reasoning. */
    intro: t('onboarding:reviewsPreview.intro'),
    /** What the next screen holds, and that each reminder on it opens its own reasoning. */
    nextPage: t('onboarding:reviewsPreview.nextPage'),
    primaryCta: t('onboarding:reviewsPreview.primaryCta'),
});

/** The cheat sheet on its own screen, between the plan and the reminders. */
export const noteTemplateCopy = () => ({
    headline: t('onboarding:noteTemplate.headline'),
    /** The prompt drawn over the sheet, at the head of the arrow. */
    tapHint: t('onboarding:noteTemplate.tapHint'),
    /** What pressing the sheet does, for a reader who cannot see the arrow. */
    openSheet: t('onboarding:noteTemplate.openSheet'),
    primaryCta: t('onboarding:noteTemplate.primaryCta'),
});

export const reviewScheduleCopy = () => ({
    headline: t('onboarding:reviewSchedule.headline'),
    /**
     * Reviews live inside the gap between two sessions, so a schedule that
     * varies, or one we have not been told about yet, produces no dated reviews
     * at all. The screen shows a one-week example rather than nothing.
     */
    exampleGapNote: t('onboarding:reviewSchedule.exampleGapNote'),
    sampleNote: t('onboarding:reviewSchedule.sampleNote'),
    primaryCta: t('onboarding:reviewSchedule.primaryCta'),
});

export const planHeadline = (): string => t('onboarding:plan.headline');

/**
 * Why the reviews land where they do.
 *
 * Two reasons, and the screen owes the user both: the research the schedule is
 * built on, and the answer they gave about what they wanted out of it. Without
 * the second the times read as the same plan everybody gets.
 *
 * One key per shape rather than two sentences glued together, so a translator
 * can decide where the goal belongs in the sentence.
 */
/**
 * The evidence line, with the goal inside it named separately.
 *
 * The screen marks the goal in bold where it falls in the sentence, which
 * needs the phrase on its own as well as the sentence it was interpolated
 * into. `goal` is null only for a draft that somehow reached this screen
 * without answering the first question, where the line has no goal in it.
 */
export const evidenceParts = (goal: GoalId | null): { statement: string; priority: string | null } => ({
    statement: evidenceStatement(goal),
    priority: goal === null ? null : t(`onboarding:goalPriority.${goal}`),
});

export const evidenceStatement = (goal: GoalId | null): string =>
    goal === null
        ? t('onboarding:plan.evidenceStatement')
        : t('onboarding:plan.evidenceStatementWithGoal', {
            priority: t(`onboarding:goalPriority.${goal}`),
        });

export const samplePlanBody = (cadence: CadenceId | null): string =>
    cadence === 'varies'
        ? t('onboarding:plan.sampleVariableBody')
        : t('onboarding:plan.sampleBody');

/**
 * The goal the user chose, said back to them with what the notes do for it.
 *
 * `remember` is not one of the options offered any more, but a draft saved
 * before it was dropped can still carry it, so an unknown goal yields null
 * rather than throwing.
 */
export const goalSupport = (goal: GoalId | null): GoalOption | null =>
    goalOptions().find((option) => option.id === goal) ?? null;

export const notePreviewCopy = () => ({
    headline: t('onboarding:notePreview.headline'),
    researchLink: t('onboarding:notePreview.researchLink'),
    privacyTitle: t('onboarding:notePreview.privacyTitle'),
    privacyBody: t('onboarding:notePreview.privacyBody'),
    // The notification shown landing over the notes when the goal is the
    // next session: the reminder that arrives the evening before it.
    reminderTitle: t('onboarding:notePreview.reminderTitle'),
    reminderBody: t('onboarding:notePreview.reminderBody'),
    reminderTime: t('onboarding:notePreview.reminderTime'),
    primaryCta: t('onboarding:notePreview.primaryCta'),
});

export const remainingQuestions = (shown: number, total: number): string =>
    t('onboarding:remainingQuestions', { count: total - shown });

export const subscriptionCopy = () => ({
    fallbackHeadline: t('onboarding:subscription.fallbackHeadline'),
    body: t('onboarding:subscription.body'),
    planTitle: t('onboarding:subscription.planTitle'),
    samplePlanTitle: t('onboarding:subscription.samplePlanTitle'),
    samplePlanNote: t('onboarding:subscription.samplePlanNote'),
    nextSessionLabel: t('onboarding:subscription.nextSessionLabel'),
    sampleSessionLabel: t('onboarding:subscription.sampleSessionLabel'),
    firstNoteLabel: t('onboarding:subscription.firstNoteLabel'),
    reviewTimesLabel: t('onboarding:subscription.reviewTimesLabel'),
    testimonial: {
        quote: t('onboarding:subscription.quote'),
        name: t('onboarding:subscription.quoteName'),
        role: t('onboarding:subscription.quoteRole'),
    },
    annualCta: t('onboarding:subscription.annualCta'),
    monthlyCta: t('onboarding:subscription.monthlyCta'),
    annualTitle: t('onboarding:subscription.annualTitle'),
    annualRenewal: t('onboarding:subscription.annualRenewal'),
    // Shown instead when Apple reports the user cannot have the trial, so the
    // first charge is not left implied.
    annualRenewalNoTrial: t('onboarding:subscription.annualRenewalNoTrial'),
    monthlyTitle: t('onboarding:subscription.monthlyTitle'),
    monthlyBadge: t('onboarding:subscription.monthlyBadge'),
    monthlyRenewal: t('onboarding:subscription.monthlyRenewal'),
    monthlyRenewalNoTrial: t('onboarding:subscription.monthlyRenewalNoTrial'),
    planHeader: t('onboarding:subscription.planHeader'),
    annualDescription: t('onboarding:subscription.annualDescription'),
    monthlyDescription: t('onboarding:subscription.monthlyDescription'),
    trialCta: t('onboarding:subscription.trialCta'),
    cancelAnytime: t('onboarding:subscription.cancelAnytime'),
    trialTodayLabel: t('onboarding:subscription.trialTodayLabel'),
    trialTodayBody: t('onboarding:subscription.trialTodayBody'),
    trialCancelNote: t('onboarding:subscription.trialCancelNote'),
    restore: t('onboarding:subscription.restore'),
    restoring: t('onboarding:subscription.restoring'),
    terms: t('onboarding:subscription.terms'),
    privacy: t('onboarding:subscription.privacy'),
    unavailableHeadline: t('onboarding:subscription.unavailableHeadline'),
    unavailableBody: t('onboarding:subscription.unavailableBody'),
    unavailableCta: t('onboarding:subscription.unavailableCta'),
});

export const planBillingPeriod = (plan: PlanId): 'year' | 'month' =>
    plan === 'annual' ? 'year' : 'month';

/** The purchase button when no trial is on offer; a trial uses `trialCta`. */
export const planCtaLabel = (plan: PlanId): string =>
    plan === 'annual'
        ? t('onboarding:subscription.annualCta')
        : t('onboarding:subscription.monthlyCta');

/** A plain-language headline for whichever trial the selected plan carries. */
export const trialHeadline = (trial: SubscriptionTrial): string =>
    t('onboarding:subscription.trialHeadline', {
        count: trial.periods,
        context: trial.period,
    });

export const planPriceLine = (plan: PlanId, price: string, showTrial: boolean): string =>
    showTrial
        ? t('onboarding:subscription.priceLineThen', { price, context: planBillingPeriod(plan) })
        : t('onboarding:subscription.priceLine', { price, context: planBillingPeriod(plan) });

/**
 * "3 weeks free", as one phrase rather than a duration dropped into a frame.
 *
 * Composing it from a "3 weeks" sub-string and a separate "{{duration}} free"
 * wrapper is what an English speaker reaches for, and it produced "3 semaines
 * offert" on device: the adjective has to agree with a noun that is inside the
 * other half. Context on the period plus a plural on the count keeps the whole
 * phrase in one key, where a translator can inflect all of it.
 */
export const trialBadgeLine = (trial: SubscriptionTrial): string =>
    t('onboarding:subscription.trialBadge', {
        count: trial.periods,
        context: trial.period,
    });

export const monthlyEquivalentLine = (price: string): string =>
    t('onboarding:subscription.priceLine', { price, context: 'month' });

/** "£79.99/year (that's £6.67/month)" for the featured card. */
export const cardPriceLine = (
    plan: PlanId,
    price: string,
    monthlyEquivalent: string | null,
): string => {
    const per = t('onboarding:subscription.cardPrice', {
        price,
        context: planBillingPeriod(plan),
    });

    return monthlyEquivalent === null
        ? per
        : t('onboarding:subscription.cardPriceWithMonthly', { per, monthly: monthlyEquivalent });
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
): { icon: 'unlock' | 'star'; text: string }[] => [
    { icon: 'unlock', text: t('onboarding:subscription.trialTimelineToday') },
    {
        icon: 'star',
        text: t('onboarding:subscription.trialTimelineCharge', {
            day: trialLengthDays(trial),
            price: t('onboarding:subscription.cardPrice', {
                price,
                context: planBillingPeriod(plan),
            }),
        }),
    },
];

export const trialEndLine = (plan: PlanId, price: string): string =>
    t('onboarding:subscription.trialEndLine', {
        context: plan,
        price: t('onboarding:subscription.priceLine', {
            price,
            context: planBillingPeriod(plan),
        }),
    });

export const accountCopy = () => ({
    // The screen's name, shown beside the back arrow. What the step is for is
    // said in the body underneath, which is where a sentence belongs.
    headline: t('onboarding:account.headline'),
    body: t('onboarding:account.body'),
    authenticatedBody: t('onboarding:account.authenticatedBody'),
    continue: t('onboarding:account.continue'),
    apple: t('onboarding:account.apple'),
    email: t('onboarding:account.email'),
    // The three things the body says the account connects, shown back as
    // they were answered, so the promise is concrete rather than a sentence.
    sessionLabel: t('onboarding:account.sessionLabel'),
    noSession: t('onboarding:account.noSession'),
    remindersLabel: t('onboarding:account.remindersLabel'),
    subscriptionLabel: t('onboarding:account.subscriptionLabel'),
    subscriptionActive: t('onboarding:account.subscriptionActive'),
    cancelAnytime: t('onboarding:account.cancelAnytime'),
    legalIntro: t('onboarding:account.legalIntro'),
    legalTerms: t('onboarding:account.legalTerms'),
    legalPrivacy: t('onboarding:account.legalPrivacy'),
});

export const purchaseCopy = () => ({
    continue: t('onboarding:purchase.continue'),
    // Backing out is not a failure, so it does not borrow the error title.
    cancelledTitle: t('onboarding:purchase.cancelledTitle'),
    cancelled: t('onboarding:purchase.cancelled'),
    pendingTitle: t('onboarding:purchase.pendingTitle'),
    pending: t('onboarding:purchase.pending'),
    errorTitle: t('onboarding:purchase.errorTitle'),
    errorBody: t('onboarding:purchase.errorBody'),
    errorPrimary: t('onboarding:purchase.errorPrimary'),
    errorSecondary: t('onboarding:purchase.errorSecondary'),
    unlinkedTitle: t('onboarding:purchase.unlinkedTitle'),
    unlinkedBody: t('onboarding:purchase.unlinkedBody'),
    restoreEmpty: t('onboarding:purchase.restoreEmpty'),
    restoreErrorTitle: t('onboarding:purchase.restoreErrorTitle'),
    restoreError: t('onboarding:purchase.restoreError'),
    restoredTitle: t('onboarding:purchase.restoredTitle'),
    restored: t('onboarding:purchase.restored'),
});

export const notificationsCopy = () => ({
    body: t('onboarding:notifications.body'),
    privacy: t('onboarding:notifications.privacy'),
    primaryCta: t('onboarding:notifications.primaryCta'),
    secondaryCta: t('onboarding:notifications.secondaryCta'),
    deniedHeadline: t('onboarding:notifications.deniedHeadline'),
    deniedBody: t('onboarding:notifications.deniedBody'),
    deniedPrimaryCta: t('onboarding:notifications.deniedPrimaryCta'),
    registrationErrorTitle: t('onboarding:notifications.registrationErrorTitle'),
    registrationErrorBody: t('onboarding:notifications.registrationErrorBody'),
});

export const notificationsHeadline = (weekday: string, time: string): string =>
    t('onboarding:notifications.headline', { weekday, time });

export const successCopyStrings = () => ({
    headline: t('onboarding:success.headline'),
    withoutRemindersBody: t('onboarding:success.withoutRemindersBody'),
    primaryCta: t('onboarding:success.primaryCta'),
    sampleHeadline: t('onboarding:success.sampleHeadline'),
    sampleBody: t('onboarding:success.sampleBody'),
    samplePrimaryCta: t('onboarding:success.samplePrimaryCta'),
});

export const successBody = (weekday: string, time: string): string =>
    t('onboarding:success.body', { weekday, time });

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
): { headline: string; body: string } => ({
    headline: t('onboarding:success.headline'),
    body: reminderScheduled
        ? successBody(weekday, time)
        : t('onboarding:success.withoutRemindersBody'),
});

/** A plan's billing line, which must make an immediate first charge explicit. */
export const planRenewalLine = (plan: PlanId, showTrial: boolean): string => {
    if (plan === 'annual') {
        return showTrial
            ? t('onboarding:subscription.annualRenewal')
            : t('onboarding:subscription.annualRenewalNoTrial');
    }

    return showTrial
        ? t('onboarding:subscription.monthlyRenewal')
        : t('onboarding:subscription.monthlyRenewalNoTrial');
};

export const errorCopy = () => ({
    saveTitle: t('onboarding:error.saveTitle'),
    saveBody: t('onboarding:error.saveBody'),
    offlineTitle: t('onboarding:error.offlineTitle'),
    offlineBody: t('onboarding:error.offlineBody'),
    signInTitle: t('onboarding:error.signInTitle'),
    signInBody: t('onboarding:error.signInBody'),
    signInCta: t('onboarding:error.signInCta'),
    unexpectedTitle: t('onboarding:error.unexpectedTitle'),
    unexpectedBody: t('onboarding:error.unexpectedBody'),
    retryCta: t('onboarding:error.retryCta'),
});
