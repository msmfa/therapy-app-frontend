import React from 'react';
import { Linking } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { CitedText } from '../CitedText';

const sources = [
    { text: 'First study', url: 'https://example.com/study-one' },
    { text: 'Second study', url: 'https://example.com/study-two' },
    { text: 'Third study', url: 'https://example.com/study-three' },
];

describe('CitedText source actions', () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);

    afterEach(() => openURL.mockClear());
    afterAll(() => openURL.mockRestore());

    it('opens each source in a grouped marker when no page handler is supplied', () => {
        const { getByRole } = render(<CitedText text="Research [1, 3]." sources={ sources } />);

        fireEvent.press(getByRole('link', { name: 'Source 1: First study' }));
        fireEvent.press(getByRole('link', { name: 'Source 3: Third study' }));

        expect(openURL.mock.calls).toEqual([[sources[0].url], [sources[2].url]]);
    });

    it('passes one-based source positions to the page handler without opening a browser', () => {
        const onCitationPress = jest.fn();
        const { getByRole } = render(
            <CitedText text="Research [3, 2]." sources={ sources } onCitationPress={ onCitationPress } />,
        );

        const thirdSource = getByRole('link', { name: 'Source 3: Third study' });
        expect(thirdSource.props.accessibilityHint).toBe('Jump to this source in the references below.');
        fireEvent.press(thirdSource);
        fireEvent.press(getByRole('link', { name: 'Source 2: Second study' }));

        expect(onCitationPress.mock.calls).toEqual([[3], [2]]);
        expect(openURL).not.toHaveBeenCalled();
    });

    it.each([false, true])('leaves invalid markers inactive with a page handler: %s', (handleOnPage) => {
        const onCitationPress = handleOnPage ? jest.fn() : undefined;
        const { getAllByRole } = render(
            <CitedText
                text="Research [0, 1, 2, 3, 4, 9007199254740993], plus [bad] and [-1]."
                sources={ [
                    sources[0],
                    { text: '', url: 'https://example.com/unnamed' },
                    { text: 'Missing URL', url: ' ' },
                ] }
                onCitationPress={ onCitationPress }
            />,
        );

        const links = getAllByRole('link');
        expect(links).toHaveLength(1);
        expect(links[0].props.accessibilityLabel).toBe('Source 1: First study');
        expect(openURL).not.toHaveBeenCalled();
        if (onCitationPress) expect(onCitationPress).not.toHaveBeenCalled();
    });

    it('allows the same source to appear more than once within a grouped marker', () => {
        const onCitationPress = jest.fn();
        const { getAllByRole } = render(
            <CitedText text="Research [1, 1]." sources={ sources } onCitationPress={ onCitationPress } />,
        );

        for (const link of getAllByRole('link', { name: 'Source 1: First study' })) {
            fireEvent.press(link);
        }

        expect(onCitationPress.mock.calls).toEqual([[1], [1]]);
        expect(openURL).not.toHaveBeenCalled();
    });
});
