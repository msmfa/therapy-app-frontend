/**
 * The screens that stay in English on purpose.
 *
 * Not an oversight and not a backlog item. Two kinds of copy are deliberately
 * excluded from translation:
 *
 * - The privacy policy and terms of service. This app processes special
 *   category health data under GDPR Art. 9, and a translated policy is a
 *   different legal document, not a convenience. It needs a lawyer in the
 *   target jurisdiction, not a translator, and until it has one the English
 *   text is the one the user agreed to.
 *
 * - The research write-ups behind the reminder schedule. These paraphrase
 *   specific findings and cite the papers they come from, and they are taken
 *   verbatim from plastic-brains.com so the app and the site say the same
 *   thing. A loose translation of a claim about evidence misstates the
 *   evidence, and the two would drift apart the first time either changed.
 *
 * The navigation around these screens is translated, so reaching them and
 * leaving them works in the user's own language. Only the body is English.
 *
 * Adding to this list should need a reason of the same kind. "We have not got
 * round to it" is not one; that is an untranslated screen, which belongs in
 * the resource files like everything else.
 */
export const ENGLISH_ONLY_SCREENS = [
    { route: '/privacy-policy', reason: 'legal' },
    { route: '/terms-of-service', reason: 'legal' },
    { route: '/references', reason: 'citations' },
    { route: '/why-five-questions', reason: 'research' },
    { route: '/interval-science', reason: 'research' },
    { route: '/how-to-take-notes', reason: 'research' },
] as const;
