const MIN_LENGTH = 8;
const UPPERCASE_REGEX = /[A-Z]/;
const SYMBOL_REGEX = /[^A-Za-z0-9]/;

export const validatePassword = (password: string): string | null => {
    if (password.length < MIN_LENGTH) return 'Password must be at least 8 characters long';
    if (!UPPERCASE_REGEX.test(password)) return 'Password must include at least one uppercase letter';
    if (!SYMBOL_REGEX.test(password.replace(/\s/g, ''))) return 'Password must include at least one symbol';
    return null;
};
