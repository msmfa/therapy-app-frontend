/**
 * react-native-calendars keeps its own English-only table of month and weekday
 * names, so without this the French app would show an English calendar header.
 */

import { LocaleConfig } from 'react-native-calendars';

import { applyCalendarLocale } from '../../components/therapy-calendar/calendarLocale';

describe('applyCalendarLocale', () => {
    it('registers French month and weekday names', () => {
        applyCalendarLocale('fr-FR');

        expect(LocaleConfig.defaultLocale).toBe('fr-FR');
        const fr = LocaleConfig.locales['fr-FR'];
        expect(fr.monthNames?.[0]).toBe('janvier');
        expect(fr.monthNames?.[11]).toBe('décembre');
        // Index 0 is Sunday, which is the order the library reads them in.
        expect(fr.dayNames?.[0]).toBe('dimanche');
        expect(fr.dayNames?.[1]).toBe('lundi');
        expect(fr.dayNames?.[6]).toBe('samedi');
    });

    it('registers English just as well', () => {
        applyCalendarLocale('en-GB');

        const en = LocaleConfig.locales['en-GB'];
        expect(en.monthNames?.[0]).toBe('January');
        expect(en.dayNames?.[0]).toBe('Sunday');
        expect(en.dayNames?.[6]).toBe('Saturday');
    });

    it('gives all twelve months and all seven days, in both lengths', () => {
        applyCalendarLocale('fr-FR');
        const fr = LocaleConfig.locales['fr-FR'];

        expect(fr.monthNames).toHaveLength(12);
        expect(fr.monthNamesShort).toHaveLength(12);
        expect(fr.dayNames).toHaveLength(7);
        expect(fr.dayNamesShort).toHaveLength(7);
        // No duplicates, which is what an off-by-one in the day rotation or a
        // timezone slip would produce.
        expect(new Set(fr.dayNames).size).toBe(7);
        expect(new Set(fr.monthNames).size).toBe(12);
    });

    it('leaves the calendar alone when Intl rejects the tag', () => {
        applyCalendarLocale('en-GB');
        const before = LocaleConfig.defaultLocale;

        applyCalendarLocale('not a tag');

        expect(LocaleConfig.defaultLocale).toBe(before);
    });
});
