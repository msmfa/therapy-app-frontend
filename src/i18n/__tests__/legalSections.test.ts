/**
 * The legal screens render a fixed list of section keys, so a section added to
 * the resource file and not to the screen is simply never shown. Nothing else
 * catches that: the copy is present, the keys are parity-checked across both
 * languages, and the screen still compiles and renders.
 *
 * The screens are read as text rather than imported because importing them
 * pulls in the whole Expo Router and native-module graph to learn one array.
 */

import { readFileSync } from 'fs';
import { join } from 'path';

import en from '../locales/en.json';

const SCREENS = [
    { file: 'privacy-policy.tsx', document: 'privacy' },
    { file: 'terms-of-service.tsx', document: 'terms' },
] as const;

const keysDeclaredIn = (file: string): string[] => {
    const source = readFileSync(join(__dirname, '../../../app', file), 'utf8');
    const match = source.match(/const SECTION_KEYS = \[([\s\S]*?)\] as const;/);
    if (!match) throw new Error(`No SECTION_KEYS in ${file}`);
    return [...match[1].matchAll(/'([^']+)'/g)].map((entry) => entry[1]);
};

describe('legal screens', () => {
    it.each(SCREENS.map((screen) => [screen.document, screen] as const))(
        '%s renders every section in the resource, in order',
        (document, screen) => {
            const inResource = Object.keys(en.legal[document]).filter((key) => key.startsWith('s'));
            expect(keysDeclaredIn(screen.file)).toEqual(inResource);
        },
    );

    it.each(SCREENS.map((screen) => [screen.document, screen] as const))(
        '%s has a heading and at least one paragraph per section',
        (document) => {
            const sections = Object.entries(en.legal[document])
                .filter(([key]) => key.startsWith('s'));

            expect(sections.length).toBeGreaterThan(0);
            for (const [key, section] of sections) {
                expect(typeof (section as { heading: string }).heading).toBe('string');
                expect((section as { bodies: string[] }).bodies.length).toBeGreaterThan(0);
                expect(key).toMatch(/^s\d+$/);
            }
        },
    );
    it('formats the effective date rather than hardcoding the words for one', () => {
        // It was the literal 'September 8, 2026', which sat in English inside
        // an otherwise French sentence. An ISO date plus a localized dayjs
        // token is the only version that follows the app's language.
        const source = readFileSync(join(__dirname, '../../../app/privacy-policy.tsx'), 'utf8');
        const constant = source.match(/const EFFECTIVE_DATE = '([^']+)'/);

        expect(constant?.[1]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(source).toContain("dayjs(EFFECTIVE_DATE).format('LL')");
    });
});
