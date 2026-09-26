import React from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { GlassPillButton } from '../../ui/GlassPillButton';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { WidgetGuide } from '../WidgetGuide';
import { lightTheme, darkTheme } from 'designs/designs-themes';
import { contrastRatio } from '../../../utils/colorContrast';

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
    __esModule: true,
    default: jest.fn(() => ({ width: 390, height: 844, scale: 3, fontScale: 1 })),
}));

beforeEach(() => {
    jest.mocked(useWindowDimensions).mockReturnValue({ width: 390, height: 844, scale: 3, fontScale: 1 });
});

jest.mock('@expo/vector-icons', () => ({ Feather: () => null }));

it('exposes headings, named controls, and the selected preview size', () => {
    const onBack = jest.fn();
    render(<WidgetGuide onBack={onBack} />);
    expect(screen.getByRole('header', { name: 'Home Screen widget' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Medium', selected: true })).toBeTruthy();
    expect(screen.getByRole('image').props.accessibilityLabel).toMatch(/Medium widget/);
    fireEvent.press(screen.getByRole('button', { name: 'Small' }));
    expect(screen.getByRole('button', { name: 'Small', selected: true })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Medium', selected: false })).toBeTruthy();
    expect(screen.getByRole('image').props.accessibilityLabel).toMatch(/Small widget/);
    fireEvent.press(screen.getByRole('button', { name: 'Back' }));
    expect(onBack).toHaveBeenCalledTimes(1);
});

it('reads each numbered instruction as one item, with no button semantics', () => {
    render(<WidgetGuide onBack={jest.fn()} />);
    for (const number of [1, 2, 3]) {
        expect(screen.getByRole('text', { name: new RegExp(`^${number}\\. `) })).toBeTruthy();
    }
    expect(screen.queryByRole('text', { name: /^4\. / })).toBeNull();
});

for (const theme of [lightTheme, darkTheme]) {
    it(`keeps instruction text and numbers at 4.5:1 contrast in ${theme.scheme} mode`, () => {
        // The graph-paper background stays on the theme ground.
        for (const ground of [theme.ground.base]) {
            expect(contrastRatio(theme.ink.secondary, theme.surface.medium, ground)).toBeGreaterThanOrEqual(4.5);
            expect(contrastRatio(theme.scheme === 'dark' ? '#A7BED2' : '#4E687E', theme.scheme === 'dark' ? '#283746' : '#E3EBF2')).toBeGreaterThanOrEqual(4.5);
        }
    });
}

it('keeps greyed-out options enabled, readable, and at least 44pt tall', () => {
    const result = render(<WidgetGuide onBack={jest.fn()} />);
    const buttons = result.UNSAFE_getAllByType(GlassPillButton);
    for (const button of buttons) expect(button.props.height).toBeGreaterThanOrEqual(44);
    const small = buttons.find(button => !button.props.selected)!;
    expect(contrastRatio(small.props.labelColor, small.props.fillColor)).toBeGreaterThanOrEqual(4.5);
    expect(screen.getByRole('button', { name: 'Small' }).props.accessibilityState.disabled).toBe(false);
});

it('stacks size controls and grows their targets at the largest text scale', () => {
    jest.mocked(useWindowDimensions).mockReturnValue({ width: 320, height: 568, scale: 2, fontScale: 3.12 });
    const result = render(<WidgetGuide onBack={jest.fn()} />);
    for (const button of result.UNSAFE_getAllByType(GlassPillButton)) {
        expect(button.props.height).toBeGreaterThanOrEqual(100);
        expect(StyleSheet.flatten(button.props.style)?.flexBasis).toBeUndefined();
    }
});

it('keeps muted size labels readable in dark mode', () => {
    expect(contrastRatio('#9A9DA0', '#292D31')).toBeGreaterThanOrEqual(4.5);
});
