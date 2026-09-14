/**
 * The copy that stays in English on purpose.
 *
 * This list is now short, and deliberately so: everything a user reads in the
 * app is translated, including the privacy policy, the terms of service and
 * the research write-ups behind the reminder schedule. What remains English is
 * the evidence itself.
 *
 * - Reference lists. A citation is an identifier for a specific paper:
 *   authors, year, title and the journal it appeared in, as published. That
 *   title was published in English and it is the string a reader searches for,
 *   so translating it makes the source harder to find, not easier. The
 *   paraphrase of a finding is translated; the line that says where the
 *   finding comes from is not.
 *
 * The two places citations live:
 *   - `/references`, the full list reachable from Settings.
 *   - `REFERENCES` in `app/why-five-questions.tsx` and `SOURCES` in
 *     `src/constants/neuroReminders.ts`, both of which hold their citations as
 *     English literals with a comment saying why.
 *
 * The navigation around these is translated, so reaching them and leaving
 * them works in the user's own language.
 *
 * Adding to this list needs a reason of the same kind. "We have not got round
 * to it" is not one; that is an untranslated screen, which belongs in the
 * resource files like everything else.
 */
export const ENGLISH_ONLY_SCREENS = [
    { route: '/references', reason: 'citations' },
] as const;
