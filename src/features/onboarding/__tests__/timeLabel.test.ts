import { timeLabel } from '../formatting';

const at = (h: number, m: number) => {
    const d = new Date(2026, 0, 15);
    d.setHours(h, m, 0, 0);
    return d;
};

describe('timeLabel', () => {
    const RealDateTimeFormat = Intl.DateTimeFormat;
    afterEach(() => jest.restoreAllMocks());

    it.each(['en-GB', 'en-US'])('follows the %s device convention', (locale) => {
        jest.spyOn(Intl, 'DateTimeFormat').mockImplementation((_locale, options) =>
            new RealDateTimeFormat(locale, options),
        );
        const expected = new RealDateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' });
        for (const date of [at(6, 45), at(20, 0), at(0, 0)]) {
            expect(timeLabel(date)).toBe(expected.formatToParts(date).map(part => part.value).join(''));
        }
    });

    it('returns an empty string for an unusable date rather than a wrong time', () => {
        expect(timeLabel(new Date(NaN))).toBe('');
    });
});

/**
 * The bug this guards against does not exist under Node's full ICU. On Hermes
 * this app has already seen Intl return a plausible but wrong answer, with
 * nothing failing loudly (see utils/timeZone.ts). Standing in a broken
 * formatter is the only way to prove on a laptop that the digits shown come
 * from the value the user picked.
 */
describe('when the engine Intl misreports the time', () => {
    const RealDateTimeFormat = Intl.DateTimeFormat;

    afterEach(() => {
        (Intl as unknown as { DateTimeFormat: typeof Intl.DateTimeFormat }).DateTimeFormat =
            RealDateTimeFormat;
    });

    const breakIntlReturning = (parts: Intl.DateTimeFormatPart[]) => {
        (Intl as unknown as { DateTimeFormat: unknown }).DateTimeFormat = function () {
            return { formatToParts: () => parts, format: () => parts.map((p) => p.value).join('') };
        };
    };

    it('still shows the picked time when Intl claims midnight', () => {
        breakIntlReturning([
            { type: 'hour', value: '0' },
            { type: 'literal', value: ':' },
            { type: 'minute', value: '00' },
        ]);

        expect(timeLabel(at(6, 45))).toBe('6:45');
        expect(timeLabel(at(20, 30))).toBe('20:30');
    });

    it('keeps the locale layout while correcting the digits', () => {
        breakIntlReturning([
            { type: 'hour', value: '0' },
            { type: 'literal', value: ':' },
            { type: 'minute', value: '00' },
            { type: 'literal', value: ' ' },
            { type: 'dayPeriod', value: 'AM' },
        ]);

        // A day period means a 12-hour locale, so 20:30 reads as 8:30.
        expect(timeLabel(at(20, 30))).toBe('8:30 AM');
        expect(timeLabel(at(0, 15))).toBe('12:15 AM');
    });

    it('falls back to a readable time when Intl throws outright', () => {
        (Intl as unknown as { DateTimeFormat: unknown }).DateTimeFormat = function () {
            throw new Error('Intl unavailable');
        };

        expect(timeLabel(at(6, 45))).toBe('06:45');
    });
});
