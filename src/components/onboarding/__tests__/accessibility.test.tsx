import React from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { act, fireEvent, render, renderHook, within } from '@testing-library/react-native';
import { SelectableCard, useEqualSelectableCardHeights } from '../SelectableCard';
import { SubscriptionPlanCard } from '../SubscriptionPlanCard';
import { OnboardingProgress } from '../OnboardingProgress';
import {
	OnboardingScreen,
	shouldUseCombinedOnboardingScroll,
} from '../OnboardingScreen';
import { OnboardingButton as Button } from '../OnboardingButton';
import { NoteTemplateSheet } from '../NoteTemplateSheet';
import { postTherapyQuestions } from '../../../constants/postTherapyTemplate';
import { darkTheme, type Theme } from 'designs/designs-themes';
import { contrastRatio } from '../../../utils/colorContrast';

jest.mock('expo-router', () => ({
    useRouter: () => ({ canGoBack: () => true, back: jest.fn(), replace: jest.fn() }),
}));

jest.mock('@expo/vector-icons', () => ({
	Feather: () => null,
}));

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
	__esModule: true,
	default: jest.fn(() => ({ width: 390, height: 844, scale: 3, fontScale: 1 })),
}));

const mockUseWindowDimensions = useWindowDimensions as jest.MockedFunction<
	typeof useWindowDimensions
>;

beforeEach(() => {
	mockUseWindowDimensions.mockReturnValue({ width: 390, height: 844, scale: 3, fontScale: 1 });
});

describe('SelectableCard accessibility', () => {
	it('exposes a radio role and its selected state', () => {
		const { getByRole } = render(
			<SelectableCard label="Remember what mattered" selected onPress={() => {}} />,
		);

		const card = getByRole('radio', { name: 'Remember what mattered' });
		expect(card.props.accessibilityState.selected).toBe(true);
		expect(card.props.accessibilityState.checked).toBe(true);
	});

	it('reports an unselected card as unselected', () => {
		const { getByRole } = render(
			<SelectableCard label="Make reflection a habit" selected={false} onPress={() => {}} />,
		);

		const card = getByRole('radio', { name: 'Make reflection a habit' });
		expect(card.props.accessibilityState.selected).toBe(false);
	});

	it('meets the 44pt minimum touch target', () => {
		const { getByRole } = render(
			<SelectableCard label="Know what to bring back" selected={false} onPress={() => {}} />,
		);

		const flattened = StyleSheet.flatten(getByRole('radio').props.style) as {
			minHeight?: number;
		};
		expect(flattened.minHeight).toBeGreaterThanOrEqual(44);
	});

	it('takes the height the group hands it', () => {
		const { getByRole } = render(
			<SelectableCard label="It varies" selected={false} height={108} onPress={() => {}} />,
		);

		const flattened = StyleSheet.flatten(getByRole('radio').props.style) as {
			minHeight?: number;
		};
		// A floor, never a cap: a label that needs more room still gets it.
		expect(flattened.minHeight).toBe(108);
	});

	it('gives every option in a group the tallest one\'s height', () => {
		const { result } = renderHook(() => useEqualSelectableCardHeights());

		expect(result.current.height).toBeUndefined();

		act(() => {
			result.current.onCardLayout({ nativeEvent: { layout: { height: 72 } } } as never);
		});
		expect(result.current.height).toBe(72);

		// The three-line option arrives and lifts the whole group.
		act(() => {
			result.current.onCardLayout({ nativeEvent: { layout: { height: 108 } } } as never);
		});
		expect(result.current.height).toBe(108);

		// A shorter card reported afterwards must not pull them back down.
		act(() => {
			result.current.onCardLayout({ nativeEvent: { layout: { height: 84 } } } as never);
		});
		expect(result.current.height).toBe(108);
	});

	it('keeps the checkmark\'s slot whether or not it is chosen', () => {
		// Adding the slot on selection took 24pt off the label, which could
		// rewrap it, so the card jumped under the finger that chose it.
		const unselected = render(
			<SelectableCard label="Track my progress over time" selected={false} onPress={() => {}} />,
		);
		expect(unselected.getByTestId('selectable-card-check')).toBeTruthy();
		unselected.unmount();

		const selected = render(
			<SelectableCard label="Track my progress over time" selected onPress={() => {}} />,
		);
		expect(selected.getByTestId('selectable-card-check')).toBeTruthy();
	});
});

describe('SubscriptionPlanCard accessibility', () => {
	it('reads the plan, price and renewal terms in one label', () => {
		const { getByRole } = render(
			<SubscriptionPlanCard
				title="Annual"
				badge="Best value"
				trialBadge="2 weeks free"
				priceLine="Then £39.99 per year"
				renewalLine="Renews annually until cancelled."
				selected
				onPress={() => {}}
				accessibilityLabel="Annual. 2 weeks free. £39.99 per year. Renews annually until cancelled."
			/>,
		);

		const card = getByRole('radio', {
			name: 'Annual. 2 weeks free. £39.99 per year. Renews annually until cancelled.',
		});
		expect(card.props.accessibilityState.selected).toBe(true);
	});
});

describe('OnboardingProgress accessibility', () => {
	it('publishes its position as a progressbar value', () => {
		const { getByRole } = render(<OnboardingProgress step={3} />);

		const bar = getByRole('progressbar', { name: 'Step 3 of 4' });
		expect(bar.props.accessibilityValue).toEqual({ min: 0, max: 4, now: 3 });
	});

	it('uses a zero baseline so iOS announces the final step as 100 percent', () => {
		const { getByRole } = render(<OnboardingProgress step={4} />);

		const value = getByRole('progressbar', { name: 'Step 4 of 4' }).props.accessibilityValue;
		expect(value.now / (value.max - value.min)).toBe(1);
	});

	it('clamps a step outside the range', () => {
		const { getByRole } = render(<OnboardingProgress step={9} />);

		expect(getByRole('progressbar', { name: 'Step 4 of 4' })).toBeTruthy();
	});
});

describe('Button accessibility states', () => {
    it.each([false, true])('blocks repeat taps while loading (secondary: %s)', (transparent) => {
        const onPress = jest.fn();
        const screen = render(<Button label="Continue" loading transparent={transparent} onPress={onPress} />);
        fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
        expect(onPress).not.toHaveBeenCalled();

        screen.rerender(<Button label="Continue" transparent={transparent} onPress={onPress} />);
        fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
        expect(onPress).toHaveBeenCalledTimes(1);
    });

	it('reports busy while loading so VoiceOver does not read it as unavailable', () => {
		const { getByRole } = render(
			<Button label="Continue with Apple" loading onPress={() => {}} />,
		);

		const button = getByRole('button', { name: 'Continue with Apple' });
		expect(button.props.accessibilityState.busy).toBe(true);
		expect(button.props.accessibilityState.disabled).toBe(true);
	});

	it('reports disabled without busy when it is simply not available yet', () => {
		const { getByRole } = render(<Button label="Continue" disabled onPress={() => {}} />);

		const button = getByRole('button', { name: 'Continue' });
		expect(button.props.accessibilityState.disabled).toBe(true);
		expect(button.props.accessibilityState.busy).toBe(false);
	});

	it('meets the 44pt minimum touch target', () => {
		const { getByRole } = render(<Button label="Continue" onPress={() => {}} />);
		const flattened = StyleSheet.flatten(getByRole('button').props.style) as {
			minHeight?: number;
		};

		expect(flattened.minHeight).toBeGreaterThanOrEqual(44);
	});
});

describe('Note preview questions', () => {
	it('exposes each sample question to VoiceOver instead of one container label', () => {
		const { getByLabelText } = render(<NoteTemplateSheet />);

		expect(
			getByLabelText(`Question 1 of 5. ${postTherapyQuestions()[0].question}`),
		).toBeTruthy();
		expect(
			getByLabelText(`Question 2 of 5. ${postTherapyQuestions()[1].question}`),
		).toBeTruthy();
	});
});

describe('OnboardingScreen layout contract', () => {
    it('keeps a long title in the scroll with its actions at accessibility sizes', () => {
        mockUseWindowDimensions.mockReturnValue({ width: 375, height: 667, scale: 2, fontScale: 3.12 });
        const headline = 'Your account is ready, but your purchase could not be completed';
        const screen = render(
            <OnboardingScreen
                backHref="/(onboarding)/subscription-preview"
                headline={headline}
                footer={<Button label="Try again" onPress={() => {}} />}
            />,
        );
        const scroll = within(screen.getByTestId('onboarding-combined-scroll'));
        expect(scroll.getByRole('header', { name: headline })).toBeTruthy();
        expect(scroll.getByRole('button', { name: 'Try again' })).toBeTruthy();
    });

	it('uses one continuous scroll only for accessibility text sizes', () => {
		expect(shouldUseCombinedOnboardingScroll(1.35)).toBe(false);
		expect(shouldUseCombinedOnboardingScroll(1.5)).toBe(true);
		expect(shouldUseCombinedOnboardingScroll(3.12)).toBe(true);
	});

	it('keeps a capped, pinned footer at standard text sizes', () => {
		const { getByTestId } = render(
			<OnboardingScreen
				showBack={false}
				headline="Save your between-session plan"
				footer={<Button label="Continue" onPress={() => {}} />}
			/>,
		);

		const footer = StyleSheet.flatten(getByTestId('onboarding-footer').props.style) as {
			maxHeight?: string;
		};

		expect(footer.maxHeight).toBe('45%');
	});

	it('puts the body and footer in one scroll at accessibility text sizes', () => {
		mockUseWindowDimensions.mockReturnValue({
			width: 390,
			height: 844,
			scale: 3,
			fontScale: 3.12,
		});

		const { getByRole, getByTestId } = render(
			<OnboardingScreen
				showBack={false}
				headline="Put your plan into practice"
				footer={<Button label="Start my free trial" onPress={() => {}} />}
			/>,
		);

		expect(getByTestId('onboarding-combined-scroll')).toBeTruthy();
		expect(getByTestId('onboarding-footer')).toBeTruthy();
		expect(getByRole('button', { name: 'Start my free trial' })).toBeTruthy();
	});
});

/**
 * Every pair of type and the ground it is read on, in the worst case that
 * ground takes: a card at the top of the screen, where the gradient is
 * lightest. Nothing here can regress silently: there are no snapshots, and a
 * grey that drifts two points darker reads fine to the eye that chose it.
 */
const textPairs = (theme: Theme): [string, string, string[]][] => {
	const top = theme.ground.gradient[0];
	const onCard = [theme.surface.card, top];
	return [
		['primary ink on a card', theme.ink.primary, onCard],
		['secondary ink on a card', theme.ink.secondary, onCard],
		['tertiary ink on a card', theme.ink.tertiary, onCard],
		['quaternary ink on a card', theme.ink.quaternary, onCard],
		['secondary ink on a row group in a card', theme.ink.secondary, [theme.surface.rowGroup, ...onCard]],
		['primary ink on the sheet', theme.ink.primary, [theme.surface.sheet]],
		['secondary ink on the sheet', theme.ink.secondary, [theme.surface.sheet]],
		['primary ink on a modal', theme.ink.primary, [theme.surface.modal]],
		['secondary ink on a modal', theme.ink.secondary, [theme.surface.modal]],
		['the onboarding link on a card', theme.link.color, onCard],
		['the inline link on a card', theme.link.bright, onCard],
		['an error on a card', theme.status.error, onCard],
		['the danger text on a card', theme.status.dangerText, onCard],
		['orange as a sentence on a card', theme.accent.markInk, onCard],
		['a disabled solid label on a card', theme.solid.disabledText, onCard],
		['a disabled glass label on a card', theme.glass.disabledLabel, onCard],
		['the solid pill label', theme.solid.text, [theme.solid.background]],
		['the accent screen heading', theme.accentScreen.textPrimary, [theme.accentScreen.card, theme.accentScreen.ground]],
		['the accent screen body', theme.accentScreen.textSecondary, [theme.accentScreen.card, theme.accentScreen.ground]],
		['a chosen option label', theme.chosen.ink, [theme.chosen.fill]],
		['a chosen plan title', theme.plan.inkBright, [theme.plan.fill]],
		['a chosen plan renewal line', theme.plan.inkBrightest, [theme.plan.fill]],
		['a chosen plan trial badge', theme.plan.trialText, [theme.plan.trialFill]],
		['the supporting banner', theme.emphasis.ink, [theme.emphasis.panel]],
		['the science summary', theme.emphasis.inkSecondary, [theme.emphasis.panel]],
		['a quote attribution', theme.emphasis.inkMuted, [theme.emphasis.panel]],
		['the trial badge', theme.trialBadge.text, [theme.trialBadge.background, ...onCard]],
		['a red badge', theme.red.dark, [theme.red.light, ...onCard]],
		['the month title', theme.calendar.month.monthText, [theme.calendar.backdrop.base[0], top]],
		['the weekday headers', theme.calendar.month.weekdayHeader, [theme.calendar.backdrop.base[0], top]],
		['a day numeral', theme.calendar.month.dayDefault, [theme.calendar.backdrop.base[0], top]],
		['today\'s numeral', theme.calendar.month.todayText, [theme.calendar.month.todayBackground]],
		['a session day numeral', theme.calendar.month.sessionFillText, [theme.calendar.month.sessionFill]],
		['the schedule sheet ink', theme.ink.secondary, [theme.calendar.sheet.surface]],
	];
};

describe('dark theme contrast', () => {
	it.each(textPairs(darkTheme))('%s reads at 4.5:1 or better', (_label, text, layers) => {
		expect(contrastRatio(text, ...layers)).toBeGreaterThanOrEqual(4.5);
	});
});
