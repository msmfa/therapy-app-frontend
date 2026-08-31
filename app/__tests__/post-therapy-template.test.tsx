import React from 'react';
import { jest } from '@jest/globals';
import { Linking } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';

import HowToTakeNotesScreen from '../how-to-take-notes';
import WhyFiveQuestionsScreen from '../why-five-questions';
import NewNoteScreen from '../(tabs)/index';

const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
    useRouter: () => ({ push: mockPush, back: mockBack }),
}));

jest.mock('react-native-safe-area-context', () => {
    const React = require('react');
    const { View } = require('react-native');
    return {
        SafeAreaView: View,
        SafeAreaProvider: ({ children }: { children: React.ReactNode }) => <View>{ children }</View>,
        useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
    };
});

jest.mock('../../src/context/auth/AuthContext', () => ({
    useAuth: () => ({ user: { id: 'user-1' } }),
}));

jest.mock('../../src/features/notes/useNotes', () => ({
    useNotes: () => ({ addNote: jest.fn() }),
}));

beforeEach(() => {
    mockPush.mockClear();
    mockBack.mockClear();
});

describe('5 Minute Post Therapy Template', () => {
    it('renders the title, the intro and all five questions with their hints', () => {
        const { getByText } = render(<HowToTakeNotesScreen />);

        getByText('5 Minute Post Therapy Template');
        getByText('Answer these 5 questions after your session');
        getByText(/Write as much or as little as feels useful/);

        getByText(/What stayed with me from today’s session\?/);
        getByText('An idea, phrase, realisation or moment you do not want to lose.');

        getByText(/What situation, thought or feeling do I want to notice this week\?/);
        getByText('Something connected to what you discussed, if there is one.');

        getByText(/What did I understand differently\?/);
        getByText('Keep this in your own words.');

        getByText(/Is there anything I want to try or remember\?/);
        getByText('Leave this blank if nothing was agreed or suggested.');

        getByText(/What do I want to return to in my next session\?/);
        getByText('One subject is enough.');
    });

    it('navigates to the rationale page from the bottom button', () => {
        const { getByText } = render(<HowToTakeNotesScreen />);

        fireEvent.press(getByText('Why these five questions'));

        expect(mockPush).toHaveBeenCalledWith('/why-five-questions');
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

    it('links through to the reminder interval science page', () => {
        const { getByText } = render(<WhyFiveQuestionsScreen />);

        fireEvent.press(getByText('The science behind our reminder intervals'));

        expect(mockPush).toHaveBeenCalledWith('/interval-science');
    });
});

describe('New note screen help popup', () => {
    it('opens the 5 minute template advice when the question button is pressed', () => {
        const { getByLabelText, getByText, queryByText } = render(<NewNoteScreen />);

        expect(queryByText('Answer these 5 questions after your session')).toBeNull();

        fireEvent.press(getByLabelText('How to take notes'));

        getByText(/Cheat/);
        getByText('sheet');
        getByText('Answer these 5 questions after your session');
        getByText(/What stayed with me from today’s session\?/);
        getByText('One subject is enough.');
    });

    it('closes the popup from the circled back arrow', () => {
        const { getByLabelText, queryByText } = render(<NewNoteScreen />);

        fireEvent.press(getByLabelText('How to take notes'));
        fireEvent.press(getByLabelText('Back'));

        expect(queryByText('Answer these 5 questions after your session')).toBeNull();
    });
});
