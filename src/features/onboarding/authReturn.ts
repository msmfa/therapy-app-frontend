import type { Href } from 'expo-router';

/**
 * Routes an auth screen is allowed to hand back to once sign-in succeeds.
 *
 * `returnTo` arrives as a query param, and query params survive deep links, so
 * the value is looked up in this map rather than being navigated to directly.
 * An unrecognised value resolves to null and the caller falls back to '/', which
 * re-runs the normal auth/onboarding routing decision.
 */
const AUTH_RETURN_ROUTES = {
    'account-preview': '/(onboarding)/account-preview',
    'subscription-preview': '/(onboarding)/subscription-preview',
} as const;

const AUTH_ENTRY_SOURCES = {
    welcome: true,
    'password-reset': true,
} as const;

export type AuthReturnKey = keyof typeof AUTH_RETURN_ROUTES;
export type AuthEntrySource = keyof typeof AUTH_ENTRY_SOURCES;

/**
 * Where the account step of onboarding resumes after a successful sign-in.
 *
 * Back to the account step itself rather than onward: authentication is what
 * triggers the purchase handoff, and that is started from there.
 */
export const ACCOUNT_STEP_RETURN: AuthReturnKey = 'account-preview';
/** Restore must happen against a signed-in Plastic Brains account. */
export const SUBSCRIPTION_STEP_RETURN: AuthReturnKey = 'subscription-preview';
export const WELCOME_AUTH_SOURCE: AuthEntrySource = 'welcome';
export const PASSWORD_RESET_AUTH_SOURCE: AuthEntrySource = 'password-reset';

export function resolveAuthReturnRoute(value: string | string[] | undefined): Href | null {
    const key = Array.isArray(value) ? value[0] : value;

    if (key !== undefined && Object.prototype.hasOwnProperty.call(AUTH_RETURN_ROUTES, key)) {
        return AUTH_RETURN_ROUTES[key as AuthReturnKey];
    }

    return null;
}

/**
 * Marks a deliberate standalone entry into authentication.
 *
 * A bare login route can be restored by the development client or navigator
 * even though nobody chose it. Only allow-listed sources may keep that route;
 * everything else returns to the onboarding entry point.
 */
export function resolveAuthEntrySource(
    value: string | string[] | undefined,
): AuthEntrySource | null {
    const source = Array.isArray(value) ? value[0] : value;

    if (source !== undefined && Object.prototype.hasOwnProperty.call(AUTH_ENTRY_SOURCES, source)) {
        return source as AuthEntrySource;
    }

    return null;
}

/**
 * The step to resume at, held at module scope rather than in state or a ref.
 *
 * Signing in changes the user id, which makes OnboardingProvider re-hydrate, and
 * while it is re-hydrating the Gate in app/_layout.tsx swaps the whole navigator
 * for a loading screen. That unmounts the onboarding stack, so an in-flight
 * `router.replace` and any component state are lost, and the group would remount
 * at its initial route, Welcome. Module scope survives that remount.
 *
 * (app/_layout.tsx keeps handled notification ids at module scope for the same
 * reason.)
 */
let pendingStep: AuthReturnKey | null = null;

export function setPendingOnboardingStep(key: AuthReturnKey | null): void {
    pendingStep = key;
}

/** Reads the pending route without clearing the action that still has to resume. */
export function peekPendingOnboardingStep(): Href | null {
    if (pendingStep === null) {
        return null;
    }

    return AUTH_RETURN_ROUTES[pendingStep];
}

/**
 * Reads and clears the pending step.
 *
 * When an expected key is supplied, a different screen cannot accidentally
 * consume another step's handoff while navigation is settling after sign-in.
 */
export function consumePendingOnboardingStep(expected?: AuthReturnKey): Href | null {
    if (pendingStep === null || (expected !== undefined && pendingStep !== expected)) {
        return null;
    }

    const href = peekPendingOnboardingStep();
    pendingStep = null;
    return href;
}
