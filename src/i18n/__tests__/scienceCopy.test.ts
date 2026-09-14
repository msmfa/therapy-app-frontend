import { reminderScienceCopy, neuroReminderCopy } from '../../constants/neuroReminders';
import { ReminderType } from '../../utils/types';
import { Reason } from '../../features/reminders/types';
import { i18next } from '../index';

describe('science copy', () => {
    afterEach(async () => { await i18next.changeLanguage('en'); });

    it('returns French prose and English citations together', async () => {
        await i18next.changeLanguage('fr');
        const copy = reminderScienceCopy()[ReminderType.EarlyConsolidation];

        expect(copy.title).toBe('Consolidation précoce');
        expect(copy.tldr).toContain('votre cerveau');
        expect(copy.body).toHaveLength(4);
        expect(copy.body[0]).toContain('synaptiques');
        // The citation is a pointer to a paper, so it stays as published.
        expect(copy.sources[0].text).toContain('Goto et al. (2021)');
        expect(copy.sources).toHaveLength(3);
    });

    it('returns the reminder card copy in French', async () => {
        await i18next.changeLanguage('fr');
        expect(neuroReminderCopy()[Reason.PostSession].time).toBe('Le soir de votre séance');
    });

    it('keeps every body an array of non-empty strings in both languages', async () => {
        for (const lng of ['en', 'fr']) {
            await i18next.changeLanguage(lng);
            for (const type of Object.values(ReminderType)) {
                const copy = reminderScienceCopy()[type];
                expect(Array.isArray(copy.body)).toBe(true);
                expect(copy.body.length).toBeGreaterThan(0);
                for (const para of copy.body) expect(typeof para === 'string' && para.length > 40).toBe(true);
            }
        }
    });
});
