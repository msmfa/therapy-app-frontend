import React from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { render } from '@testing-library/react-native';
import { SelectableCard } from '../SelectableCard';
import { SubscriptionPlanCard } from '../SubscriptionPlanCard';
import { OnboardingProgress } from '../OnboardingProgress';
import {
	OnboardingScreen,
	shouldUseCombinedOnboardingScroll,
} from '../OnboardingScreen';
import { Button } from '../../ui/Button';
import { NoteTemplateSheet } from '../NoteTemplateSheet';
import { POST_THERAPY_QUESTIONS } from '../../../constants/postTherapyTemplate';

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
		expect(bar.props.accessibilityValue).toEqual({ min: 1, max: 4, now: 3 });
	});

	it('clamps a step outside the range', () => {
		const { getByRole } = render(<OnboardingProgress step={9} />);

		expect(getByRole('progressbar', { name: 'Step 4 of 4' })).toBeTruthy();
	});
});

describe('Button accessibility states', () => {
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
			getByLabelText(`Question 1 of 5. ${POST_THERAPY_QUESTIONS[0].question}`),
		).toBeTruthy();
		expect(
			getByLabelText(`Question 2 of 5. ${POST_THERAPY_QUESTIONS[1].question}`),
		).toBeTruthy();
	});
});

describe('OnboardingScreen layout contract', () => {
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
