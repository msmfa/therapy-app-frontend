/**
 * No module may resolve a translation at import time.
 *
 * `src/i18n/translate.ts` says this in prose already, and this branch shipped
 * a violation anyway:
 *
 *     const INTRODUCTION = translate('science:fiveQuestions.opening');
 *
 * A module-scope call runs once, when the module is first imported. That is
 * before the stored language preference has necessarily been applied, and it
 * never runs again, so the string is pinned to whichever language happened to
 * be active and the screen ends up half translated. Nothing about it fails a
 * typecheck and it reads perfectly well in review, which is why it needs to
 * be a test rather than a convention.
 *
 * A module-scope *function* that calls `t` is the correct shape and is what
 * every copy table in the app uses, so those are what this allows.
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '../../..');

const CALL = /\b(?:t|translate)\s*\(\s*['"`]/;
/** An arrow or a function body defers the call; those are the good shape. */
const DEFERRED = /=>|\bfunction\b/;

const sourceFilesIn = (dir: string): string[] =>
    readdirSync(dir).flatMap((entry) => {
        const path = join(dir, entry);
        if (statSync(path).isDirectory()) {
            return entry === '__tests__' || entry === 'node_modules' ? [] : sourceFilesIn(path);
        }
        return /\.tsx?$/.test(entry) ? [path] : [];
    });

/**
 * Module-scope `const`/`let`/`var` declarations, as (line, text) pairs.
 *
 * Module scope is detected by indentation: a declaration keyword in column 0.
 * The declaration runs to the first line that closes it, so a multi-line
 * object or array initializer is read whole.
 */
const moduleScopeDeclarations = (source: string): { line: number; text: string }[] => {
    const lines = source.split('\n');
    const declarations: { line: number; text: string }[] = [];

    for (let index = 0; index < lines.length; index += 1) {
        if (!/^(?:export\s+)?(?:const|let|var)\s/.test(lines[index])) continue;

        let text = lines[index];
        let depth = 0;
        const delta = (value: string): number =>
            [...value].reduce((total, character) => {
                if ('{(['.includes(character)) return total + 1;
                if ('})]'.includes(character)) return total - 1;
                return total;
            }, 0);

        depth += delta(text);
        let cursor = index;
        while ((depth > 0 || !text.trimEnd().endsWith(';')) && cursor + 1 < lines.length) {
            cursor += 1;
            text += `\n${lines[cursor]}`;
            depth += delta(lines[cursor]);
            if (depth <= 0 && lines[cursor].trimEnd().endsWith(';')) break;
        }

        declarations.push({ line: index + 1, text });
        index = cursor;
    }

    return declarations;
};

export const offendingDeclarations = (source: string): string[] =>
    moduleScopeDeclarations(source)
        .filter(({ text }) => CALL.test(text) && !DEFERRED.test(text))
        .map(({ line, text }) => `${line}: ${text.split('\n')[0].trim()}`);

describe('translations are never resolved at import time', () => {
    const files = [...sourceFilesIn(join(ROOT, 'app')), ...sourceFilesIn(join(ROOT, 'src'))];

    it('finds the modules to check', () => {
        expect(files.length).toBeGreaterThan(100);
    });

    it.each(files.map((file) => [file.slice(ROOT.length + 1), file] as const))(
        '%s',
        (_name, file) => {
            expect(offendingDeclarations(readFileSync(file, 'utf8'))).toEqual([]);
        },
    );

    it('catches the shape that shipped, and allows the shape that is correct', () => {
        // The check has to distinguish these two, and the difference is one
        // arrow, so assert on both rather than trusting the regex.
        expect(offendingDeclarations(
            "const INTRODUCTION = translate('science:fiveQuestions.opening');\n",
        )).toHaveLength(1);

        expect(offendingDeclarations(
            "const introduction = (): string => translate('science:fiveQuestions.opening');\n",
        )).toEqual([]);

        // A deferred call nested in a module-scope table is still deferred.
        expect(offendingDeclarations(
            'const COPY = {\n    title: () => t("a.b"),\n};\n',
        )).toEqual([]);

        // An eager call nested in a module-scope table is not.
        expect(offendingDeclarations(
            'const COPY = {\n    title: t("a.b"),\n};\n',
        )).toHaveLength(1);
    });
});
