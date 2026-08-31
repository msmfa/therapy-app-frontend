import React from 'react';
import { jest } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';

import HowToTakeNotesScreen from '../how-to-take-notes';
import WhyFiveQuestionsScreen from '../why-five-questions';

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

    it('links through to the reminder interval science page', () => {
        const { getByText } = render(<WhyFiveQuestionsScreen />);

        fireEvent.press(getByText('The science behind our reminder intervals'));

        expect(mockPush).toHaveBeenCalledWith('/interval-science');
    });
});
