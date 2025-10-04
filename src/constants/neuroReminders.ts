import { ReminderType } from '../utils/types';
import { Reason } from '../components/reminders/reminder-schedule-v2';

interface NeuroReminderCopy {
    time: string;
    reason: string;
    link: ReminderType;
}

export const NEURO_REMINDER_COPY: Record<Reason, NeuroReminderCopy> = {
    post_session: {
        time: 'Evening of your session',
        reason:
            "Right after therapy your brain starts forming new pathways. Reviewing your notes this evening strengthens those fresh changes before they fade. This is known as early consolidation.",
        link: ReminderType.EarlyConsolidation,
    },
    post_sleep: {
        time: 'Morning after your session',
        reason:
            "During sleep your brain replays what it learned. A quick review the next morning helps those pathways settle in and grow stronger. This is known as sleep-dependent consolidation.",
        link: ReminderType.SleepDependentConsolidation,
    },
    mid_session: {
        time: 'Between your sessions',
        reason:
            'New brain pathways need to be reactivated to grow stronger. This is known as spaced reactivation.',
        link: ReminderType.SpacedReactivation,
    },
    pre_session: {
        time: 'Evening before your next session',
        reason:
            "Bringing the insight back the night before therapy reactivates the pathway, so the next session builds on it instead of starting fresh. This is known as state reinstatement.",
        link: ReminderType.StateReinstatement,
    },
};

