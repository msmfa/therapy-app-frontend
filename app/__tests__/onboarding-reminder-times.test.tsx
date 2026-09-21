import React from 'react';
import { act, render, waitFor } from '@testing-library/react-native';

const mockRegisterSignOutTask = jest.fn(() => jest.fn());
let mockSegments: string[] = ['(onboarding)', 'reminder-times'];

// An in-memory keychain that round-trips through the real serialiser, so a
// persistence bug shows up here exactly as it would on a device.
let mockStore: Record<string, string> = {};
jest.mock('expo-secure-store', () => ({
    getItemAsync: async (k: string) => (k in mockStore ? mockStore[k] : null),
    setItemAsync: async (k: string, v: string) => { mockStore[k] = v; },
    deleteItemAsync: async (k: string) => { delete mockStore[k]; },
}));

jest.mock('expo-router', () => ({
    useSegments: () => mockSegments,
    useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));

jest.mock('../../src/context/auth/AuthContext', () => ({
    useAuth: () => ({ user: null, hydrated: true, registerSignOutTask: mockRegisterSignOutTask }),
}));

jest.mock('../../src/features/onboarding/onboardingNotifications', () => ({
    cancelOnboardingReminder: jest.fn(),
}));

// Expose the picker's props so a test can both read what it shows and drive it.
const mockPickers: Record<string, unknown>[] = [];
jest.mock('@react-native-community/datetimepicker', () => {
    const R = require('react');
    const { View } = require('react-native');
    return function MockPicker(props: Record<string, unknown>) {
        mockPickers.push(props);
        return R.createElement(View, { testID: `picker-${props.accessibilityLabel ?? 'x'}` });
    };
});

jest.mock('../../src/components/onboarding/OnboardingScreen', () => {
    const R = require('react');
    const { View } = require('react-native');
    return {
        OnboardingScreen: ({
            supporting,
            children,
            footer,
        }: { supporting?: string; children?: React.ReactNode; footer?: React.ReactNode }) => {
            const { Text } = require('react-native');
            return R.createElement(
                View,
                null,
                supporting === undefined ? null : R.createElement(Text, null, supporting),
                children,
                footer,
            );
        },
    };
});

import { OnboardingAnswersProvider } from '../../src/features/onboarding/OnboardingAnswersContext';
import { timeLabel } from '../../src/features/onboarding/formatting';
import { reminderTimesCopy } from '../../src/features/onboarding/onboardingCopy';
import type { GoalId } from '../../src/features/onboarding/onboardingCopy';
import ReminderTimesScreen from '../(onboarding)/reminder-times';

const at = (h: number, m: number) => {
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
};

const renderScreen = () =>
    render(
        <OnboardingAnswersProvider>
            <ReminderTimesScreen />
        </OnboardingAnswersProvider>,
    );

const morningPicker = () => mockPickers.filter((p) => String(p.accessibilityLabel).startsWith('Morning')).pop();

/**
 * Proves the answer itself survives the flow. The displayed digits are covered
 * separately in features/onboarding/__tests__/timeLabel.test.ts, because a
 * correct stored value and a wrong label look identical to a user.
 */
describe('reminder times: what surrounds the pickers', () => {
    beforeEach(() => {
        mockStore = {};
        mockPickers.length = 0;
    });

    it("shows the tester's words beneath the time rows", async () => {
        const view = renderScreen();
        await waitFor(() => expect(morningPicker()).toBeDefined());

        // The quotation and who said it, whatever the testimonial is set to.
        expect(view.getByText(new RegExp(reminderTimesCopy().testimonial.quote.slice(0, 40)))).toBeTruthy();
        expect(view.getByText(reminderTimesCopy().testimonial.name)).toBeTruthy();
        view.unmount();
    });

    it('keeps the reminder-frequency sentence without the opening instruction', async () => {
        const view = renderScreen();
        await waitFor(() => expect(morningPicker()).toBeDefined());

        expect(view.getByText(reminderTimesCopy().morningLabel)).toBeTruthy();
        expect(view.getByText(reminderTimesCopy().eveningLabel)).toBeTruthy();
        expect(view.getByText("You'll only receive one morning reminder a week, after your session.")).toBeTruthy();
        expect(view.queryByText(/Pick a time in the morning/)).toBeNull();
        view.unmount();
    });
});

/**
 * The screen asks for two times and, underneath, hands the reader someone
 * else's experience of them. Whose experience is not incidental: a general
 * endorsement of the app leaves the reader to do the translating from what
 * they said they wanted into what the quote is about.
 */
describe('reminder times: whose words the screen carries', () => {
    beforeEach(() => {
        mockStore = {};
        mockPickers.length = 0;
    });

    /** Seeds the keychain draft the provider hydrates from. */
    const withGoal = (goal: string | null) => {
        mockStore['onboarding.draft.v1.anon'] = JSON.stringify({ goal });
    };

    it.each([
        ['practise', 'Marcus'],
        ['prepare', 'Sarah'],
        ['habit', 'Priya'],
    ])('carries the %s testimonial when that is the chosen goal', async (goal, name) => {
        withGoal(goal);
        const view = renderScreen();
        await waitFor(() => expect(morningPicker()).toBeDefined());

        const expected = reminderTimesCopy(goal as GoalId).testimonial;
        await waitFor(() => expect(view.getByText(expected.name)).toBeTruthy());
        expect(expected.name).toBe(name);
        expect(view.getByText(new RegExp(expected.quote.slice(0, 40)))).toBeTruthy();
        view.unmount();
    });

    it('falls back to the preparation quote when no goal has been chosen', async () => {
        withGoal(null);
        const view = renderScreen();
        await waitFor(() => expect(morningPicker()).toBeDefined());

        // What the screen carried for everybody before the quotes were split,
        // so a draft with no answer yet is never left without one.
        expect(view.getByText(reminderTimesCopy('prepare').testimonial.name)).toBeTruthy();
        view.unmount();
    });

    it('gives each goal a different person and a different quote', () => {
        const goals: GoalId[] = ['practise', 'prepare', 'habit'];
        const names = goals.map((goal) => reminderTimesCopy(goal).testimonial.name);
        const quotes = goals.map((goal) => reminderTimesCopy(goal).testimonial.quote);

        expect(new Set(names).size).toBe(goals.length);
        expect(new Set(quotes).size).toBe(goals.length);
    });
});

describe('reminder times: picking a time', () => {
    beforeEach(() => {
        mockStore = {};
        mockPickers.length = 0;
        mockSegments = ['(onboarding)', 'reminder-times'];
    });

    it('shows the time the user picked, not 0:00', async () => {
        const view = renderScreen();
        await waitFor(() => expect(morningPicker()).toBeDefined());

        const before = morningPicker()!;
        expect(String(before.accessibilityLabel)).toContain(timeLabel(at(7, 30)));

        await act(async () => {
            (before.onChange as (e: unknown, d?: Date) => void)({ type: 'set' }, at(6, 45));
        });

        await waitFor(() => {
            const after = morningPicker()!;
            expect(String(after.accessibilityLabel)).toContain(timeLabel(at(6, 45)));
        });
        view.unmount();
    });

    it('does not let closing the picker overwrite the pick just made', async () => {
        const view = renderScreen();
        await waitFor(() => expect(morningPicker()).toBeDefined());

        // Scroll to 6:45, then let go. Closing the compact popover fires a
        // second change of type "dismissed" whose date is the value the render
        // that opened it was showing, which is the old time, not the choice.
        // This is the event sequence the device produces for "tap, pick,
        // release", and it is what kept snapping the field back.
        const picker = morningPicker()!;
        const fire = picker.onChange as (e: unknown, d?: Date) => void;
        await act(async () => {
            fire({ type: 'set' }, at(6, 45));
        });
        await act(async () => {
            fire({ type: 'dismissed' }, at(7, 30));
        });

        await waitFor(() => {
            const after = morningPicker()!;
            expect((after.value as Date).getHours()).toBe(6);
            expect((after.value as Date).getMinutes()).toBe(45);
        });
        view.unmount();
    });

    it('hands the picker the same value object across re-renders', async () => {
        const view = renderScreen();
        await waitFor(() => expect(morningPicker()).toBeDefined());

        const first = morningPicker()!;
        mockPickers.length = 0;

        // Anything at all that re-renders the screen. The iOS picker is
        // controlled: a value it has not seen before is pushed down to the
        // native control, which snaps the wheel back and discards whatever the
        // user had just scrolled to. Tapping and releasing was enough.
        view.rerender(
            <OnboardingAnswersProvider>
                <ReminderTimesScreen />
            </OnboardingAnswersProvider>,
        );

        await waitFor(() => expect(morningPicker()).toBeDefined());
        const second = morningPicker()!;

        expect(second.value).toBe(first.value);
        expect(second.onChange).toBe(first.onChange);
        view.unmount();
    });

    it('gives the picker a new value only when the answer actually changes', async () => {
        const view = renderScreen();
        await waitFor(() => expect(morningPicker()).toBeDefined());

        const before = morningPicker()!;
        await act(async () => {
            (before.onChange as (e: unknown, d?: Date) => void)({ type: 'set' }, at(6, 45));
        });

        await waitFor(() => {
            const after = morningPicker()!;
            expect((after.value as Date).getHours()).toBe(6);
            expect((after.value as Date).getMinutes()).toBe(45);
        });
        view.unmount();
    });

    it('keeps the picked time when navigating away and back', async () => {
        const first = renderScreen();
        await waitFor(() => expect(morningPicker()).toBeDefined());

        await act(async () => {
            (morningPicker()!.onChange as (e: unknown, d?: Date) => void)({ type: 'set' }, at(6, 45));
        });
        await waitFor(() =>
            expect(String(morningPicker()!.accessibilityLabel)).toContain(timeLabel(at(6, 45))));
        await act(async () => { await Promise.resolve(); });
        first.unmount();

        // Back to cadence, then forward again: the provider stays mounted and
        // the draft is what has to carry the answer.
        mockSegments = ['(onboarding)', 'session-cadence'];
        mockPickers.length = 0;
        mockSegments = ['(onboarding)', 'reminder-times'];
        renderScreen();

        await waitFor(() => expect(morningPicker()).toBeDefined());
        expect(String(morningPicker()!.accessibilityLabel)).toContain(timeLabel(at(6, 45)));
    });
});
