import dayjs from 'dayjs';
import {
    DEFAULT_SESSION_MINUTES,
    LOG_NOTE_MINUTES_AFTER_SESSION,
    REMINDER_SCHEDULE,
} from '../reminders/reminderScheduleConfig';
import type { CadenceId } from './onboardingCopy';
import { nextSessionAfterFirst } from './sessionSeries';
import { ReminderType } from '../../utils/types';

export type PlanTimelineEntry = {
    id: 'log_note' | 'post_session' | 'post_sleep' | 'mid_session' | 'pre_session';
    label: string;
    body: string;
    /**
     * A phrase inside `body` to set in italics, verbatim. The name of the note
     * template is the one thing in these paragraphs that is a thing rather than
     * a description of one, and italics is how the flow marks that without
     * turning it into a link.
     */
    bodyEmphasis?: string;
    /** Opens the evidence specific to this reminder rather than a generic page. */
    researchTarget: ReminderType | null;
    /** The first occurrence. What callers needing a single instant should read. */
    at: Date;
    /**
	 * Every occurrence of this reminder, earliest first, always containing `at`.
	 *
	 * Only the spaced reviews repeat. They are one entry rather than several
	 * identical rows, because three lines all reading "Between sessions" is a
	 * list of dates pretending to be a list of steps.
	 */
    occurrences: Date[];
};

/** The note template, as it is named to the user. Set in italics wherever it appears. */
const NOTE_TEMPLATE_NAME = '5 minute, 5 questions template';

const atMinutes = (day: dayjs.Dayjs, minutes: number): dayjs.Dayjs =>
    day.startOf('day').add(minutes, 'minute');

/**
 * When the app asks for the therapy note itself.
 *
 * The live notification service sends this ten minutes after the session ends.
 * It must not be moved to the user's evening review time: that time belongs to
 * the separate review-note schedule.
 */
export function postSessionNoteAt(sessionAt: Date): Date {
    return dayjs(sessionAt)
        .add(DEFAULT_SESSION_MINUTES + LOG_NOTE_MINUTES_AFTER_SESSION, 'minute')
        .second(0)
        .millisecond(0)
        .toDate();
}

export type PlanTimelineInputs = {
    sessionAt: Date;
    cadence: CadenceId | null;
    morningMinutes: number;
    eveningMinutes: number;
};

/**
 * The note prompt plus the review moments shown on the personal plan, using the
 * user's real answers.
 *
 * Mirrors the shape of the live notification plan: first the distinct log-note
 * prompt, then the evening, post-sleep, spaced, and pre-session reviews. This is
 * a preview rather than a second implementation of the server's scheduler.
 */
export function planTimeline({
    sessionAt,
    cadence,
    morningMinutes,
    eveningMinutes,
}: PlanTimelineInputs): PlanTimelineEntry[] {
    const session = dayjs(sessionAt);
    const sessionEnds = session.add(DEFAULT_SESSION_MINUTES, 'minute');
    const logNoteAt = dayjs(postSessionNoteAt(sessionAt));

    // This is the first review of a note that has already been captured, not the
    // prompt to write that note. The live scheduler drops the evening review if
    // its chosen time is during the session.
    const eveningOfSession = atMinutes(session, eveningMinutes);
    const postSession = eveningOfSession.isBefore(sessionEnds) ? null : eveningOfSession;

    const morningAfter = atMinutes(session.add(1, 'day'), morningMinutes);
    const postSleep = morningAfter.isBefore(sessionEnds) ? null : morningAfter;

    // The real next appointment, projected from the confirmed one and the
    // cadence. Null when the schedule varies, or cadence was never answered.
    const nextSession = nextSessionAfterFirst({ firstSessionAt: sessionAt, cadence });
    const gapDays = nextSession === null ? null : dayjs(nextSession).diff(session, 'day');

    // Every spaced reactivation the server will send, not just the first.
    //
    // Mirrors the backend loop in reminderSchedule.ts:
    //     for (offset = startAfterDays; offset < gap.days; offset += cadenceDays)
    // A fortnightly gap produces three of these, so showing one left a ten-day
    // hole in the plan and promised fewer reviews than the user actually gets.
    //
    // With no known next session there is no gap to step through. The backend
    // deliberately schedules reviews only inside a known gap, so the preview
    // must wait for the user to add their following appointment too.
    const preSessionDay = nextSession === null ? null : dayjs(nextSession).subtract(1, 'day');

    const midOffsets: number[] = [];
    if (gapDays !== null) {
        for (
            let offset = REMINDER_SCHEDULE.startAfterDays;
            offset < gapDays;
            offset += REMINDER_SCHEDULE.cadenceDays
        ) {
            midOffsets.push(offset);
        }
    }

    const midSessions = midOffsets
        .map((offset) => atMinutes(session.add(offset, 'day'), eveningMinutes))
    // The server sends at most one review a day, and the pre-session one
    // wins its slot. Without this a 28-day gap shows two reviews on the same
    // evening, only one of which arrives.
        .filter((at) => preSessionDay === null || !at.isSame(preSessionDay, 'day'));

    const entries: PlanTimelineEntry[] = [
        {
            id: 'log_note',
            // Named by the day it falls on, like every other row: "after your
            // session" is what the whole screen is about, so on its own it said
            // nothing the heading had not already said.
            label: `After your ${session.format('dddd')} session`,
            body: `We will send you a notification just after your session on ${session.format('dddd')} to remind you to take a note on what you discussed. If you're not sure where to start we have a ${NOTE_TEMPLATE_NAME} that makes it easy.`,
            bodyEmphasis: NOTE_TEMPLATE_NAME,
            researchTarget: null,
            at: logNoteAt.toDate(),
            occurrences: [logNoteAt.toDate()],
        },
    ];

    if (postSession !== null && nextSession !== null) {
        entries.push({
            id: 'post_session',
            // Named by its day, like the row above it: "later that evening"
            // relied on the reader still holding the session's day in mind.
            label: `Later that ${session.format('dddd')} evening`,
            body: 'Return to your note while the session is still fresh.',
            researchTarget: ReminderType.EarlyConsolidation,
            at: postSession.toDate(),
            occurrences: [postSession.toDate()],
        });
    }

    if (postSleep !== null && nextSession !== null && postSleep.isBefore(nextSession)) {
        entries.push({
            id: 'post_sleep',
            label: `${postSleep.format('dddd')} morning`,
            body: 'Revisit what you discussed in your session the day before.',
            researchTarget: ReminderType.SleepDependentConsolidation,
            at: postSleep.toDate(),
            occurrences: [postSleep.toDate()],
        });
    }

    // One entry carrying every spaced review, rather than a row each. They share
    // a label, a description and a time; only the date differs, so repeating the
    // other three lines adds length without adding information.
    if (midSessions.length > 0) {
        const dates = midSessions.map((at) => at.toDate());

        entries.push({
            id: 'mid_session',
            label: 'Between sessions',
            body: 'A short reminder to read your note again during the week, so what you talked about does not fade before your next session.',
            researchTarget: ReminderType.SpacedReactivation,
            at: dates[0],
            occurrences: dates,
        });
    }

    // Only when a real next session can be derived from the answers. With a
    // schedule that varies there is no known appointment to prepare for, and
    // showing one would claim a booking the user never made.
    if (nextSession !== null) {
        const preSessionDate = atMinutes(
            dayjs(nextSession).subtract(1, 'day'),
            eveningMinutes,
        );
        const preSessionAt = preSessionDate.toDate();

        entries.push({
            id: 'pre_session',
            // Named by its day, like every other row on the screen.
            label: `${preSessionDate.format('dddd')} evening`,
            body: 'One last look at your note the evening before, so you arrive knowing what you want to continue from your last session.',
            researchTarget: ReminderType.StateReinstatement,
            at: preSessionAt,
            occurrences: [preSessionAt],
        });
    }

    return entries;
}

/** The first reminder the user will actually receive. */
export function firstReminder(entries: PlanTimelineEntry[]): PlanTimelineEntry | null {
    return entries.length > 0 ? entries[0] : null;
}
