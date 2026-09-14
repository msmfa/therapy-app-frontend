import { ReminderType } from '../utils/types';
import { t } from '../i18n/translate';
import { Reason } from '../features/reminders/types';

interface NeuroReminderCopy {
    time: string;
    reason: string;
    link: ReminderType;
}

interface ReminderScienceSource {
    text: string;
    url: string;
}

interface ReminderScienceCopy {
    title: string;
    /**
     * The whole write-up in plain language, for a reader who opened this to
     * find out whether the reminder is worth having rather than to read the
     * literature. Shown above the body; no citations, no terms of art.
     *
     * Taken from plastic-brains.com/research-based-intervals, so the app and
     * the website explain the schedule in the same words.
     */
    tldr: string;
    body: string[];
    sources: ReminderScienceSource[];
}

/**
 * The citations, which stay in English.
 *
 * A reference is a pointer to a specific paper: the authors, the year, the
 * journal and the page. Translating any of that would make it harder to find
 * the work, not easier, and the trailing sentence on some entries is a note
 * about what that paper showed, which belongs with the citation it qualifies.
 * Everything a reader is meant to *read* is translated; only the pointers are
 * not.
 */
const SOURCES: Record<ReminderType, ReminderScienceSource[]> = {
    [ReminderType.EarlyConsolidation]: [
        {
            text: "Goto et al. (2021), Stepwise synaptic plasticity events drive the early phase of memory consolidation. Science 374, 857-863. Plasticity arrives in waves: the hippocampus after learning, again in that night's sleep, then the cortex the next night.",
            url: 'https://www.science.org/doi/10.1126/science.abj9195',
        },
        {
            text: 'Squire, Genzel, Wixted & Morris (2015), Memory consolidation. Cold Spring Harbor Perspectives in Biology 7(8):a021766.',
            url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4526749/',
        },
        {
            text: 'Alberini (2011), The role of reconsolidation and the dynamic process of long-term memory formation and storage. Frontiers in Behavioral Neuroscience. The protein-synthesis phase of consolidation completes within the first day or two after training.',
            url: 'https://www.frontiersin.org/journals/behavioral-neuroscience/articles/10.3389/fnbeh.2011.00012/full',
        },
    ],
    [ReminderType.SleepDependentConsolidation]: [
        {
            text: 'Diekelmann & Born (2010), The memory function of sleep. Nature Reviews Neuroscience 11, 114-126.',
            url: 'https://www.nature.com/articles/nrn2762',
        },
        {
            text: "Rasch & Born (2013), About sleep's role in memory. Physiological Reviews 93(2), 681-766.",
            url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3768102/',
        },
        {
            text: 'Both slow wave and rapid eye movement sleep contribute to emotional memory consolidation. Communications Biology (2025).',
            url: 'https://www.nature.com/articles/s42003-025-07868-5',
        },
        {
            text: 'Walker (2009), The role of slow wave sleep in memory processing. Journal of Clinical Sleep Medicine. Reduced slow wave sleep tracks reduced declarative memory consolidation.',
            url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC2824214/',
        },
        {
            text: 'Stickgold & Walker (2007), Sleep-dependent memory consolidation and reconsolidation. Sleep Medicine.',
            url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC2680680/',
        },
        {
            text: 'Sleep, a brain-state serving systems memory consolidation. Neuron (2023).',
            url: 'https://www.sciencedirect.com/science/article/pii/S0896627323002015',
        },
    ],
    [ReminderType.SpacedReactivation]: [
        {
            text: 'Feng, Zhao, Liu, Cai, Ye, Chen & Xue (2019), Spaced learning enhances episodic memory by increasing neural pattern similarity across repetitions. Journal of Neuroscience 39(27), 5351-5360.',
            url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6607761/',
        },
        {
            text: 'Smith & Scarf (2017), Spacing repetitions over long timescales: a review and a reconsolidation explanation. Frontiers in Psychology. More time between repetitions lets the memory consolidate further, which makes the reconsolidation a repetition triggers more effective.',
            url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5476736/',
        },
        {
            text: 'UNESCO IBE Science of Learning - The spacing effect: organizing educational content across a curriculum.',
            url: 'https://solportal.ibe-unesco.org/articles/unlocking-potential-raising-educational-outcomes-for-students-with-special-needs-2/',
        },
        {
            text: 'The right time to learn: mechanisms and optimization of spaced learning (PMC5126970). Intervals that are too short or too long both fail; the effective gap sits between them.',
            url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5126970/',
        },
        {
            text: 'Cepeda, Vul, Rohrer, Wixted & Pashler (2008), Spacing effects in learning: a temporal ridgeline of optimal retention. Psychological Science 19, 1095-1102. The optimum gap was about 20 per cent of the test delay at a few weeks, falling to about 5 per cent at one year.',
            url: 'https://files.eric.ed.gov/fulltext/ED505660.pdf',
        },
    ],
    [ReminderType.StateReinstatement]: [
        {
            text: 'Smith & Vela (2001), Environmental context-dependent memory: a review and meta-analysis. Psychonomic Bulletin & Review 8(2), 203-220. Context effects were reliable across studies, and mentally reinstating the context at test reduced the penalty for recalling somewhere different.',
            url: 'https://link.springer.com/article/10.3758/BF03196157',
        },
        {
            text: 'Danker & Anderson (2010), The ghosts of brain states past: remembering reactivates the brain regions engaged during encoding. Psychological Bulletin 136, 87-102.',
            url: 'https://pubmed.ncbi.nlm.nih.gov/20063927/',
        },
        {
            text: 'Wang et al. (2023), State-dependent memory retrieval: insights from neural dynamics and behavioral perspectives. Learning & Memory 30(12), 325-337.',
            url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10750866/',
        },
    ],
};

/**
 * The reminder cards, resolved now rather than at import time.
 *
 * These were plain constants, which meant the whole science section stayed in
 * whatever language the app started in and never followed a change of setting.
 */
export const neuroReminderCopy = (): Record<Reason, NeuroReminderCopy> => ({
    [Reason.PostSession]: {
        time: t('science:reminder.postSession.time'),
        reason: t('science:reminder.postSession.reason'),
        link: ReminderType.EarlyConsolidation,
    },
    [Reason.PostSleep]: {
        time: t('science:reminder.postSleep.time'),
        reason: t('science:reminder.postSleep.reason'),
        link: ReminderType.SleepDependentConsolidation,
    },
    [Reason.MidSession]: {
        time: t('science:reminder.midSession.time'),
        reason: t('science:reminder.midSession.reason'),
        link: ReminderType.SpacedReactivation,
    },
    [Reason.PreSession]: {
        time: t('science:reminder.preSession.time'),
        reason: t('science:reminder.preSession.reason'),
        link: ReminderType.StateReinstatement,
    },
});

export const reminderScienceCopy = (): Record<ReminderType, ReminderScienceCopy> => ({
    [ReminderType.EarlyConsolidation]: {
        title: t('science:explainer.earlyConsolidation.title'),
        tldr: t('science:explainer.earlyConsolidation.tldr'),
        body: t('science:explainer.earlyConsolidation.body', { returnObjects: true }) as string[],
        sources: SOURCES[ReminderType.EarlyConsolidation],
    },
    [ReminderType.SleepDependentConsolidation]: {
        title: t('science:explainer.sleepDependentConsolidation.title'),
        tldr: t('science:explainer.sleepDependentConsolidation.tldr'),
        body: t('science:explainer.sleepDependentConsolidation.body', { returnObjects: true }) as string[],
        sources: SOURCES[ReminderType.SleepDependentConsolidation],
    },
    [ReminderType.SpacedReactivation]: {
        title: t('science:explainer.spacedReactivation.title'),
        tldr: t('science:explainer.spacedReactivation.tldr'),
        body: t('science:explainer.spacedReactivation.body', { returnObjects: true }) as string[],
        sources: SOURCES[ReminderType.SpacedReactivation],
    },
    [ReminderType.StateReinstatement]: {
        title: t('science:explainer.stateReinstatement.title'),
        tldr: t('science:explainer.stateReinstatement.tldr'),
        body: t('science:explainer.stateReinstatement.body', { returnObjects: true }) as string[],
        sources: SOURCES[ReminderType.StateReinstatement],
    },
});
