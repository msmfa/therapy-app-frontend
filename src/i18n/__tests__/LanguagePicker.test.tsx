import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';

import { LanguagePicker } from '../../components/settings/LanguagePicker';
import { i18next } from '../index';

jest.mock('expo-localization', () => ({
    getLocales: jest.fn(() => [{ languageTag: 'en-GB', languageCode: 'en', regionCode: 'GB' }]),
}));
const mockShowAlert = jest.fn();
jest.mock('../../context/alert', () => ({ useAppAlert: () => ({ showAlert: mockShowAlert }) }));
jest.mock('../../api/users', () => ({ updateCurrentUser: jest.fn(async () => undefined) }));
jest.mock('../storage', () => ({
    readLanguagePreference: jest.fn(async () => 'system'),
    writeLanguagePreference: jest.fn(async () => undefined),
}));

describe('LanguagePicker', () => {
    afterEach(async () => {
        await act(async () => { await i18next.changeLanguage('en'); });
    });

    it('offers System with the language it resolves to, plus both endonyms', async () => {
        const view = render(<LanguagePicker />);
        await waitFor(() => view.getByText('System'));

        expect(view.getByText('Currently English')).toBeTruthy();
        expect(view.getByText('English')).toBeTruthy();
        expect(view.getByText('Français')).toBeTruthy();
    });

    it('switches the whole UI to French on tap, without a reload', async () => {
        const view = render(<LanguagePicker />);
        await waitFor(() => view.getByText('System'));
        expect(view.getByText('Language')).toBeTruthy();

        await act(async () => { fireEvent.press(view.getByText('Français')); });

        // The picker's own chrome is now French...
        await waitFor(() => view.getByText('Langue'));
        expect(view.getByText('Système')).toBeTruthy();
        // ...and the endonyms deliberately are not translated.
        expect(view.getByText('Français')).toBeTruthy();
        expect(view.getByText('English')).toBeTruthy();
    });

    it('tells the user when the choice could not be remembered, naming the language', async () => {
        const { writeLanguagePreference } = require('../storage');
        (writeLanguagePreference as jest.Mock).mockRejectedValueOnce(new Error('disk full'));

        const view = render(<LanguagePicker />);
        await waitFor(() => view.getByText('System'));
        await act(async () => { fireEvent.press(view.getByText('Français')); });

        await waitFor(() => expect(mockShowAlert).toHaveBeenCalled());
        const [title, message] = mockShowAlert.mock.calls[0];
        expect(title).toBe('Langue non enregistrée');
        // Names the language, not the word "System".
        expect(message).toContain('Français');
    });
});
