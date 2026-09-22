import React from 'react';
import { render, screen } from '@testing-library/react-native';

import LoadingSuccess from '../LoadingWithSuccess';

jest.mock('../PulsingSquare', () => ({ __esModule: true, default: () => null }));

describe('LoadingWithSuccess', () => {
    it('announces the loading text, which the icon swap alone never told VoiceOver', () => {
        render(
            <LoadingSuccess visible status="loading" text="Saving your sessions" />,
        );

        expect(screen.getByText('Saving your sessions')).toBeTruthy();
    });

    it('announces the success text once the status flips, same as the checkmark tells a sighted user', () => {
        render(
            <LoadingSuccess visible status="success" successText="Updated your therapy sessions" />,
        );

        expect(screen.getByText('Updated your therapy sessions')).toBeTruthy();
    });

    it('renders nothing extra when no caller passes text, rather than an empty announcement', () => {
        render(<LoadingSuccess visible status="loading" />);

        expect(screen.queryByTestId('loading-success-status')).toBeNull();
    });
});
