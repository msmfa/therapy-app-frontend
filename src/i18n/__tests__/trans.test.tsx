/** Verify translated sentences keep their embedded navigation links. */
import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';

import { EmptyNoteCard } from '../../components/notes/EmptyNoteCard';
import { i18next } from '../index';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));

describe('EmptyNoteCard translations', () => {
    afterEach(async () => {
        mockPush.mockClear();
        await act(async () => { await i18next.changeLanguage('en'); });
    });

    it('renders the English sentences around their embedded links', () => {
        const view = render(<EmptyNoteCard />);
        expect(view.getByText('Add sessions in the calendar so we can build your custom reminders.')).toBeTruthy();
        expect(view.getByText('We recommend reading about how to take a therapy note.')).toBeTruthy();
        expect(view.getByText('If you want to add a note now you can click here.')).toBeTruthy();
        expect(view.getAllByRole('link')).toHaveLength(3);
    });

    it('renders French sentences with the translated links inside them', async () => {
        await act(async () => { await i18next.changeLanguage('fr'); });
        const view = render(<EmptyNoteCard />);
        expect(view.getByText('Ajoutez des séances dans le calendrier pour que nous puissions créer vos rappels personnalisés.')).toBeTruthy();
        expect(view.getByText('Nous vous recommandons de lire comment prendre une note de thérapie.')).toBeTruthy();
        expect(view.getByText('Si vous voulez ajouter une note maintenant, vous pouvez cliquer ici.')).toBeTruthy();
    });

    it('preserves navigation from each translated link', async () => {
        await act(async () => { await i18next.changeLanguage('fr'); });
        const view = render(<EmptyNoteCard />);
        for (const [name, route] of [
            ['Ajoutez des séances dans le calendrier', '/(tabs)/calendar'],
            ['comment prendre une note de thérapie', '/how-to-take-notes'],
            ['cliquer ici', '/(tabs)'],
        ]) {
            fireEvent.press(view.getByRole('link', { name }));
            expect(mockPush).toHaveBeenLastCalledWith(route);
        }
    });
});
