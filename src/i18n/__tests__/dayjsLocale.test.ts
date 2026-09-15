/**
 * dayjs has to follow the region, not just the language.
 *
 * `applyDayjsLocale` took the language subtag at first, which sent every
 * British user to American conventions without anything failing: dayjs's
 * built-in `en` is US English, so `LT` rendered a UK evening as "6:00 PM" and
 * `LL` as "September 14, 2026". The names were right and the numbers were
 * wrong, which is the kind of thing a screenshot has to catch.
 *
 * These go through the app's own wiring rather than calling
 * `applyDayjsLocale` directly: `src/i18n/index.ts` applies it at import and
 * again on every `languageChanged`, and that wiring is half of what broke.
 * jest.setup.js pins the device to en-GB, so the English cases below are what
 * a UK user actually sees.
 */

import dayjs from 'dayjs';

import { applyDayjsLocale } from '../dayjsLocale';
import { formattingLocale, i18next } from '../index';

const EVENING = '2026-09-14T18:00:00';

describe('dayjs follows the formatting locale', () => {
    afterEach(async () => {
        await i18next.changeLanguage('en');
    });

    it('gives a UK device a 24-hour clock and day-first dates in English', async () => {
        await i18next.changeLanguage('en');

        expect(formattingLocale()).toBe('en-GB');
        expect(dayjs(EVENING).format('LT')).toBe('18:00');
        expect(dayjs(EVENING).format('LL')).toBe('14 September 2026');
    });

    it('follows a change to French, on the same device', async () => {
        await i18next.changeLanguage('fr');

        // fr-GB: French words, and French agrees with the UK on both tokens.
        expect(formattingLocale()).toBe('fr-GB');
        expect(dayjs(EVENING).format('LT')).toBe('18:00');
        expect(dayjs(EVENING).format('LL')).toBe('14 septembre 2026');
    });

    it('changes back, so the wiring is not one-way', async () => {
        await i18next.changeLanguage('fr');
        await i18next.changeLanguage('en');

        expect(dayjs(EVENING).format('LL')).toBe('14 September 2026');
    });

    describe('locale resolution', () => {
        afterEach(() => {
            applyDayjsLocale('en-GB');
        });

        it('uses a bundled region exactly', () => {
            applyDayjsLocale('en-CA');
            // Canada: 12-hour, month first. Different from both en and en-GB,
            // which is what makes it worth bundling.
            expect(dayjs(EVENING).format('LT')).toBe('6:00 PM');
            expect(dayjs(EVENING).format('LL')).toBe('September 14, 2026');
        });

        it('accepts the tag in the case a BCP 47 tag is written in', () => {
            // dayjs keys its locales lower case; the app composes "en-GB".
            applyDayjsLocale('en-GB');
            expect(dayjs(EVENING).format('LT')).toBe('18:00');
        });

        it('falls back to the language for a region it has no data for', () => {
            applyDayjsLocale('fr-BE');
            expect(dayjs(EVENING).format('LL')).toBe('14 septembre 2026');
        });

        it('falls back to English for a language it has no data for', () => {
            applyDayjsLocale('it-IT');
            expect(dayjs(EVENING).format('LL')).toBe('September 14, 2026');
        });

        it('gives German a 24-hour clock and a day-first date', () => {
            applyDayjsLocale('de-DE');
            expect(dayjs(EVENING).format('LT')).toBe('18:00');
            expect(dayjs(EVENING).format('LL')).toBe('14. September 2026');
        });

        it('keeps the Austrian month name, which is why de-at is bundled', () => {
            // de writes Januar, de-at writes Jänner. Falling back to the
            // language here would show an Austrian a month name they do not use.
            applyDayjsLocale('de-AT');
            expect(dayjs('2026-01-14T18:00:00Z').format('LL')).toBe('14. Jänner 2026');
        });

        it('falls back to English for a bare language with no region', () => {
            applyDayjsLocale('en');
            expect(dayjs(EVENING).format('LT')).toBe('6:00 PM');
        });
    });
});
