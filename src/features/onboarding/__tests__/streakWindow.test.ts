import { firstStreakReviewWindow } from '../streakWindow';

const answers = {
    sessionAt: new Date(2026, 8, 14, 18),
    cadence: 'weekly' as const,
    morningMinutes: 7 * 60 + 30,
    eveningMinutes: 20 * 60,
};

it('uses the chosen session and reminder times, including a closing date after midnight', () => {
    const window = firstStreakReviewWindow(answers)!;
    expect(new Date(window.atMs)).toEqual(new Date(2026, 8, 14, 20));
    expect(new Date(window.closesAtMs)).toEqual(new Date(2026, 8, 15, 4));
    const later = firstStreakReviewWindow({ ...answers, eveningMinutes: 21 * 60 + 15 })!;
    expect(new Date(later.atMs)).toEqual(new Date(2026, 8, 14, 21, 15));
    expect(new Date(later.closesAtMs)).toEqual(new Date(2026, 8, 15, 5, 15));
});

it('uses the morning review if the evening reminder would fall during the session', () => {
    const window = firstStreakReviewWindow({ ...answers, sessionAt: new Date(2026, 8, 14, 21) })!;
    expect(new Date(window.atMs)).toEqual(new Date(2026, 8, 15, 7, 30));
    expect(new Date(window.closesAtMs)).toEqual(new Date(2026, 8, 15, 22, 30));
});

it('does not invent dates when the user skipped the session or their schedule varies', () => {
    expect(firstStreakReviewWindow({ ...answers, sessionAt: null })).toBeNull();
    expect(firstStreakReviewWindow({ ...answers, cadence: 'varies' })).toBeNull();
    expect(firstStreakReviewWindow({ ...answers, cadence: null })).toBeNull();
});
