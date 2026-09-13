/**
 * The interface and the push notifications must not end up in two different
 * languages. The app's language lives in AsyncStorage, which is per-install;
 * the language the reminders are written in lives on the account.
 */

import { renderHook, waitFor } from '@testing-library/react-native';

import { useLanguageSync } from '../useLanguageSync';
import { getCurrentUserSettings, updateCurrentUser } from '../../api/users';
import { readLanguagePreference, writeLanguagePreference } from '../storage';
import { i18next } from '../index';

jest.mock('expo-localization', () => ({
    getLocales: jest.fn(() => [{ languageTag: 'en-GB', languageCode: 'en', regionCode: 'GB' }]),
}));
jest.mock('../../api/users', () => ({
    getCurrentUserSettings: jest.fn(),
    updateCurrentUser: jest.fn(async () => undefined),
}));
jest.mock('../storage', () => ({
    readLanguagePreference: jest.fn(),
    writeLanguagePreference: jest.fn(async () => undefined),
}));

let mockSignedIn = true;
jest.mock('src/context/auth/AuthContext', () => ({
    useAuth: () => ({ isAuthenticated: mockSignedIn, user: mockSignedIn ? { id: 'u1' } : null }),
}));

const mockRead = readLanguagePreference as jest.Mock;
const mockWrite = writeLanguagePreference as jest.Mock;
const mockGet = getCurrentUserSettings as jest.Mock;
const mockUpdate = updateCurrentUser as jest.Mock;

describe('useLanguageSync', () => {
    beforeEach(async () => {
        jest.clearAllMocks();
        mockSignedIn = true;
        await i18next.changeLanguage('en');
    });

    it('pushes this device’s explicit choice up to the account', async () => {
        mockRead.mockResolvedValue('fr');

        renderHook(() => useLanguageSync());

        await waitFor(() => expect(mockUpdate).toHaveBeenCalledWith({ locale: 'fr' }));
        // The local choice is authoritative, so there is nothing to read back.
        expect(mockGet).not.toHaveBeenCalled();
    });

    it('adopts the account’s language on a fresh install', async () => {
        // The reinstall case: nothing stored locally, the account remembers.
        mockRead.mockResolvedValue('system');
        mockGet.mockResolvedValue({ locale: 'fr' });

        renderHook(() => useLanguageSync());

        await waitFor(() => expect(mockWrite).toHaveBeenCalledWith('fr'));
        await waitFor(() => expect(i18next.language).toBe('fr'));
    });

    it('matches a regional account tag to the language it ships', async () => {
        mockRead.mockResolvedValue('system');
        mockGet.mockResolvedValue({ locale: 'fr-CA' });

        renderHook(() => useLanguageSync());

        await waitFor(() => expect(mockWrite).toHaveBeenCalledWith('fr'));
    });

    it('leaves System alone when the account has no choice either', async () => {
        mockRead.mockResolvedValue('system');
        mockGet.mockResolvedValue({ deviceLocale: 'en-GB' });

        renderHook(() => useLanguageSync());

        await waitFor(() => expect(mockGet).toHaveBeenCalled());
        expect(mockWrite).not.toHaveBeenCalled();
        expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('ignores an account language this build cannot render', async () => {
        // A tag from a release that shipped German would otherwise pin the
        // interface to a language with no resource file.
        mockRead.mockResolvedValue('system');
        mockGet.mockResolvedValue({ locale: 'de' });

        renderHook(() => useLanguageSync());

        await waitFor(() => expect(mockGet).toHaveBeenCalled());
        expect(mockWrite).not.toHaveBeenCalled();
        expect(i18next.language).toBe('en');
    });

    it('does nothing at all when signed out', async () => {
        mockSignedIn = false;
        mockRead.mockResolvedValue('fr');

        renderHook(() => useLanguageSync());

        await new Promise((resolve) => setTimeout(resolve, 10));
        expect(mockRead).not.toHaveBeenCalled();
        expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('keeps both sides as they were when the request fails', async () => {
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
        mockRead.mockResolvedValue('system');
        mockGet.mockRejectedValue(new Error('offline'));

        renderHook(() => useLanguageSync());

        await waitFor(() => expect(warn).toHaveBeenCalled());
        expect(mockWrite).not.toHaveBeenCalled();
        expect(i18next.language).toBe('en');
        warn.mockRestore();
    });
});
