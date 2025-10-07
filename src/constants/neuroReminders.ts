import { ReminderType } from '../utils/types';
import { Reason } from '../features/reminders/reminder-schedule-v2';

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

export const NOTIFICATION_MESSAGES = {
    post_session: 'Time to review your session notes while your brain is still forming new pathways 🧠',
    post_sleep: "Good morning! Your brain worked on your insights overnight—let's reinforce them ☀️",
    mid_session: 'Quick check-in with your therapy notes to strengthen those neural pathways 💪',
    pre_session: "'Tomorrow's session prep: reactivate your insights so you start strong 🎯",
};

export const REMINDER_SCIENCE_COPY: Record<ReminderType, ReminderScienceCopy> = {
    [ReminderType.EarlyConsolidation]: {
        title: 'Early Consolidation',
        body: [
            "Think of your brain like wet cement after therapy - it is still forming and shaping. In the first few hours after learning something new, your brain enters the early phase of memory formation where proteins activate and synaptic connections begin to strengthen. This is a critical window.",
            "Research shows that new neural pathways continue forming for up to 8 hours after a learning experience. During this time your brain keeps building connections based on what you discovered in session. Reviewing your insights the same evening gives those brand-new pathways reinforcement while they are still forming.",
            "Memory traces are most vulnerable to interference in the first six hours after learning. Engaging with your notes in that window protects fragile insights from being crowded out by the rest of your day and signals to your brain that this material deserves extra resources.",
            "What is happening in your brain: neurons ramp up receptor sensitivity and activate protein kinases to kick off rewiring. Looking back at your notes while that machinery is running deepens the imprint of the session and makes the change more durable.",
        ],
        sources: [
            {
                text: 'Science - DOI:10.1126/science.abj9195 (synaptic consolidation overview)',
                url: 'https://www.science.org/doi/10.1126/science.abj9195',
            },
            {
                text: 'Wikipedia - Memory consolidation overview',
                url: 'https://en.wikipedia.org/wiki/Memory_consolidation',
            },
            {
                text: 'MyBrainRewired - Why neuroplasticity based therapy supports memory',
                url: 'https://mybrainrewired.com/neuroplasticity/why-neuroplasticity-therapy-helps-with-memory-loss/',
            },
            {
                text: 'PMC - Synaptic tagging and capture review (PMC4526749)',
                url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4526749/',
            },
        ],
    },
    [ReminderType.SleepDependentConsolidation]: {
        title: 'Sleep-Dependent Consolidation',
        body: [
            "Sleep is when your brain does heavy memory work. During slow wave sleep it replays the neural patterns from your therapy session and shifts them from temporary storage in the hippocampus toward longer term cortical networks.",
            "You can picture it as your brain organizing files overnight. The hippocampus reactivates memories alongside sharp wave ripples and sleep spindles that help move information into long term storage.",
            "Both slow wave sleep and REM sleep contribute to emotional memory consolidation. Slow wave sleep handles the transfer and restructuring and REM helps stabilize the transformed insights, which is especially important for emotionally charged material.",
            "Why review in the morning: sleep dependent consolidation varies with the amount and quality of slow wave sleep, so the morning after a session is a sweet spot when the reorganized memory is still easy to access. A quick review catches those changes and strengthens them again before they drift.",
            "What is happening in your brain: overnight dialogue between hippocampus and cortex is coordinated by slow oscillations, spindles, and ripples. Looking at your notes in the morning leverages that fresh coordination.",
        ],
        sources: [
            {
                text: 'Nature Reviews Neuroscience - Sleep and memory consolidation update (nrn2762-c2)',
                url: 'https://www.nature.com/articles/nrn2762-c2',
            },
            {
                text: 'PMC - Sleep spindles and memory consolidation (PMC3768102)',
                url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3768102/',
            },
            {
                text: 'Nature Communications - Sleep dependent memory replay (s42003-025-07868-5)',
                url: 'https://www.nature.com/articles/s42003-025-07868-5',
            },
            {
                text: 'PMC - Sleep enhances declarative memory consolidation (PMC2824214)',
                url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC2824214/',
            },
            {
                text: 'PMC - REM sleep and emotional memory processing (PMC2680680)',
                url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC2680680/',
            },
            {
                text: 'Neuron - Sleep stage coordination and systems consolidation (S0896627323002015)',
                url: 'https://www.sciencedirect.com/science/article/pii/S0896627323002015',
            },
            {
                text: 'Neurobiology of Learning and Memory - Sleep and emotion integration (S1074742712000925)',
                url: 'https://www.sciencedirect.com/science/article/abs/pii/S1074742712000925',
            },
        ],
    },
    [ReminderType.SpacedReactivation]: {
        title: 'Spaced Reactivation',
        body: [
            "When you reactivate a memory after a delay it briefly opens up for modification before it settles again. That reconsolidation window is why spaced follow ups are more potent than cramming everything at once.",
            "Decades of research on the spacing effect show that repetitions spread over time build much stronger memories than massed practice. Strategic reactivation engages different mechanisms than immediate repetition and triggers reconsolidation that strengthens the trace.",
            "Think of the neural pathway like a garden path that needs to be walked. Each time you revisit your notes you recruit many of the same neurons that fired in session, and the reactivation stabilizes the pathway in a more resilient form.",
            "The gap between sessions matters because it gives your brain time for protein synthesis and gene expression before the next reactivation. Midway through the week is a sweet spot: enough time for initial consolidation, not so much that the insight is hard to retrieve.",
            "What is happening in your brain: spaced reviews engage reconsolidation processes driven by transcription factors such as ZIF268 that strengthen the memory trace when it is revisited after a delay.",
        ],
        sources: [
            {
                text: 'PMC - Synaptic plasticity and the spacing effect (PMC6607761)',
                url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6607761/',
            },
            {
                text: 'Journal of Neuroscience - Reactivation timing strengthens memory (39/27/5351)',
                url: 'https://www.jneurosci.org/content/39/27/5351',
            },
            {
                text: 'PMC - Reconsolidation and behavioral tagging update (PMC5476736)',
                url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5476736/',
            },
            {
                text: 'Frontiers in Psychology - Spaced learning mechanisms (10.3389/fpsyg.2017.00962)',
                url: 'https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2017.00962/full',
            },
            {
                text: 'UNESCO IBE - Spaced practice and learning outcomes',
                url: 'https://solportal.ibe-unesco.org/articles/unlocking-potential-raising-educational-outcomes-for-students-with-special-needs-2/',
            },
            {
                text: 'Wikipedia - Spaced repetition overview',
                url: 'https://en.wikipedia.org/wiki/Spaced_repetition',
            },
            {
                text: 'PMC - Interval timing and memory retention meta analysis (PMC5126970)',
                url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5126970/',
            },
        ],
    },
    [ReminderType.StateReinstatement]: {
        title: 'State Reinstatement',
        body: [
            "State dependent memory shows that information is easier to recall when you are in the same physical or mental state you were in when you encoded it.",
            "Reviewing therapy insights the night before your next session recreates the emotional and cognitive context from the prior appointment and primes those pathways.",
            "It works like priming a pump: you reactivate the networks that will be useful so you arrive ready to build instead of spending time reconstructing the previous session.",
            "Research on context reinstatement shows that matching cues and internal states produces clearer neural signatures and better retrieval.",
            "What is happening in your brain: revisiting the material recreates overlapping activation patterns from the original session, making the insight easier to access when you sit down with your therapist.",
        ],
        sources: [
            {
                text: 'Wikipedia - State dependent memory overview',
                url: 'https://en.wikipedia.org/wiki/State-dependent_memory',
            },
            {
                text: 'Simply Psychology - Context and state dependent memory primer',
                url: 'https://www.simplypsychology.org/context-and-state-dependent-memory.html',
            },
            {
                text: 'Bay Area CBT Center - Harnessing state dependent learning for retention',
                url: 'https://bayareacbtcenter.com/harnessing-state-dependent-learning-for-better-memory-retention/',
            },
            {
                text: 'Wikipedia - Context dependent memory overview',
                url: 'https://en.wikipedia.org/wiki/Context-dependent_memory',
            },
            {
                text: 'Encyclopedia.pub - Context reinstatement and learning',
                url: 'https://encyclopedia.pub/entry/30504',
            },
            {
                text: 'PMC - Neural evidence for context reinstatement (PMC10750866)',
                url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10750866/',
            },
        ],
    },
};
