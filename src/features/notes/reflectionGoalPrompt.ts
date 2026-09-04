import type { GoalId } from '../onboarding/onboardingCopy';

export const DEFAULT_NOTE_PROMPT = 'What mattered in your therapy session?';

const NOTE_PROMPTS: Record<GoalId, string> = {
    remember: 'What do you want to remember from this session?',
    practise: 'What insight do you want to try in daily life?',
    prepare: 'What clear thread do you want to bring back next time?',
    habit: 'What would you like to understand or improve over time?',
};

export const isGoalId = (value: unknown): value is GoalId =>
    typeof value === 'string' && Object.prototype.hasOwnProperty.call(NOTE_PROMPTS, value);

/**
 * Turns the durable onboarding choice into the first prompt people see when
 * they write a note. Unknown and legacy values keep the existing generic copy.
 */
export const notePromptForGoal = (goal: unknown): string =>
    isGoalId(goal) ? NOTE_PROMPTS[goal] : DEFAULT_NOTE_PROMPT;
