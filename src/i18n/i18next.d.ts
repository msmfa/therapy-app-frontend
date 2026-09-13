/**
 * Typed translation keys.
 *
 * The English resource file is the contract. `t('settings.language.titel')` is
 * a compile error rather than a string that quietly renders as its own key at
 * runtime, and so is a namespace that does not exist, a plural key used without
 * `count`, or an interpolation variable that the English string does not take.
 *
 * French is deliberately not part of this type. English is the source language,
 * so a key that exists only in French is a key nothing reads, and a key missing
 * from French is a fallback rather than a type error. The resource-parity test
 * in __tests__/resources.test.ts is what holds the two files to the same shape.
 */

import 'i18next';

import type en from './locales/en.json';

declare module 'i18next' {
    interface CustomTypeOptions {
        defaultNS: 'common';
        resources: typeof en;
        // `t()` returns `string`, never `string | null`, so callers do not have
        // to narrow before putting a translation into a `string` prop.
        returnNull: false;
    }
}
