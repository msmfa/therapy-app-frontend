import React from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { render } from '@testing-library/react-native';
import AppText, { AppTextProps } from '../AppText';

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
    __esModule: true,
    default: jest.fn(),
}));

const mockDimensions = useWindowDimensions as jest.MockedFunction<typeof useWindowDimensions>;

describe('AppText native font scaling', () => {
    it.each<{
        name: string;
        props: Partial<AppTextProps>;
        fontSize: number;
        lineHeight: number;
    }>([
        { name: 'default typography', props: {}, fontSize: 16, lineHeight: 24 },
        {
            name: 'custom typography',
            props: { style: [{ fontSize: 17 }, { lineHeight: 25 }] },
            fontSize: 17,
            lineHeight: 25,
        },
        { name: 'capped text', props: { maxFontSizeMultiplier: 1.8 }, fontSize: 16, lineHeight: 24 },
        { name: 'unscaled text', props: { allowFontScaling: false }, fontSize: 16, lineHeight: 24 },
    ])('delegates $name scaling to native Text exactly once', ({ props, fontSize, lineHeight }) => {
        mockDimensions.mockReturnValue({ width: 375, height: 667, scale: 2, fontScale: 1 });
        const screen = render(<AppText variant="body" { ...props }>Your notes</AppText>);

        for (const fontScale of [1, 1.35, 3.12]) {
            mockDimensions.mockReturnValue({ width: 375, height: 667, scale: 2, fontScale });
            screen.rerender(<AppText variant="body" { ...props }>Your notes</AppText>);

            const text = screen.getByText('Your notes');
            // Native Text applies Dynamic Type to both values. Passing a
            // pre-scaled lineHeight would multiply the line spacing again.
            expect(StyleSheet.flatten(text.props.style)).toMatchObject({ fontSize, lineHeight });
            expect(text.props.allowFontScaling).toBe(props.allowFontScaling ?? true);
            expect(text.props.maxFontSizeMultiplier).toBe(props.maxFontSizeMultiplier);
        }
    });
});
