import { DEFAULT_NOTE_PROMPT, isGoalId, notePromptForGoal } from '../reflectionGoalPrompt';

describe('reflectionGoalPrompt', () => {
	it.each([
		['remember', 'What do you want to remember from this session?'],
		['practise', 'What insight do you want to try in daily life?'],
		['prepare', 'What clear thread do you want to bring back next time?'],
		['habit', 'What would you like to understand or improve over time?'],
	] as const)('maps %s to its note prompt', (goal, expected) => {
		expect(notePromptForGoal(goal)).toBe(expected);
		expect(isGoalId(goal)).toBe(true);
	});

	it.each([undefined, null, '', 'unknown', 1])(
		'keeps the generic prompt for an invalid legacy value (%p)',
		(goal) => {
			expect(notePromptForGoal(goal)).toBe(DEFAULT_NOTE_PROMPT);
			expect(isGoalId(goal)).toBe(false);
		},
	);
});
