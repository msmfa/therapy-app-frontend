/**
 * No screen may render a literal English sentence.
 *
 * This exists because the manual sweep missed seventeen strings. The grep used
 * at the time looked for prose on the same line as the opening tag, and a JSX
 * text node is very often written on its own line:
 *
 *     <AppText variant='body'>
 *         The bars
 *     </AppText>
 *
 * Every one of those was invisible to it, including a whole screen. Reading
 * the text nodes properly is the only way to know, so it is a test rather
 * than a thing to remember.
 *
 * It parses rather than compiles: the alternative is rendering every screen,
 * which needs the whole Expo Router and native-module graph to learn which
 * strings are literals.
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '../../..');

/** Text in these is a product name, not copy. */
const ALLOWED = new Set(['Plastic Brains']);

const TEXT_COMPONENT = /<(AppText|Text|OnboardingText)\b[^>]*>([\s\S]*?)<\/\1>/g;
const EXPRESSION = /\{[^{}]*\}/g;
const WORD = /[A-Za-z][A-Za-z’']*/g;

const tsxFilesIn = (dir: string): string[] =>
    readdirSync(dir).flatMap((entry) => {
        const path = join(dir, entry);
        if (statSync(path).isDirectory()) {
            return entry === '__tests__' || entry === 'node_modules' ? [] : tsxFilesIn(path);
        }
        return path.endsWith('.tsx') ? [path] : [];
    });

/** What the component actually renders as literal text. */
const literalTextIn = (source: string): string[] => {
    const found: string[] = [];
    for (const match of source.matchAll(TEXT_COMPONENT)) {
        // Expression containers hold no literal text. Stripping repeats
        // because a nested brace survives a single pass.
        let inner = match[2];
        let previous = '';
        while (inner !== previous) {
            previous = inner;
            inner = inner.replace(EXPRESSION, ' ');
        }
        const text = inner.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).join(' ');
        if (WORD.test(text)) found.push(text);
        WORD.lastIndex = 0;
    }
    return found;
};

describe('screens render no literal text', () => {
    const files = [...tsxFilesIn(join(ROOT, 'app')), ...tsxFilesIn(join(ROOT, 'src'))];

    it('finds the screens to check', () => {
        expect(files.length).toBeGreaterThan(50);
    });

    it.each(files.map((file) => [file.slice(ROOT.length + 1), file] as const))(
        '%s',
        (_name, file) => {
            const offenders = literalTextIn(readFileSync(file, 'utf8'))
                .filter((text) => !ALLOWED.has(text));
            expect(offenders).toEqual([]);
        },
    );
});
