import type { ImageSourcePropType } from 'react-native';
import { ReminderType } from '../utils/types';

/** One picture in both appearances: the backdrop is part of the render. */
export interface ScienceIllustration {
    light: ImageSourcePropType;
    dark: ImageSourcePropType;
}

/**
 * Illustration slots for a write-up, in the same order as its body paragraphs,
 * so each picture sits above the paragraph it illustrates. An empty slot leaves
 * that paragraph text-only. The pictures carry no words, so the same image
 * serves every language.
 */
export const SCIENCE_ILLUSTRATIONS: Partial<Record<ReminderType, Array<ScienceIllustration | undefined>>> = {
    [ReminderType.EarlyConsolidation]: [
        // Protein activity begins strengthening a new neural connection.
        {
            light: require('../../assets/illustrations/science/early-consolidation-paragraph-1.webp') as ImageSourcePropType,
            dark: require('../../assets/illustrations/science/early-consolidation-paragraph-1.webp') as ImageSourcePropType,
        },
        // The note review sits between the first wave and two nights of sleep.
        {
            light: require('../../assets/illustrations/science/early-consolidation-paragraph-2.webp') as ImageSourcePropType,
            dark: require('../../assets/illustrations/science/early-consolidation-paragraph-2.webp') as ImageSourcePropType,
        },
        // Returning to the note protects a fragile memory from interference.
        {
            light: require('../../assets/illustrations/science/early-consolidation-paragraph-3.webp') as ImageSourcePropType,
            dark: require('../../assets/illustrations/science/early-consolidation-paragraph-3.webp') as ImageSourcePropType,
        },
        // Paragraph four does not have an approved illustration yet.
        undefined,
    ],
    [ReminderType.SleepDependentConsolidation]: [
        // Sleep replays a memory and moves it toward longer-term storage.
        {
            light: require('../../assets/illustrations/science/sleep-dependent-consolidation-paragraph-1.webp') as ImageSourcePropType,
            dark: require('../../assets/illustrations/science/sleep-dependent-consolidation-paragraph-1.webp') as ImageSourcePropType,
        },
        // Sleep waves help file the memory away overnight.
        {
            light: require('../../assets/illustrations/science/sleep-dependent-consolidation-paragraph-2.webp') as ImageSourcePropType,
            dark: require('../../assets/illustrations/science/sleep-dependent-consolidation-paragraph-2.webp') as ImageSourcePropType,
        },
        // Complementary sleep phases stabilise emotional memories.
        {
            light: require('../../assets/illustrations/science/sleep-dependent-consolidation-paragraph-3.webp') as ImageSourcePropType,
            dark: require('../../assets/illustrations/science/sleep-dependent-consolidation-paragraph-3.webp') as ImageSourcePropType,
        },
        // A morning review reinforces the memory after sleep.
        {
            light: require('../../assets/illustrations/science/sleep-dependent-consolidation-paragraph-4.webp') as ImageSourcePropType,
            dark: require('../../assets/illustrations/science/sleep-dependent-consolidation-paragraph-4.webp') as ImageSourcePropType,
        },
    ],
    [ReminderType.SpacedReactivation]: [
        // Reviews move farther apart while the recalled memory grows stronger.
        {
            light: require('../../assets/illustrations/science/spaced-reminders-simple.webp') as ImageSourcePropType,
            dark: require('../../assets/illustrations/science/spaced-reminders-simple.webp') as ImageSourcePropType,
        },
        // Reopening the note strengthens the same pathway each time.
        {
            light: require('../../assets/illustrations/science/strengthened-pathway-simple.webp') as ImageSourcePropType,
            dark: require('../../assets/illustrations/science/strengthened-pathway-simple.webp') as ImageSourcePropType,
        },
        // A pause lets the recalled connection rebuild in a stronger form.
        {
            light: require('../../assets/illustrations/science/reconsolidation-window-simple.webp') as ImageSourcePropType,
            dark: require('../../assets/illustrations/science/reconsolidation-window-simple.webp') as ImageSourcePropType,
        },
    ],
    [ReminderType.StateReinstatement]: [
        // Matching the state at recall to the state at learning helps retrieval.
        {
            light: require('../../assets/illustrations/science/state-reinstatement-paragraph-1.webp') as ImageSourcePropType,
            dark: require('../../assets/illustrations/science/state-reinstatement-paragraph-1.webp') as ImageSourcePropType,
        },
        // Reading a note can mentally restore the original therapy context.
        {
            light: require('../../assets/illustrations/science/state-reinstatement-paragraph-2.webp') as ImageSourcePropType,
            dark: require('../../assets/illustrations/science/state-reinstatement-paragraph-2.webp') as ImageSourcePropType,
        },
        // Preparing beforehand lets the next session continue from the last one.
        {
            light: require('../../assets/illustrations/science/state-reinstatement-paragraph-3.webp') as ImageSourcePropType,
            dark: require('../../assets/illustrations/science/state-reinstatement-paragraph-3.webp') as ImageSourcePropType,
        },
        // Recall reactivates overlapping regions from the original memory.
        {
            light: require('../../assets/illustrations/science/state-reinstatement-paragraph-4.webp') as ImageSourcePropType,
            dark: require('../../assets/illustrations/science/state-reinstatement-paragraph-4.webp') as ImageSourcePropType,
        },
    ],
};
