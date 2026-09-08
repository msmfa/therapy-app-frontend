import React from 'react';
import { jest } from '@jest/globals';
import { Linking } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

import HowToTakeNotesScreen from '../how-to-take-notes';
import WhyFiveQuestionsScreen from '../why-five-questions';
import NewNoteScreen from '../(tabs)/index';

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockAddNote = jest.fn<() => Promise<void>>();
let mockNotePrompt = 'What mattered in your therapy session?';

jest.mock('expo-router', () => ({
	useRouter: () => ({ push: mockPush, back: mockBack, replace: mockReplace }),
}));

jest.mock('@expo/vector-icons', () => ({
	Feather: () => null,
	Ionicons: () => null,
}));

jest.mock('react-native-safe-area-context', () => {
	const React = require('react');
	const { View } = require('react-native');
	return {
		SafeAreaView: View,
		SafeAreaProvider: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
		useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
	};
});

jest.mock('../../src/context/auth/AuthContext', () => ({
	useAuth: () => ({ user: { id: 'user-1' } }),
}));

jest.mock('../../src/features/notes/useNotes', () => ({
	useNotes: () => ({ addNote: mockAddNote }),
}));

jest.mock('../../src/features/notes/useNotePrompt', () => ({
	useNotePrompt: () => mockNotePrompt,
}));

beforeEach(() => {
	mockPush.mockClear();
	mockBack.mockClear();
	mockReplace.mockClear();
	mockAddNote.mockReset();
	mockNotePrompt = 'What mattered in your therapy session?';
});

describe('Template screen', () => {
	it('shows the questions as a picture of the sheet rather than retyping them', () => {
		const { getByText, getByLabelText, queryByText } = render(<HowToTakeNotesScreen />);

		getByText('Template');
		getByLabelText('The five questions, as they appear on the cheatsheet');

		// The sheet carries the wording now, so the page must not repeat it.
		expect(queryByText(/Write as much or as little as feels useful/)).toBeNull();
		expect(queryByText(/What stayed with you from today’s session\?/)).toBeNull();
	});

	it('opens the cheatsheet popup from the link', () => {
		const { getByText, queryByText } = render(<HowToTakeNotesScreen />);

		expect(queryByText(/An idea, phrase, realisation/)).toBeNull();

		fireEvent.press(getByText('cheatsheet'));

		getByText(/What stayed with you from today’s session\?/);
		getByText('One subject is enough.');
	});

	it('opens the research article from the link', () => {
		const openURL = jest
			.spyOn(Linking, 'openURL')
			.mockImplementation(() => Promise.resolve(true));

		const { getByText } = render(<HowToTakeNotesScreen />);

		fireEvent.press(getByText('click here'));

		expect(openURL).toHaveBeenCalledWith(
			'https://www.plastic-brains.com/after-therapy-note-template/',
		);

		openURL.mockRestore();
	});

	it('goes back from the arrow', () => {
		const { getByLabelText } = render(<HowToTakeNotesScreen />);

		fireEvent.press(getByLabelText('Back'));

		expect(mockBack).toHaveBeenCalled();
	});
});

describe('Why these five questions', () => {
	it('renders the rationale for each question', () => {
		const { getByText } = render(<WhyFiveQuestionsScreen />);

		getByText('Why these five questions');
		getByText(/Most of a session does not survive the week/);
		getByText(/So an after-therapy note is not admin/);

		getByText(/The single best-evidenced way to keep something/);
		getByText(/What you do between sessions is not a supplement to therapy/);
		getByText(/Naming the feeling earns its place separately/);
		getByText(/This line asks for your own words on purpose/);
		getByText(/Naming the situation and the response together/);
		getByText(/Coming back to something across days beats going over it once/);
		getByText(/These are findings about methods, not promises about your therapy/);
	});

	it('renders all eight references', () => {
		const { getByText } = render(<WhyFiveQuestionsScreen />);

		getByText('References');
		getByText(/^Kessels \(2003\)/);
		getByText(/^Dong, Zhao, Ong & Harvey \(2017\)/);
		getByText(/^Adesope, Trevisan & Sundararajan \(2017\)/);
		getByText(/^Kazantzis, Whittington, Zelencich, Kyrios, Norton & Hofmann \(2016\)/);
		getByText(/^Kircanski, Lieberman & Craske \(2012\)/);
		getByText(/^Bisra, Liu, Nesbit, Salimi & Winne \(2018\)/);
		getByText(/^Gollwitzer & Sheeran \(2006\)/);
		getByText(/^Cepeda, Pashler, Vul, Wixted & Rohrer \(2006\)/);
	});

	it('opens the source article when a reference is pressed', () => {
		const openURL = jest
			.spyOn(Linking, 'openURL')
			.mockImplementation(() => Promise.resolve(true));

		const { getByText } = render(<WhyFiveQuestionsScreen />);

		fireEvent.press(getByText(/^Kessels \(2003\)/));
		expect(openURL).toHaveBeenCalledWith('https://pmc.ncbi.nlm.nih.gov/articles/PMC539473/');

		fireEvent.press(getByText(/^Cepeda, Pashler, Vul, Wixted & Rohrer \(2006\)/));
		expect(openURL).toHaveBeenCalledWith('https://doi.org/10.1037/0033-2909.132.3.354');

		openURL.mockRestore();
	});

	it('gives every reference a link', () => {
		const openURL = jest
			.spyOn(Linking, 'openURL')
			.mockImplementation(() => Promise.resolve(true));

		const { getAllByRole } = render(<WhyFiveQuestionsScreen />);
		const links = getAllByRole('link');

		expect(links).toHaveLength(8);

		links.forEach((link) => fireEvent.press(link));
		const called = openURL.mock.calls.map(([url]) => url);

		expect(new Set(called).size).toBe(8);
		called.forEach((url) => {
			expect(url).toMatch(/^https:\/\/(doi\.org|pmc\.ncbi\.nlm\.nih\.gov)\//);
		});

		openURL.mockRestore();
	});

	it('stays focused on the five questions without a generic interval link', () => {
		const { queryByText } = render(<WhyFiveQuestionsScreen />);

		expect(queryByText('The science behind our reminder intervals')).toBeNull();
	});
});

describe('New note screen help popup', () => {
	it('retains a failed draft, then clears it only after a successful retry', async () => {
		const errorLog = jest.spyOn(console, 'error').mockImplementation(() => {});
		mockAddNote.mockRejectedValueOnce(new Error('Storage unavailable')).mockResolvedValueOnce(undefined);
		const view = render(<NewNoteScreen />);
		const input = view.getByPlaceholderText(mockNotePrompt);
		fireEvent.changeText(input, 'Keep this private reflection');

		await act(async () => { fireEvent.press(view.getByLabelText('Save note')); });

		expect(input.props.value).toBe('Keep this private reflection');
		expect(view.getByText('Unable to save note right now.')).toBeTruthy();
		expect(mockReplace).not.toHaveBeenCalled();

		await act(async () => { fireEvent.press(view.getByLabelText('Save note')); });
		await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/(tabs)/notes'));
		expect(input.props.value).toBe('');
		expect(mockAddNote).toHaveBeenCalledTimes(2);
		errorLog.mockRestore();
	});

	it('accepts only one save while the write is pending', async () => {
		let finishSave!: () => void;
		mockAddNote.mockImplementationOnce(() => new Promise<void>(resolve => { finishSave = resolve; }));
		const view = render(<NewNoteScreen />);
		const input = view.getByPlaceholderText(mockNotePrompt);
		fireEvent.changeText(input, 'Save once');
		act(() => {
			fireEvent.press(view.getByLabelText('Save note'));
			fireEvent.press(view.getByLabelText('Save note'));
		});
		expect(mockAddNote).toHaveBeenCalledTimes(1);
		expect(input.props.editable).toBe(false);
		await act(async () => { finishSave(); });
		await waitFor(() => expect(mockReplace).toHaveBeenCalledTimes(1));
	});

	it('shows the note prompt selected by onboarding', () => {
		mockNotePrompt = 'What insight do you want to try in daily life?';

		const { getByPlaceholderText } = render(<NewNoteScreen />);

		getByPlaceholderText('What insight do you want to try in daily life?');
	});

	it('opens the 5 minute template advice when the question button is pressed', () => {
		const { getByLabelText, getByText, queryByText } = render(<NewNoteScreen />);

		expect(queryByText(/An idea, phrase, realisation/)).toBeNull();

		fireEvent.press(getByLabelText('How to take notes'));

		getByText(/Cheat/);
		getByText('sheet');
		getByText(/What stayed with you from today’s session\?/);
		getByText('One subject is enough.');
	});

	it('closes the popup from the circled back arrow', () => {
		const { getByLabelText, queryByText } = render(<NewNoteScreen />);

		fireEvent.press(getByLabelText('How to take notes'));
		fireEvent.press(getByLabelText('Back'));

		expect(queryByText(/An idea, phrase, realisation/)).toBeNull();
	});
});
