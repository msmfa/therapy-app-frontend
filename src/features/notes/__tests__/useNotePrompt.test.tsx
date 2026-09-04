import { act, renderHook, waitFor } from '@testing-library/react-native';
import { getCurrentUserSettings } from '../../../api/users';
import { DEFAULT_NOTE_PROMPT } from '../reflectionGoalPrompt';
import { useNotePrompt } from '../useNotePrompt';

jest.mock('../../../api/users', () => ({
	getCurrentUserSettings: jest.fn(),
}));

const mockGetCurrentUserSettings = jest.mocked(getCurrentUserSettings);

describe('useNotePrompt', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('loads the account-owned onboarding goal', async () => {
		mockGetCurrentUserSettings.mockResolvedValue({ reflectionGoal: 'practise' });
		const { result } = renderHook(() => useNotePrompt('user-a'));

		await waitFor(() => {
			expect(result.current).toBe('What insight do you want to try in daily life?');
		});
	});

	it('keeps note entry usable if settings cannot load', async () => {
		const warning = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
		mockGetCurrentUserSettings.mockRejectedValue(new Error('offline'));
		const { result } = renderHook(() => useNotePrompt('user-a'));

		await waitFor(() => expect(mockGetCurrentUserSettings).toHaveBeenCalledTimes(1));
		expect(result.current).toBe(DEFAULT_NOTE_PROMPT);
		warning.mockRestore();
	});

	it('ignores a response belonging to the previous account', async () => {
		let resolveOld!: (value: { reflectionGoal: 'remember' }) => void;
		mockGetCurrentUserSettings
			.mockImplementationOnce(
				() =>
					new Promise((resolve) => {
						resolveOld = resolve;
					}),
			)
			.mockResolvedValueOnce({ reflectionGoal: 'prepare' });

		const { result, rerender } = renderHook(
			({ userId }: { userId: string }) => useNotePrompt(userId),
			{ initialProps: { userId: 'user-a' } },
		);
		rerender({ userId: 'user-b' });

		await waitFor(() => {
			expect(result.current).toBe('What clear thread do you want to bring back next time?');
		});
		await act(async () => resolveOld({ reflectionGoal: 'remember' }));

		expect(result.current).toBe('What clear thread do you want to bring back next time?');
	});
});
