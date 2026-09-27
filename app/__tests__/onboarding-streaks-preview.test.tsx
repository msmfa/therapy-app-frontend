import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

const mockPush = jest.fn();
jest.mock('../../src/features/onboarding/OnboardingAnswersContext', () => ({
    useOnboardingAnswers: () => ({ answers: {
        sessionAt: new Date(2026, 8, 14, 18), cadence: 'weekly',
        morningMinutes: 450, eveningMinutes: 1200,
    } }),
}));
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('../../src/components/onboarding/OnboardingScreen', () => {
    const { View, Text } = require('react-native');
    return {
        ONBOARDING_SCREEN_PADDING: 24,
        OnboardingScreen: ({ headline, supporting, backHref, children, footer, analyticsStep }: { analyticsStep: string; headline: string; supporting?: string; backHref: string; children: React.ReactNode; footer: React.ReactNode }) => (
            <View testID='onboarding-screen' accessibilityHint={ backHref } accessibilityValue={ { text: analyticsStep } }>
                <Text>{ headline }</Text><Text>{ supporting }</Text>{ children }{ footer }
            </View>
        ),
    };
});

import StreaksPreviewScreen from '../(onboarding)/streaks-preview';
import { i18next, formattingLocale } from '../../src/i18n';
import { LANGUAGES } from '../../src/i18n/languages';

afterEach(async () => { await act(async () => { await i18next.changeLanguage('en'); }); });

it('shows the existing widget and connects notes to plans', () => {
    render(<StreaksPreviewScreen />);
    expect(screen.getByText('Your streaks')).toBeTruthy();
    expect(screen.getByTestId('onboarding-screen').props.accessibilityValue.text).toBe('streaks_preview');
    expect(screen.queryByText('Example widget')).toBeNull();
    expect(screen.queryByText('Your progress, at a glance')).toBeNull();
    expect(screen.getByText(/After your session on/)).toBeTruthy();
    expect(screen.getByRole('image', {
        name: 'Medium widget example: Monday and Wednesday complete; Saturday check-in pending. 12-day streak.',
    })).toBeTruthy();
    expect(screen.getByTestId('onboarding-screen').props.accessibilityHint).toBe('/(onboarding)/note-preview');
    fireEvent.press(screen.getByRole('button', { name: 'See plans' }));
    expect(mockPush).toHaveBeenLastCalledWith('/(onboarding)/subscription-preview');
});


it.each(LANGUAGES)('renders the final streaks copy, widget and personal dates in $tag', async ({ tag, resources }) => {
    await act(async () => { await i18next.changeLanguage(tag); });
    render(<StreaksPreviewScreen />);
    const copy = resources.onboarding.streaksPreview;
    expect(screen.getByText(copy.headline)).toBeTruthy();
    expect(screen.getByText(copy.body)).toBeTruthy();
    expect(screen.getByText(copy.widgetBody)).toBeTruthy();
    expect(screen.getByRole('image', { name: resources.settings.widget.mediumDescription })).toBeTruthy();
    expect(screen.getByRole('button', { name: copy.primaryCta })).toBeTruthy();
    const dates = new Intl.DateTimeFormat(formattingLocale(), {
        weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    });
    const times = new Intl.DateTimeFormat(formattingLocale(), { hour: 'numeric', minute: '2-digit' });
    const example = copy.windowExample
        .replace('{{session}}', dates.format(new Date(2026, 8, 14, 18)))
        .replace('{{opens}}', times.format(new Date(2026, 8, 14, 20)))
        .replace('{{closes}}', copy.nextDayAt.replace('{{time}}', times.format(new Date(2026, 8, 15, 4))));
    expect(screen.getByText(example)).toBeTruthy();
});
