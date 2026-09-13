/**
 * <Trans> keeps the styled span inside a translated sentence.
 *
 * These two strings are the only ones in the app where a styled element sits
 * mid-sentence. Concatenation would work in English and break in French, where
 * the date lands in a different place in the clause, so the mechanism is worth
 * a test of its own rather than trusting that it renders.
 */

import React from 'react';
import { act, render } from '@testing-library/react-native';

import { EmptyNoteCard } from '../../components/notes/EmptyNoteCard';
import { i18next } from '../index';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));

const mockNextSession = { startsAtUtc: '2026-03-04T19:00:00.000Z' };
let mockSession: typeof mockNextSession | null = mockNextSession;
jest.mock('../../context/therapy-sessions/TherapySessionsContext', () => ({
    useTherapySessions: () => ({ nextSession: mockSession }),
}));

describe('EmptyNoteCard', () => {
    afterEach(async () => {
        mockSession = mockNextSession;
        // changeLanguage re-renders every mounted translated component, so the
        // reset is a state update like any other.
        await act(async () => { await i18next.changeLanguage('en'); });
    });

    it('renders the sentence around the date in English', () => {
        const view = render(<EmptyNoteCard />);
        expect(view.getByText(/We’ll send you a notification/)).toBeTruthy();
        expect(view.getByText(/what kind of note taking works best/)).toBeTruthy();
    });

    it('renders the French sentence with the date still inside it', async () => {
        await act(async () => { await i18next.changeLanguage('fr'); });
        const view = render(<EmptyNoteCard />);

        expect(view.getByText(/Nous vous enverrons une notification/)).toBeTruthy();
        // The interpolated date survived, rather than leaving "{{date}}".
        expect(view.queryByText(/\{\{date\}\}/)).toBeNull();
        expect(view.getByText(/quelle façon de prendre des notes/)).toBeTruthy();
    });

    it('uses the other sentence when nothing is scheduled', async () => {
        mockSession = null;
        await act(async () => { await i18next.changeLanguage('fr'); });
        const view = render(<EmptyNoteCard />);

        expect(view.getByText(/Vous n’avez encore aucune séance/)).toBeTruthy();
    });
});
