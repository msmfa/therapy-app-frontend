import {
	PURCHASE_COPY,
	GOAL_COPY,
	GOAL_OPTIONS,
	REMINDER_TIMES_COPY,
	SUBSCRIPTION_COPY,
	SUCCESS_COPY,
	cadenceScheduleDisclosure,
	notificationsHeadline,
	planCtaLabel,
	planBody,
	planPriceLine,
	planRenewalLine,
	successCopy,
	trialBadgeLine,
	trialEndLine,
} from '../onboardingCopy';

describe('goal copy', () => {
	it('asks one clear outcome question and offers the three intended choices', () => {
		expect(GOAL_COPY.headline).toBe('What would help you get more from therapy?');
		expect(GOAL_OPTIONS.map(({ label }) => label)).toEqual([
			'Put therapy insights into practice throughout the week',
			'Be better prepared for my next session',
			'Gain insight into areas I can improve across my therapy sessions',
		]);
	});
});

describe('successCopy', () => {
	it('names the reminder without claiming the still-unsaved plan already exists', () => {
		const { headline, body } = successCopy(true, 'Tuesday', '8:00 pm');

		expect(headline).toBe('Your between-session plan is ready');
		expect(body).toBe(
			'Save it now and your first note reminder will arrive Tuesday at 8:00 pm.',
		);
		expect(body).not.toMatch(/reminder is set/);
	});

	it('never claims a reminder that was not scheduled', () => {
		const { headline, body } = successCopy(false, 'Tuesday', '8:00 pm');

		expect(headline).toBe(SUCCESS_COPY.headline);
		expect(body).toBe(SUCCESS_COPY.withoutRemindersBody);
		expect(body).not.toMatch(/reminder is set/);
		expect(body).not.toMatch(/Tuesday/);
	});
});

describe('subscription offer copy', () => {
	it('describes renewal only when a trial runs first', () => {
		expect(planRenewalLine('annual', true)).toBe(SUBSCRIPTION_COPY.annualRenewal);
		expect(planRenewalLine('monthly', true)).toBe(SUBSCRIPTION_COPY.monthlyRenewal);
		expect(planRenewalLine('annual', true)).not.toMatch(/today/i);
		expect(planRenewalLine('monthly', true)).not.toMatch(/today/i);
	});

	it('makes the first charge explicit when there is no trial', () => {
		expect(planRenewalLine('annual', false)).toMatch(/Billed today/);
		expect(planRenewalLine('monthly', false)).toMatch(/Billed today/);
	});

	it('uses the duration and billing cycle of the selected product', () => {
		const monthlyTrial = { periods: 1, period: 'week' } as const;

		expect(trialBadgeLine(monthlyTrial)).toBe('1 week free');
		expect(planCtaLabel('monthly', true, monthlyTrial)).toBe(
			'Start my 1-week free trial',
		);
		expect(planPriceLine('monthly', '£4.99', true)).toBe('Then £4.99 per month');
		expect(trialEndLine('monthly', '£4.99')).toBe(
			'Your monthly subscription begins at £4.99 per month unless cancelled.',
		);
	});
});

describe('purchase copy', () => {
	it('does not describe a cancellation as a failure', () => {
		expect(PURCHASE_COPY.cancelledTitle).not.toMatch(/couldn't|error|failed/i);
		expect(PURCHASE_COPY.errorTitle).toMatch(/couldn't/);
	});
});

describe('reminder-time copy', () => {
	it('does not imply the evening preference controls the post-session note', () => {
		expect(REMINDER_TIMES_COPY.eveningHint).not.toMatch(/after sessions?/i);
		expect(REMINDER_TIMES_COPY.eveningHint).toMatch(/later in the week/i);
		expect(notificationsHeadline('Tuesday', '6:00 pm')).toBe(
			'Get your first note reminder Tuesday at 6:00 pm',
		);
	});
});

describe('variable session copy', () => {
	it('does not promise review dates before another session is known', () => {
		expect(planBody('varies')).toMatch(/Add your following session/);
		expect(planBody('weekly')).toMatch(/revisit it through the gap/);
	});
});

describe('cadence schedule disclosure', () => {
	it('states the six-month weekly schedule before it is created', () => {
		expect(cadenceScheduleDisclosure('weekly', true)).toBe(
			"We'll add weekly sessions at this time for the next six months. You can edit individual dates.",
		);
	});

	it('does not claim that example sessions will be saved', () => {
		expect(cadenceScheduleDisclosure('weekly', false)).toBe(
			"No sessions will be added yet. Add your first booked date in Calendar and we'll build the schedule from there.",
		);
	});

	it('does not invent recurring dates when cadence varies', () => {
		expect(cadenceScheduleDisclosure('varies', true)).toBe(
			"We'll add this session only. Add future dates as you book them.",
		);
	});
});

describe('tone rules', () => {
	it('uses no exclamation marks anywhere in onboarding copy', () => {
		const copy = jest.requireActual<Record<string, unknown>>('../onboardingCopy');
		const strings: string[] = [];

		const walk = (value: unknown): void => {
			if (typeof value === 'string') strings.push(value);
			else if (Array.isArray(value)) value.forEach(walk);
			else if (value && typeof value === 'object') Object.values(value).forEach(walk);
		};
		walk(copy);

		expect(strings.filter((entry) => entry.includes('!'))).toEqual([]);
	});
});
