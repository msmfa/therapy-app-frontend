/**
 * The English-only list and the screens themselves have to agree.
 *
 * A list of routes in a comment is documentation nobody checks. This makes it
 * an invariant: a screen cannot quietly acquire the marker without being
 * declared, and a declared route cannot quietly lose it.
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

import { ENGLISH_ONLY_SCREENS } from '../englishOnly';

const APP_DIR = join(__dirname, '../../../app');
const MARKER = 'deliberately English-only';

const fileFor = (route: string): string => join(APP_DIR, `${route.replace(/^\//, '')}.tsx`);

describe('English-only screens', () => {
    it.each(ENGLISH_ONLY_SCREENS.map((screen) => [screen.route, screen] as const))(
        '%s exists and carries the marker explaining why',
        (route) => {
            const path = fileFor(route);
            expect(existsSync(path)).toBe(true);
            expect(readFileSync(path, 'utf8')).toContain(MARKER);
        },
    );

    it('gives every entry a reason', () => {
        for (const screen of ENGLISH_ONLY_SCREENS) {
            expect(screen.reason).toBeTruthy();
        }
    });

    it('declares every screen that carries the marker', () => {
        // The direction that actually catches drift: somebody adds the comment
        // to a new screen and forgets the list, and the exception stops being
        // visible anywhere a reviewer would look.
        const declared = new Set(ENGLISH_ONLY_SCREENS.map((screen) => fileFor(screen.route)));
        const marked = require('child_process')
            .execSync(`grep -rl "${MARKER}" ${APP_DIR} || true`, { encoding: 'utf8' })
            .split('\n')
            .filter(Boolean);

        expect(marked.filter((path: string) => !declared.has(path))).toEqual([]);
        expect(marked).toHaveLength(ENGLISH_ONLY_SCREENS.length);
    });
});
