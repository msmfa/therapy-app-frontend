import { ReminderType } from '../utils/types';
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
    body: string[];
    sources: ReminderScienceSource[];
}

export const NEURO_REMINDER_COPY: Record<Reason, NeuroReminderCopy> = {
    [Reason.PostSession]: {
        time: 'Evening of your session',
        reason:
            "Right after therapy your brain starts forming new pathways. Reviewing your notes this evening strengthens those fresh changes before they fade. This is known as early consolidation.",
        link: ReminderType.EarlyConsolidation,
    },
    [Reason.PostSleep]: {
        time: 'Morning after your session',
        reason:
            "During sleep your brain replays what it learned. A quick review the next morning helps those pathways settle in and grow stronger. This is known as sleep-dependent consolidation.",
        link: ReminderType.SleepDependentConsolidation,
    },
    [Reason.MidSession]: {
        time: 'Between your sessions',
        reason:
            'New brain pathways need to be reactivated to grow stronger. This is known as spaced reactivation.',
        link: ReminderType.SpacedReactivation,
    },
    [Reason.PreSession]: {
        time: 'Evening before your next session',
        reason:
            "Bringing the insight back the night before therapy reactivates the pathway, so the next session builds on it instead of starting fresh. This is known as state reinstatement.",
        link: ReminderType.StateReinstatement,
    },
};

// The push bodies used to be mirrored here as NOTIFICATION_MESSAGES. Nothing
// ever read them, and the copy had already drifted from what the cron actually
// sends, so the constant was a second source of truth that could only ever be
// wrong. The bodies live with the sender, in the backend's
// notificationCron.helpers.ts.

export const REMINDER_SCIENCE_COPY: Record<ReminderType, ReminderScienceCopy> = {
    [ReminderType.EarlyConsolidation]: {
        title: 'Early Consolidation',
        body: [
            "In the first few hours after learning something new, your brain enters the early phase of memory formation, where proteins activate and synaptic connections begin to strengthen.[1] This is a critical window.",
            "That strengthening does not arrive all at once. Tracking it directly, researchers found it comes in waves: one in the hippocampus straight after learning, a second during that night's sleep, and a third the following night in the cortex, each doing a different job.[1] Reviewing your notes the same evening falls between the first wave and the second.",
            "Until that work is done the memory stays open to disruption. The protein building that fixes a change in place is not finished for a day or two after learning,[3] and a new memory stays vulnerable to interference while it is still settling.[2] Going back to your notes inside that window protects a fragile insight from being crowded out by the rest of your day.",
            "What is happening in your brain: neurons ramp up receptor sensitivity and activate the protein machinery that rewires a connection.[1, 2] Looking back at your notes while that is running deepens the imprint of the session and makes the change more durable.",
        ],
        sources: [
            {
                text: 'Goto et al. (2021), Stepwise synaptic plasticity events drive the early phase of memory consolidation. Science 374, 857-863. Plasticity arrives in waves: the hippocampus after learning, again in that night\'s sleep, then the cortex the next night.',
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
    },
    [ReminderType.SleepDependentConsolidation]: {
        title: 'Sleep-Dependent Consolidation',
        body: [
            "Sleep is when your brain does heavy memory work. During slow wave sleep it replays the neural patterns from your daily activities (which in our case includes a therapy session) and shifts them from temporary storage in the hippocampus toward longer term cortical networks.[1, 6]",
            "You can picture it as your brain organizing files overnight. The hippocampus reactivates memories alongside sharp wave ripples and sleep spindles that help move information into long term storage.[2]",
            "Both slow wave sleep and REM sleep contribute to emotional memory consolidation.[3, 5] Slow wave sleep handles the transfer and restructuring and REM helps stabilize the transformed insights, which is especially important for emotionally charged material.",
            "Why review in the morning: sleep dependent consolidation varies with the amount and quality of slow wave sleep,[4] so the morning after a session is a sweet spot when the reorganized memory is still easy to access. A quick review catches those changes and strengthens them again before they drift.",
        ],
        sources: [
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
    },
    [ReminderType.SpacedReactivation]: {
        title: 'Spaced Reactivation',
        body: [
            "When you reactivate a memory after a delay it briefly opens up for modification before it settles again.[2] That reconsolidation window is why spaced follow ups are more potent than cramming everything at once.[1]",
            "Decades of research on the spacing effect show that repetitions spread over time build much stronger memories than massed practice.[1, 2, 3] Strategic reactivation engages different mechanisms than immediate repetition and triggers reconsolidation that strengthens the trace.[2]",
            "Think of the neural pathway like a garden path that needs to be walked. Each time you revisit your notes you recruit many of the same neurons that fired in session, and the reactivation stabilizes the pathway in a more resilient form.[1]",
            "The gap between sessions matters because a memory needs time to consolidate before the next reactivation can build on it.[2] That leaves a window either side of the right moment. Too soon and the circuit has not reset, so a second pass adds little to the first. Too long and the memory has faded far enough that bringing it back is work rather than a refresh.[4] Where the window sits depends on how long you need to hold on to the material: for something you need weeks from now, the best gap is around a fifth of that span, and the proportion shrinks as the span grows.[5] The schedule here follows that shape. Rather than spacing reminders evenly, it widens the gaps as your next session approaches: the evening of your session, the next morning, then a few days later, then the night before you go back.",
            "What is happening in your brain: bringing a memory back after a delay switches on genes in the cells that hold it, and the proteins they build reinforce the connection. The delay is what triggers that rebuilding, which is why spacing reviews out does more than repeating them close together.[2]",
        ],
        sources: [
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
    },
    [ReminderType.StateReinstatement]: {
        title: 'State Reinstatement',
        body: [
            "Memory is easier to reach when the state you are in matches the state you were in when you formed it. A meta-analysis of the environmental version of this found the effect reliable across studies,[1] and work on internal brain state shows the same pattern: retrieval succeeds best when the state at recall matches the state at encoding.[3]",
            "You cannot go back and sit in last week's session, but you do not have to. In that same meta-analysis, mentally reinstating the context at the point of recall reduced the penalty for being somewhere different.[1] Reading your notes the night before does that job: it puts you back in the session without the room.",
            "The practical effect is on how the next session opens. Arriving with the material already loaded means the first part of the hour goes on the work rather than on rebuilding where you left off.",
            "What is happening in your brain: remembering an episode partially reactivates the regions that were active when you first encoded it, and the closer that overlap, the better the retrieval.[2] Reviewing the night before starts that reactivation early, while there is still time for it to be useful.",
        ],
        sources: [
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
    },
};
