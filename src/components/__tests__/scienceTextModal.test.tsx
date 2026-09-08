import React from 'react';
import { render } from '@testing-library/react-native';
import { ScienceTextModal } from '../ScienceTextModal';
import { REMINDER_SCIENCE_COPY } from '../../constants/neuroReminders';
import { ReminderType } from '../../utils/types';

jest.mock('@expo/vector-icons', () => ({
    Feather: () => null,
}));

const TYPES = Object.values(ReminderType);

describe('ScienceTextModal', () => {
    it('opens each write-up with a TLDR before the research itself', () => {
        for (const type of TYPES) {
            const { getByText, unmount } = render(<ScienceTextModal type={ type } />);

            // The label and the summary are one line, so they compose into
            // one string rather than matching separately.
            expect(getByText(`TLDR: ${REMINDER_SCIENCE_COPY[type].tldr}`)).toBeTruthy();
            unmount();
        }
    });

    it('keeps the TLDRs in plain language, with no citation markers', () => {
        for (const type of TYPES) {
            const { tldr } = REMINDER_SCIENCE_COPY[type];

            // The body carries the citations; the summary is for a reader
            // deciding whether the reminder is worth having.
            expect(tldr).not.toMatch(/\[\d/);
            expect(tldr.length).toBeGreaterThan(40);
        }
    });
});
