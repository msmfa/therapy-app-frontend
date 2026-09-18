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

/** Presses the dropdown trigger, which is labelled by the current choice. */
const openDropdown = async (view: ReturnType<typeof render>, trigger: string) => {
    await act(async () => { fireEvent.press(view.getByText(trigger)); });
};

describe('LanguagePicker', () => {
    afterEach(async () => {
        await act(async () => { await i18next.changeLanguage('en'); });
    });

    it('offers System with the language it resolves to, and keeps the languages behind the dropdown', async () => {
        const view = render(<LanguagePicker />);
        await waitFor(() => view.getByText('System'));

        expect(view.getByText('Currently English')).toBeTruthy();
        // On System nothing is explicitly chosen, so the dropdown invites a
        // choice rather than naming a language the user did not pick.
        expect(view.getByText('Choose a language')).toBeTruthy();
        expect(view.queryByText('Français')).toBeNull();

        await openDropdown(view, 'Choose a language');

        expect(view.getByText('English')).toBeTruthy();
        expect(view.getByText('Français')).toBeTruthy();
    });

    it('switches the whole UI to French on tap, without a reload', async () => {
        const view = render(<LanguagePicker />);
        await waitFor(() => view.getByText('System'));
        await openDropdown(view, 'Choose a language');

        await act(async () => { fireEvent.press(view.getByText('Français')); });

        // The picker's own chrome is now French...
        await waitFor(() => view.getByText('Système'));
        // ...the dropdown has closed onto the choice it was given...
        expect(view.getByText('Français')).toBeTruthy();
        expect(view.queryByText('English')).toBeNull();

        // ...and the endonyms deliberately are not translated, so reopening
        // still reads the same to a speaker of either language. Français
        // appears twice: once on the trigger, once as the selected option.
        await openDropdown(view, 'Français');
        expect(view.getAllByText('Français')).toHaveLength(2);
        expect(view.getByText('English')).toBeTruthy();
    });

    it('tells the user when the choice could not be remembered, naming the language', async () => {
        const { writeLanguagePreference } = require('../storage');
        (writeLanguagePreference as jest.Mock).mockRejectedValueOnce(new Error('disk full'));

        const view = render(<LanguagePicker />);
        await waitFor(() => view.getByText('System'));
        await openDropdown(view, 'Choose a language');
        await act(async () => { fireEvent.press(view.getByText('Français')); });

        await waitFor(() => expect(mockShowAlert).toHaveBeenCalled());
        const [title, message] = mockShowAlert.mock.calls[0];
        expect(title).toBe('Langue non enregistrée');
        // Names the language, not the word "System".
        expect(message).toContain('Français');
    });

    it('keeps System selectable once a language has been picked', async () => {
        const view = render(<LanguagePicker />);
        await waitFor(() => view.getByText('System'));
        await openDropdown(view, 'Choose a language');
        await act(async () => { fireEvent.press(view.getByText('Français')); });
        await waitFor(() => view.getByText('Système'));

        await act(async () => { fireEvent.press(view.getByText('Système')); });

        // Back on System, so the dropdown has nothing of its own to name.
        await waitFor(() => view.getByText('System'));
        expect(view.getByText('Choose a language')).toBeTruthy();
    });
});
