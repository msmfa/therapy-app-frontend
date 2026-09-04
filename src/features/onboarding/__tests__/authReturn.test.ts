import {
    ACCOUNT_STEP_RETURN,
    PASSWORD_RESET_AUTH_SOURCE,
    SUBSCRIPTION_STEP_RETURN,
    WELCOME_AUTH_SOURCE,
    consumePendingOnboardingStep,
    peekPendingOnboardingStep,
    resolveAuthEntrySource,
    resolveAuthReturnRoute,
    setPendingOnboardingStep,
} from '../authReturn';

const ACCOUNT = '/(onboarding)/account-preview';

describe('resolveAuthReturnRoute', () => {
    it('resolves the account step return key', () => {
        expect(resolveAuthReturnRoute(ACCOUNT_STEP_RETURN)).toBe(ACCOUNT);
    });

    it('resolves the subscription return used by signed-out restore', () => {
        expect(resolveAuthReturnRoute(SUBSCRIPTION_STEP_RETURN)).toBe(
            '/(onboarding)/subscription-preview',
        );
    });

    it('takes the first value when the param repeats', () => {
        expect(resolveAuthReturnRoute(['account-preview', 'goal'])).toBe(ACCOUNT);
    });

    it('returns null when no returnTo was supplied', () => {
        expect(resolveAuthReturnRoute(undefined)).toBeNull();
    });

    it('refuses routes that are not allow-listed', () => {
        expect(resolveAuthReturnRoute('/(tabs)/notes')).toBeNull();
        expect(resolveAuthReturnRoute('notifications-preview')).toBeNull();
        expect(resolveAuthReturnRoute('https://evil.example.com')).toBeNull();
    });

    it('does not resolve inherited Object properties', () => {
        expect(resolveAuthReturnRoute('constructor')).toBeNull();
        expect(resolveAuthReturnRoute('__proto__')).toBeNull();
        expect(resolveAuthReturnRoute('toString')).toBeNull();
    });
});

describe('resolveAuthEntrySource', () => {
    it('accepts deliberate standalone sign-in entry points', () => {
        expect(resolveAuthEntrySource(WELCOME_AUTH_SOURCE)).toBe('welcome');
        expect(resolveAuthEntrySource(PASSWORD_RESET_AUTH_SOURCE)).toBe('password-reset');
    });

    it('takes the first value when the source param repeats', () => {
        expect(resolveAuthEntrySource(['welcome', 'unknown'])).toBe('welcome');
    });

    it('rejects missing and unrecognised sources', () => {
        expect(resolveAuthEntrySource(undefined)).toBeNull();
        expect(resolveAuthEntrySource('restored-route')).toBeNull();
        expect(resolveAuthEntrySource('__proto__')).toBeNull();
    });
});

describe('pending onboarding step', () => {
    afterEach(() => {
        setPendingOnboardingStep(null);
    });

    it('is null until a step is set', () => {
        expect(consumePendingOnboardingStep()).toBeNull();
    });

    it('hands back the step once and then clears', () => {
        setPendingOnboardingStep(ACCOUNT_STEP_RETURN);

        expect(consumePendingOnboardingStep()).toBe(ACCOUNT);
        expect(consumePendingOnboardingStep()).toBeNull();
    });

    it('can redirect through Welcome without consuming the pending action', () => {
        setPendingOnboardingStep(SUBSCRIPTION_STEP_RETURN);

        expect(peekPendingOnboardingStep()).toBe('/(onboarding)/subscription-preview');
        expect(peekPendingOnboardingStep()).toBe('/(onboarding)/subscription-preview');
        expect(consumePendingOnboardingStep(SUBSCRIPTION_STEP_RETURN)).toBe(
            '/(onboarding)/subscription-preview',
        );
        expect(peekPendingOnboardingStep()).toBeNull();
    });

    it('does not let one destination consume another destination\'s handoff', () => {
        setPendingOnboardingStep(ACCOUNT_STEP_RETURN);

        expect(consumePendingOnboardingStep(SUBSCRIPTION_STEP_RETURN)).toBeNull();
        expect(consumePendingOnboardingStep(ACCOUNT_STEP_RETURN)).toBe(ACCOUNT);
    });

    it('can be cleared without being consumed', () => {
        setPendingOnboardingStep(ACCOUNT_STEP_RETURN);
        setPendingOnboardingStep(null);

        expect(consumePendingOnboardingStep()).toBeNull();
    });
});
