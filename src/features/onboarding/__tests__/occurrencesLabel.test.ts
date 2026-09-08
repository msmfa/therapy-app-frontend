import { occurrencesLabel } from '../formatting';

const at = (iso: string) => new Date(iso);

describe('occurrencesLabel', () => {
    it('reads as a single date and time when there is only one', () => {
        const label = occurrencesLabel([at('2026-09-12T20:00:00')]);

        expect(label).toMatch(/12/);
        expect(label.split(',').length).toBeLessThanOrEqual(3);
    });

    it('joins the dates with commas and states the shared time once', () => {
        const label = occurrencesLabel([
            at('2026-09-12T20:00:00'),
            at('2026-09-16T20:00:00'),
            at('2026-09-20T20:00:00'),
        ]);

        expect(label).toMatch(/12/);
        expect(label).toMatch(/16/);
        expect(label).toMatch(/20 Sep|Sep 20/);
        // The time appears once, at the end, not after every date.
        expect(label.match(/20:00|8:00/g) ?? []).toHaveLength(1);
    });

    it('labels each occurrence in full when the times differ', () => {
        const label = occurrencesLabel([
            at('2026-09-12T20:00:00'),
            at('2026-09-16T09:30:00'),
        ]);

        expect(label).toMatch(/20:00|8:00/);
        expect(label).toMatch(/09:30|9:30/);
    });

    it('is empty for no occurrences rather than throwing', () => {
        expect(occurrencesLabel([])).toBe('');
    });
});
