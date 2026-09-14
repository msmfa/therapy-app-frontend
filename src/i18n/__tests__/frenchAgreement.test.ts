/**
 * Phrases where French has to agree in gender as well as number.
 *
 * These were all assembled from parts in the English-only version, and the
 * pattern that produces them is the one an English speaker reaches for: build a
 * noun phrase, drop it into a frame. That works until the frame contains an
 * adjective which has to agree with a noun living in the other half, which is
 * how "3 semaines offert" reached the simulator.
 */

import { i18next } from '../index';
import {
    trialBadgeLine,
    trialHeadline,
    remainingQuestions,
    planPriceLine,
} from '../../features/onboarding/onboardingCopy';

const week = (periods: number) => ({ periods, period: 'week' as const });
const month = (periods: number) => ({ periods, period: 'month' as const });

describe('French agreement', () => {
    beforeAll(async () => { await i18next.changeLanguage('fr'); });
    afterAll(async () => { await i18next.changeLanguage('en'); });

    it('agrees the trial badge with a feminine unit', () => {
        expect(trialBadgeLine(week(1))).toBe('1 semaine offerte');
        expect(trialBadgeLine(week(3))).toBe('3 semaines offertes');
    });

    it('agrees the trial badge with a masculine unit', () => {
        expect(trialBadgeLine(month(1))).toBe('1 mois offert');
        expect(trialBadgeLine(month(2))).toBe('2 mois offerts');
    });

    it('agrees the trial headline across the whole phrase', () => {
        expect(trialHeadline(week(1))).toBe('Votre première semaine est offerte');
        expect(trialHeadline(week(3))).toBe('Vos 3 premières semaines sont offertes');
        expect(trialHeadline(month(2))).toBe('Vos 2 premiers mois sont offerts');
    });

    it('agrees the remaining-question count', () => {
        expect(remainingQuestions(3, 4)).toBe('1 question supplémentaire incluse');
        expect(remainingQuestions(1, 4)).toBe('3 questions supplémentaires incluses');
    });

    it('names the billing period as a French word, not an interpolated English one', () => {
        expect(planPriceLine('annual', '79,99 €', false)).toBe('79,99 € par an');
        expect(planPriceLine('monthly', '9,99 €', true)).toBe('Puis 9,99 € par mois');
    });
});

describe('English is unchanged', () => {
    it('keeps the same phrases it had before the split', () => {
        expect(trialBadgeLine(week(3))).toBe('3 weeks free');
        expect(trialHeadline(week(1))).toBe("Your first week's on us");
        expect(remainingQuestions(3, 4)).toBe('1 more question included');
        expect(planPriceLine('annual', '£79.99', false)).toBe('£79.99 per year');
    });
});
