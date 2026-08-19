import { describe, expect, it } from '@jest/globals';

import { formatAppleFullName, type AppleFullNameLike } from '../appleFullName';

const fullName = (overrides: Partial<NonNullable<AppleFullNameLike>>): AppleFullNameLike => ({
    givenName: null,
    familyName: null,
    ...overrides,
});

describe('formatAppleFullName', () => {
    it('joins given and family name', () => {
        expect(formatAppleFullName(fullName({ givenName: 'Jane', familyName: 'Appleseed' })))
            .toBe('Jane Appleseed');
    });

    it('uses a single part when the other is missing', () => {
        expect(formatAppleFullName(fullName({ givenName: 'Jane' }))).toBe('Jane');
        expect(formatAppleFullName(fullName({ familyName: 'Appleseed' }))).toBe('Appleseed');
    });

    it('trims whitespace and treats blank parts as missing', () => {
        expect(formatAppleFullName(fullName({ givenName: '  Jane  ', familyName: '   ' })))
            .toBe('Jane');
    });

    it('returns undefined for null or empty names so the payload omits the field', () => {
        expect(formatAppleFullName(null)).toBeUndefined();
        expect(formatAppleFullName(fullName({}))).toBeUndefined();
    });
});
