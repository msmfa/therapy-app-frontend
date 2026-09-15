/**
 * The two resource files must stay the same shape.
 *
 * English is the source language and the one the key types are generated from,
 * so a key that exists only in English is a French string that silently renders
 * in English, and a key that exists only in French is dead weight nothing can
 * reach. Neither fails a typecheck, and neither is visible in review once the
 * files are a few hundred lines long.
 */

import { LANGUAGES, FALLBACK_LANGUAGE } from '../languages';

/** Every leaf path in an object, as "a.b.c". */
const leafPaths = (value: unknown, prefix = ''): string[] => {
    if (typeof value !== 'object' || value === null) return [prefix];
    return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
        leafPaths(child, prefix === '' ? key : `${prefix}.${key}`),
    );
};

const leafValues = (value: unknown, prefix = ''): [string, unknown][] => {
    if (typeof value !== 'object' || value === null) return [[prefix, value]];
    return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
        leafValues(child, prefix === '' ? key : `${prefix}.${key}`),
    );
};

const source = LANGUAGES.find((language) => language.tag === FALLBACK_LANGUAGE);

describe('translation resources', () => {
    it('has the fallback language in the registry', () => {
        expect(source).toBeDefined();
    });

    const sourceKeys = [...leafPaths(source?.resources ?? {})].sort();

    it.each(LANGUAGES.map((language) => [language.tag, language] as const))(
        '%s has exactly the same keys as the source language',
        (_tag, language) => {
            expect([...leafPaths(language.resources)].sort()).toEqual(sourceKeys);
        },
    );

    it.each(LANGUAGES.map((language) => [language.tag, language] as const))(
        '%s has no empty or non-string values',
        (_tag, language) => {
            const bad = leafValues(language.resources).filter(
                ([, value]) => typeof value !== 'string' || value.trim() === '',
            );
            expect(bad).toEqual([]);
        },
    );

    it.each(
        LANGUAGES.filter((language) => language.tag !== FALLBACK_LANGUAGE)
            .map((language) => [language.tag, language] as const),
    )(
        '%s does not leave the English string in place',
        (_tag, language) => {
            const sourceByKey = new Map(leafValues(source?.resources ?? {}));
            // A handful of strings are legitimately identical across
            // languages. Everything else matching English is a line nobody
            // translated, which is the thing this test exists to catch, so the
            // exceptions are listed one by one rather than pattern-matched.
            const allowedIdentical = new Set([
                // Only placeholders and punctuation.
                'settings.hub.version',
                'settings.language.a11yRow',
                'reminderSettings.a11yTime',
                // Proper nouns and the product's own name.
                'onboarding.reminderTimes.quoteName',
                'onboarding.subscription.quoteName',
                'onboarding.notePreview.reminderTitle',
                // Words French happens to spell the same way.
                'onboarding.sessionDate.dateLabel',
                'common.tab.notes',
                'onboarding.subscription.monthlyBadge',
                'science.sources',
            ]);

            const untranslated = leafValues(language.resources)
                .filter(([key, value]) => !allowedIdentical.has(key) && sourceByKey.get(key) === value)
                .map(([key]) => key);

            expect(untranslated).toEqual([]);
        },
    );

    it.each(
        LANGUAGES.filter((language) => language.tag !== FALLBACK_LANGUAGE)
            .map((language) => [language.tag, language] as const),
    )(
        '%s uses the same interpolation variables as the source language',
        (_tag, language) => {
            // The one gap in the typed keys. `t('a.b', { count })` is checked
            // against the key, but not against the placeholders the string
            // actually contains, because the JSON types widen every value to
            // `string`. A French line that writes {{jour}} where English wrote
            // {{day}} therefore typechecks and renders the placeholder text to
            // the user.
            const names = (value: unknown): string[] =>
                typeof value === 'string'
                    ? [...value.matchAll(/\{\{\s*([\w.]+)/g)].map((match) => match[1]).sort()
                    : [];

            const sourceByKey = new Map(leafValues(source?.resources ?? {}));
            const mismatched = leafValues(language.resources)
                .filter(([key, value]) =>
                    names(value).join(',') !== names(sourceByKey.get(key)).join(','))
                .map(([key]) => key);

            expect(mismatched).toEqual([]);
        },
    );

    it.each(
        LANGUAGES.filter((language) => language.tag !== FALLBACK_LANGUAGE)
            .map((language) => [language.tag, language] as const),
    )(
        '%s keeps the line breaks the source language has',
        (_tag, language) => {
            // Bulleted lists in the legal and onboarding copy are one string
            // with embedded newlines, so a translation that runs the bullets
            // together renders as a wall of text rather than a list. The count
            // has to match, not merely be non-zero.
            const breaks = (value: unknown): number =>
                typeof value === 'string' ? value.split('\n').length - 1 : 0;

            const sourceByKey = new Map(leafValues(source?.resources ?? {}));
            const mismatched = leafValues(language.resources)
                .filter(([key, value]) => breaks(value) !== breaks(sourceByKey.get(key)))
                .map(([key]) => key);

            expect(mismatched).toEqual([]);
        },
    );
});
