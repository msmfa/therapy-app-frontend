import { allowedEventProperties, ONBOARDING_FLOW_VERSION, ONBOARDING_STEPS } from '../events';

it('recognises the streaks step between notes and plans in the updated flow', () => {
    const index = ONBOARDING_STEPS.indexOf('streaks_preview');
    expect(ONBOARDING_STEPS.slice(index - 1, index + 2))
        .toEqual(['note_preview', 'streaks_preview', 'subscription_preview']);
    expect(allowedEventProperties('onboarding_step_viewed', {
        onboarding_step: 'streaks_preview', flow_version: ONBOARDING_FLOW_VERSION,
        sessionAt: 'private-session-date', reviewWindow: 'private-review-times',
    })).toEqual({ onboarding_step: 'streaks_preview', flow_version: '2' });
});

it('still accepts queued onboarding events from the previous flow', () => {
    expect(allowedEventProperties('onboarding_step_viewed', {
        onboarding_step: 'note_preview', flow_version: '1',
    })).toEqual({ onboarding_step: 'note_preview', flow_version: '1' });
});
