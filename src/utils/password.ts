import { t } from '../i18n/translate';

const MIN_LENGTH = 8;
const UPPERCASE_REGEX = /[A-Z]/;
const SYMBOL_REGEX = /[^A-Za-z0-9]/;

/**
 * The first rule the password breaks, as a sentence to show under the field.
 *
 * Called from a plain function rather than a component, so it reaches for the
 * module-level `t`. Resolving these at import time instead would freeze them in
 * whatever language the device happened to be in at startup.
 */
export const validatePassword = (password: string): string | null => {
    if (password.length < MIN_LENGTH) return t('auth:password.tooShort', { count: MIN_LENGTH });
    if (!UPPERCASE_REGEX.test(password)) return t('auth:password.needsUppercase');
    if (!SYMBOL_REGEX.test(password.replace(/\s/g, ''))) return t('auth:password.needsSymbol');
    return null;
};
