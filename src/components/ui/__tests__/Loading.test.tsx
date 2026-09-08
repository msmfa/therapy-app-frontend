import React from 'react';
import { Modal } from 'react-native';
import { render } from '@testing-library/react-native';
import Loading from '../Loading';

jest.mock('../PulsingSquare', () => ({ __esModule: true, default: () => null }));

describe('screen-local loading', () => {
    it.each([
        { name: 'full screen', props: {} },
        { name: 'transparent full screen', props: { transparent: true } },
        { name: 'compact', props: { fullScreen: false } },
    ])('exposes accessible progress without a native modal in $name mode', ({ props }) => {
        const screen = render(<Loading { ...props } />);

        // Background tabs and successive auth gates must never present or
        // dismiss a native controller while an iOS password sheet is active.
        expect(screen.UNSAFE_queryAllByType(Modal)).toHaveLength(0);
        expect(screen.getByRole('progressbar', { name: 'Loading' }).props.accessibilityState)
            .toEqual({ busy: true });
    });
});
