import React from 'react';
import { render, screen } from '@testing-library/react-native';

import ScheduleModal from '../ScheduleModal';

const props = {
    defaultTime: new Date(2026, 0, 1, 9, 0, 0),
    onCancel: jest.fn(),
    onConfirm: jest.fn(),
    onDelete: jest.fn(),
    selectedDate: '2026-09-15',
    visible: true,
};

describe('ScheduleModal actions', () => {
    it('offers Add Session on a free day', () => {
        render(<ScheduleModal { ...props } existingSession={ null } />);

        expect(screen.getByText('Add Session')).toBeTruthy();
    });

    it('offers Delete and Update on a day that already has one', () => {
        render(
            <ScheduleModal
                { ...props }
                existingSession={ {
                    date: '2026-09-15',
                    id: '2026-09-15',
                    time: new Date(2026, 8, 15, 9, 0, 0),
                } }
            />,
        );

        expect(screen.getByText('Delete')).toBeTruthy();
        expect(screen.getByText('Update')).toBeTruthy();
    });
});
