/**
 * Plural selection, through the real i18next instance.
 *
 * This test is the guard on a failure that is otherwise silent. i18next builds
 * plural rules with `new Intl.PluralRules(...)`; when that throws it falls back
 * to a rule that always answers "other", so every `_one` form quietly becomes
 * dead code and no error is raised anywhere. Hermes does not implement
 * `Intl.PluralRules` on either platform, which is why src/i18n/index.ts loads
 * the formatjs polyfill.
 *
 * The polyfill is installed with `polyfill-force`, not the conditional
 * `polyfill`, precisely so this test means something. Node has a native
 * `Intl.PluralRules`; without forcing, Jest would exercise Node's
 * implementation and the device would exercise formatjs's, and a passing test
 * here would say nothing about what ships.
 */

import { i18next } from '../index';
import { t } from '../translate';

describe('Intl.PluralRules', () => {
    it('is available once the polyfill has loaded', () => {
        expect(typeof Intl.PluralRules).toBe('function');
    });

    it('distinguishes one from other in French', () => {
        const rules = new Intl.PluralRules('fr', { type: 'cardinal' });
        expect(rules.select(1)).toBe('one');
        expect(rules.select(4)).toBe('other');
        // French, unlike English, takes the singular for zero.
        expect(rules.select(0)).toBe('one');
    });
});

describe('plural keys', () => {
    afterEach(async () => {
        await i18next.changeLanguage('en');
    });

    it('selects the French singular and plural forms', async () => {
        await i18next.changeLanguage('fr');

        expect(t('notes:reviewProgress', { count: 1, total: 4 })).toBe('1 révision sur 4');
        expect(t('notes:reviewProgress', { count: 2, total: 4 })).toBe('2 révisions sur 4');
        // The case that proves the rule is French's, not English's.
        expect(t('notes:reviewProgress', { count: 0, total: 4 })).toBe('0 révision sur 4');
    });

    it('interpolates both variables in English', async () => {
        await i18next.changeLanguage('en');

        expect(t('notes:reviewProgress', { count: 2, total: 4 })).toBe('2 of 4 reviewed');
    });
});

describe('language switching', () => {
    afterEach(async () => {
        await i18next.changeLanguage('en');
    });

    it('changes what t() returns without re-initialising', async () => {
        expect(t('settings:rows.contactUs')).toBe('Contact us');
        await i18next.changeLanguage('fr');
        expect(t('settings:rows.contactUs')).toBe('Nous contacter');
    });

    it('reaches the German file once German is registered', async () => {
        await i18next.changeLanguage('de');
        expect(t('settings:rows.contactUs')).toBe('Kontakt aufnehmen');
    });

    it('falls back to English for a language it does not ship', async () => {
        await i18next.changeLanguage('it');
        expect(t('settings:rows.contactUs')).toBe('Contact us');
    });
});
