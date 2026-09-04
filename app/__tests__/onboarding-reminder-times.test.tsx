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

    it("shows Mark's words beneath the time rows", async () => {
        const view = renderScreen();
        await waitFor(() => expect(morningPicker()).toBeDefined());

        expect(view.getByText(/keeps me accountable/)).toBeTruthy();
        expect(view.getByText('Mark')).toBeTruthy();
        view.unmount();
    });

    it('tells people in the opening text that the times can be changed later', async () => {
        const view = renderScreen();
        await waitFor(() => expect(morningPicker()).toBeDefined());

        expect(view.getByText(/You can update these in Settings at any time/)).toBeTruthy();
        view.unmount();
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
