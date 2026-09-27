import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { EmptyNoteCard } from '../EmptyNoteCard';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));


it('links the empty-state copy to the calendar, note editor and note-taking guide', () => {
    render(<EmptyNoteCard />);

    fireEvent.press(screen.getByRole('link', { name: 'Add sessions in the calendar' }));
    expect(mockPush).toHaveBeenLastCalledWith('/(tabs)/calendar');

    fireEvent.press(screen.getByRole('link', { name: 'click here' }));
    expect(mockPush).toHaveBeenLastCalledWith('/(tabs)');

    fireEvent.press(screen.getByRole('link', { name: 'how to take a therapy note' }));
    expect(mockPush).toHaveBeenLastCalledWith('/how-to-take-notes');
});
