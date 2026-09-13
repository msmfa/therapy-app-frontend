import type { GoalId } from '../onboarding/onboardingCopy';
import { t } from '../../i18n/translate';

const GOAL_IDS: readonly GoalId[] = ['remember', 'practise', 'prepare', 'habit'];

export const isGoalId = (value: unknown): value is GoalId =>
    typeof value === 'string' && (GOAL_IDS as readonly string[]).includes(value);

/**
 * The prompt key for a durable onboarding choice. Unknown and legacy values
 * keep the generic prompt.
 *
 * A key rather than a sentence, so a caller inside React can resolve it with
 * its own `t` and re-render when the language changes. Holding the resolved
 * string in component state instead would pin the prompt to the language the
 * screen first mounted in.
 */
export type NotePromptKey = `prompt.${GoalId}` | 'prompt.default';

/** Unprefixed, so a caller with `useTranslation('notes')` can pass it straight in. */
export const notePromptKeyForGoal = (goal: unknown): NotePromptKey =>
    isGoalId(goal) ? `prompt.${goal}` : 'prompt.default';

/** The same prompt, resolved now, for callers with no component around them. */
export const notePromptForGoal = (goal: unknown): string =>
    t(`notes:${notePromptKeyForGoal(goal)}`);

/** The prompt shown before an account's goal is known. */
export const defaultNotePrompt = (): string => t('notes:prompt.default');
