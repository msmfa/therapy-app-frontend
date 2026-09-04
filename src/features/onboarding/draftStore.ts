import * as SecureStore from 'expo-secure-store';
import { CADENCE_OPTIONS, GOAL_OPTIONS, type CadenceId, type GoalId } from './onboardingCopy';
import type { PlanId } from '../subscription/types';
import {
    isOnboardingResumeRoute,
    type OnboardingResumeRoute,
} from './onboardingResume';

/**
 * The onboarding draft, at rest.
 *
 * A therapy appointment date, what someone wants help with, and when they want
 * reminding are health-adjacent, so the draft goes in the keychain rather than
 * AsyncStorage, alongside the auth tokens and the note encryption key.
 *
 * Keys are scoped per user id. Two accounts on one device therefore read
 * different records and one can never be shown the other's answers; the
 * anonymous record exists only for the part of the flow before sign-in, and is
 * moved onto the user and deleted the moment they authenticate.
 */

/** Mirrors the provider's defaults, kept here so parsing never returns 0:00. */
const DEFAULT_MORNING_MINUTES = 7 * 60 + 30;
const DEFAULT_EVENING_MINUTES = 20 * 60;

const KEY_PREFIX = 'onboarding.draft.v1.';
const ANON_KEY = `${KEY_PREFIX}anon`;

/** SecureStore keys accept alphanumerics, '.', '-' and '_' only. */
const userKey = (userId: string): string => `${KEY_PREFIX}user.${userId.replace(/[^A-Za-z0-9._-]/g, '')}`;

const keyFor = (userId: string | null): string => (userId === null ? ANON_KEY : userKey(userId));

export type OnboardingDraft = {
    goal: GoalId | null;
    /** ISO 8601. A Date does not survive JSON, so it is stored as a string. */
    sessionAtIso: string | null;
    /** True only when continuing with an illustrative plan instead of a booking. */
    sessionDateSkipped: boolean;
    cadence: CadenceId | null;
    morningMinutes: number;
    eveningMinutes: number;
    plan: PlanId;
    reminderScheduled: boolean;
    /** Last focused onboarding screen, so a relaunch resumes instead of restarting. */
    resumeRoute: OnboardingResumeRoute | null;
};

const isPlan = (value: unknown): value is PlanId => value === 'annual' || value === 'monthly';

/**
 * Enum-ish values are checked against the real option lists, not cast.
 *
 * A record written by an older build can carry a goal or cadence this build no
 * longer offers. Casting it through kept an id that nothing matches: the card
 * rendered unselected while Continue was enabled, and session generation ran
 * with a cadence it could not step.
 */
const isGoal = (value: unknown): value is GoalId =>
    typeof value === 'string' && GOAL_OPTIONS.some((option) => option.id === value);

const isCadence = (value: unknown): value is CadenceId =>
    typeof value === 'string' && CADENCE_OPTIONS.some((option) => option.id === value);

/** Minutes from local midnight. Anything outside a day is not a time of day. */
const isMinutesOfDay = (value: unknown): value is number =>
    typeof value === 'number' && Number.isInteger(value) && value >= 0 && value < 24 * 60;

/**
 * Parses a stored record defensively.
 *
 * Anything unrecognised returns null and the caller starts fresh, so a record
 * written by an older build can never crash the flow or half-populate it.
 */
export function parseDraft(raw: string): OnboardingDraft | null {
    try {
        const parsed: unknown = JSON.parse(raw);
        if (typeof parsed !== 'object' || parsed === null) return null;

        const value = parsed as Record<string, unknown>;
        const sessionAtIso = typeof value.sessionAtIso === 'string' ? value.sessionAtIso : null;

        // A stored date that no longer parses is worse than none: it would show
        // "Invalid Date" across the plan.
        if (sessionAtIso !== null && Number.isNaN(Date.parse(sessionAtIso))) {
            return null;
        }

        return {
            // Unrecognised values fall back to "unanswered" rather than being
            // trusted: the user is asked again, which is recoverable, instead of
            // the flow running on a value nothing understands.
            goal: isGoal(value.goal) ? value.goal : null,
            sessionAtIso,
            // A real stored appointment always wins over a stale skip flag.
            sessionDateSkipped: sessionAtIso === null && value.sessionDateSkipped === true,
            cadence: isCadence(value.cadence) ? value.cadence : null,
            morningMinutes: isMinutesOfDay(value.morningMinutes)
                ? value.morningMinutes
                : DEFAULT_MORNING_MINUTES,
            eveningMinutes: isMinutesOfDay(value.eveningMinutes)
                ? value.eveningMinutes
                : DEFAULT_EVENING_MINUTES,
            plan: isPlan(value.plan) ? value.plan : 'annual',
            reminderScheduled: value.reminderScheduled === true,
            resumeRoute: isOnboardingResumeRoute(value.resumeRoute) ? value.resumeRoute : null,
        };
    } catch {
        return null;
    }
}

export async function readDraft(userId: string | null): Promise<OnboardingDraft | null> {
    try {
        const raw = await SecureStore.getItemAsync(keyFor(userId));
        return raw === null ? null : parseDraft(raw);
    } catch {
        // An unreadable keychain must not block onboarding; the user just
        // starts from the beginning.
        return null;
    }
}

export async function writeDraft(userId: string | null, draft: OnboardingDraft): Promise<void> {
    try {
        await SecureStore.setItemAsync(keyFor(userId), JSON.stringify(draft));
    } catch (error) {
        console.warn('[onboarding] could not save draft:', error);
    }
}

export async function clearDraft(userId: string | null): Promise<void> {
    try {
        await SecureStore.deleteItemAsync(keyFor(userId));
    } catch (error) {
        console.warn('[onboarding] could not clear draft:', error);
    }
}

/**
 * Moves the pre-sign-in draft onto the account that just signed in.
 *
 * Runs once, at the moment the user id appears. If that account already has a
 * draft, its own record wins: what they saved while signed in is theirs, and an
 * anonymous draft from whoever used the device before must not overwrite it.
 * The anonymous record is deleted either way, so it cannot leak to the next
 * person to open the app signed out.
 */
export async function promoteAnonDraft(userId: string): Promise<OnboardingDraft | null> {
    const [existing, anonymous] = await Promise.all([readDraft(userId), readDraft(null)]);

    if (existing !== null) {
        await clearDraft(null);
        return existing;
    }

    if (anonymous === null) {
        return null;
    }

    await writeDraft(userId, anonymous);
    await clearDraft(null);
    return anonymous;
}
