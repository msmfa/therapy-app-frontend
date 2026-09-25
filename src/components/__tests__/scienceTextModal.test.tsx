import React from 'react';
import { Linking } from 'react-native';
import { fireEvent, render, within } from '@testing-library/react-native';
import { ScienceTextModal } from '../ScienceTextModal';
import { reminderScienceCopy } from '../../constants/neuroReminders';
import { SCIENCE_ILLUSTRATIONS } from '../../constants/scienceIllustrations';
import { ReminderType } from '../../utils/types';

jest.mock('@expo/vector-icons', () => ({
    Feather: () => null,
    Ionicons: () => null,
}));

const TYPES = Object.values(ReminderType);

describe('ScienceTextModal', () => {
    it('opens each write-up with a TLDR before the research itself', () => {
        for (const type of TYPES) {
            const { getByText, unmount } = render(<ScienceTextModal type={ type } />);

            // The label and the summary are one line, so they compose into
            // one string rather than matching separately.
            expect(getByText(`TLDR: ${reminderScienceCopy()[type].tldr}`)).toBeTruthy();
            unmount();
        }
    });

    it('keeps the TLDRs in plain language, with no citation markers', () => {
        for (const type of TYPES) {
            const { tldr } = reminderScienceCopy()[type];

            // The body carries the citations; the summary is for a reader
            // deciding whether the reminder is worth having.
            expect(tldr).not.toMatch(/\[\d/);
            expect(tldr.length).toBeGreaterThan(40);
        }
    });

    it('puts each picture above its matching paragraph', () => {
        for (const type of TYPES) {
            const pictures = SCIENCE_ILLUSTRATIONS[type];
            const { body } = reminderScienceCopy()[type];
            const { queryAllByTestId, unmount } = render(<ScienceTextModal type={ type } />);

            // Slots stay aligned with the paragraphs even when a particular
            // paragraph has no approved illustration yet.
            const pictureCount = pictures?.filter(Boolean).length ?? 0;
            expect(queryAllByTestId(/^science-illustration-/)).toHaveLength(pictureCount);
            if (pictures) expect(pictures).toHaveLength(body.length);
            unmount();
        }
    });

    it('keeps references collapsed until the disclosure is pressed', () => {
        const { getByTestId, queryByTestId } = render(
            <ScienceTextModal type={ ReminderType.EarlyConsolidation } />,
        );

        expect(getByTestId('science-references-toggle').props.accessibilityState)
            .toEqual({ expanded: false });
        expect(queryByTestId('science-references-list')).toBeNull();

        fireEvent.press(getByTestId('science-references-toggle'));

        expect(getByTestId('science-references-toggle').props.accessibilityState)
            .toEqual({ expanded: true });
        expect(getByTestId('science-references-list')).toBeTruthy();

        fireEvent.press(getByTestId('science-references-toggle'));
        expect(queryByTestId('science-references-list')).toBeNull();
    });

    it('opens a source when its expanded reference link is pressed', () => {
        const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
        const { getByTestId } = render(
            <ScienceTextModal type={ ReminderType.EarlyConsolidation } />,
        );
        const firstSource = reminderScienceCopy()[ReminderType.EarlyConsolidation].sources[0];

        fireEvent.press(getByTestId('science-references-toggle'));
        fireEvent.press(within(getByTestId('science-references-list')).getAllByRole('link')[0]);

        expect(openURL).toHaveBeenCalledWith(firstSource.url);
        openURL.mockRestore();
    });
});
