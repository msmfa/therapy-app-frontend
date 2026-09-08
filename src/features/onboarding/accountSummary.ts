import type { OnboardingAnswers } from './OnboardingAnswersContext';
import type { PlanId, SubscriptionOfferState } from '../subscription/types';
import {
    ACCOUNT_COPY,
    CADENCE_OPTIONS,
    planBillingPeriod,
    SUBSCRIPTION_COPY,
    trialBadgeLine,
} from './onboardingCopy';
import { dateTimeLabel, minutesToDate, timeLabel } from './formatting';

export type AccountSummaryRow = {
    label: string;
    value: string;
    /** A line under the value, part of the same section. */
    note?: string;
};

type ScheduleAnswers = Pick<OnboardingAnswers, 'sessionAt' | 'cadence'>;
type ReminderAnswers = Pick<OnboardingAnswers, 'morningMinutes' | 'eveningMinutes'>;

/** "Every week, from Tue 14 Sep, 18:00", or just the date when the gap varies. */
export const accountSessionLine = ({ sessionAt, cadence }: ScheduleAnswers): string => {
    if (sessionAt === null) return ACCOUNT_COPY.noSession;
    const when = dateTimeLabel(sessionAt);
    const option = CADENCE_OPTIONS.find((candidate) => candidate.id === cadence);
    return option === undefined || option.id === 'varies' ? when : `${option.label}, from ${when}`;
};

/** "07:30 and 20:00", in the device's clock convention. */
export const accountRemindersLine = ({ morningMinutes, eveningMinutes }: ReminderAnswers): string =>
    `${timeLabel(minutesToDate(morningMinutes))} and ${timeLabel(minutesToDate(eveningMinutes))}`;

const planTitle = (plan: PlanId): string =>
    plan === 'annual' ? SUBSCRIPTION_COPY.annualTitle : SUBSCRIPTION_COPY.monthlyTitle;

const trialFor = (plan: PlanId, offer: SubscriptionOfferState) =>
    offer.status === 'ready' && offer.offer.trialEligible ? offer.offer[plan].trial : null;

/**
 * "Annual, 2 weeks free then £39.99/year".
 *
 * The price is the store's own, as on the plans screen; while the store is
 * still answering, or cannot, the row names the plan and no more, rather than
 * a figure the app made up.
 */
export const accountSubscriptionLine = (
    plan: PlanId,
    offer: SubscriptionOfferState,
    alreadyActive: boolean,
): string => {
    const title = planTitle(plan);
    // A restore may have activated a different plan from the last selection.
    // The selection alone cannot name an existing subscription.
    if (alreadyActive) return ACCOUNT_COPY.subscriptionActive;
    if (offer.status !== 'ready') return title;

    const price = `${offer.offer[plan].price}/${planBillingPeriod(plan)}`;
    const trial = trialFor(plan, offer);
    return trial === null ? `${title}, ${price}` : `${title}, ${trialBadgeLine(trial)} then ${price}`;
};

/**
 * What happens the moment after the button: Apple's purchase sheet.
 *
 * Nothing on the screen otherwise says that signing in leads straight to a
 * payment step, and a sheet asking for money is not something to spring on
 * someone who thought they were only creating an account.
 */
export const accountNextStep = (
    answers: Pick<OnboardingAnswers, 'plan' | 'entitlementConfirmedThisSession'>,
    offer: SubscriptionOfferState,
    signedIn: boolean,
    alreadyActive = answers.entitlementConfirmedThisSession,
): string => {
    if (alreadyActive) {
        return `Your subscription is already active, so there is nothing to confirm. ${ACCOUNT_COPY.cancelAnytime}`;
    }
    const trial = trialFor(answers.plan, offer) !== null;
    const lead = signedIn ? 'When you continue' : 'After you sign in';
    return trial
        ? `${lead}, Apple will ask you to confirm your free trial. You won't be charged today. ${ACCOUNT_COPY.cancelAnytime}`
        : `${lead}, Apple will ask you to confirm your subscription. ${ACCOUNT_COPY.cancelAnytime}`;
};

export const accountSummaryRows = (
    answers: OnboardingAnswers,
    offer: SubscriptionOfferState,
    signedIn: boolean,
    alreadyActive = answers.entitlementConfirmedThisSession,
): AccountSummaryRow[] => [
    { label: ACCOUNT_COPY.sessionLabel, value: accountSessionLine(answers) },
    { label: ACCOUNT_COPY.remindersLabel, value: accountRemindersLine(answers) },
    {
        label: ACCOUNT_COPY.subscriptionLabel,
        value: accountSubscriptionLine(answers.plan, offer, alreadyActive),
        // What Apple does next belongs to the subscription, not to the slip
        // as a whole.
        note: accountNextStep(answers, offer, signedIn, alreadyActive),
    },
];
