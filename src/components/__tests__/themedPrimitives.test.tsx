import React from 'react';
import { StyleSheet, type TextStyle, type ViewStyle } from 'react-native';
import { render } from '@testing-library/react-native';

import { darkTheme, lightTheme } from 'designs/designs-themes';
import { TEXT_COLORS } from 'designs/designs-colors';
import { FixedThemeProvider } from '../../context/theme';
import AppText from '../ui/AppText';
import { Button } from '../ui/Button';
import Badge from '../ui/Badge';
import FrostedCard from '../ui/FrostedCard';
import RadioButton from '../ui/RadioButton';
import TextField from '../ui/TextField';
import { SettingsRow } from '../SettingsRow';

jest.mock('@expo/vector-icons', () => ({
    Ionicons: () => null,
    Feather: () => null,
}));

/**
 * The primitives every screen is built from have to repaint when the theme
 * changes. Module-scope StyleSheets do not, silently, so each of these
 * renders once under each theme and checks the colour it actually got.
 */
const flat = <T extends ViewStyle | TextStyle>(style: unknown): T => StyleSheet.flatten(style as T) as T;

const dark = (ui: React.ReactElement) => render(<FixedThemeProvider scheme="dark">{ ui }</FixedThemeProvider>);
const light = (ui: React.ReactElement) => render(<FixedThemeProvider scheme="light">{ ui }</FixedThemeProvider>);

describe('themed primitives', () => {
    it('sets AppText in the theme\'s ink, per variant', () => {
        const d = dark(<><AppText variant="h1">Head</AppText><AppText variant="body">Body</AppText></>);
        expect(flat<TextStyle>(d.getByText('Head').props.style).color).toBe(darkTheme.ink.primary);
        expect(flat<TextStyle>(d.getByText('Body').props.style).color).toBe(darkTheme.ink.secondary);

        // And exactly what it painted before the theme existed, by day.
        const l = light(<><AppText variant="h1">Head</AppText><AppText variant="body">Body</AppText></>);
        expect(flat<TextStyle>(l.getByText('Head').props.style).color).toBe(TEXT_COLORS.primary);
        expect(flat<TextStyle>(l.getByText('Body').props.style).color).toBe(TEXT_COLORS.secondary);
    });

    it('lets a caller\'s colour win over the variant ink', () => {
        const { getByText } = dark(<AppText variant="body" style={ { color: 'red' } }>Body</AppText>);
        expect(flat<TextStyle>(getByText('Body').props.style).color).toBe('red');
    });

    it('inverts the solid button at night', () => {
        const d = dark(<Button label="Go" onPress={ () => {} } />);
        expect(flat<ViewStyle>(d.getByRole('button').props.style).backgroundColor).toBe(darkTheme.solid.background);
        expect(flat<TextStyle>(d.getByText('Go').props.style).color).toBe(darkTheme.solid.text);

        const l = light(<Button label="Go" onPress={ () => {} } />);
        expect(flat<ViewStyle>(l.getByRole('button').props.style).backgroundColor).toBe(lightTheme.solid.background);
    });

    it('paints the settings row on the theme\'s row surface', () => {
        const d = dark(<SettingsRow text="Language" onPress={ () => {} } />);
        const style = flat<ViewStyle>(d.getByRole('button').props.style);
        expect(style.backgroundColor).toBe(darkTheme.surface.row);
        expect(style.borderColor).toBe(darkTheme.surface.rowBorder);
        expect(flat<TextStyle>(d.getByText('Language').props.style).color).toBe(darkTheme.ink.primary);
    });

    it('lifts a frosted card with the theme\'s edge and shadow', () => {
        const d = dark(<FrostedCard testID="card"><AppText variant="body">x</AppText></FrostedCard>);
        const style = flat<ViewStyle>(d.getByTestId('card').props.style);
        expect(style.backgroundColor).toBe(darkTheme.surface.card);
        expect(style.borderTopColor).toBe(darkTheme.surface.cardEdge);
    });

    it('rings the radio in the theme\'s accent', () => {
        const d = dark(<RadioButton selectedValue onPress={ () => {} }><AppText variant="body">a</AppText></RadioButton>);
        expect(flat<ViewStyle>(d.getByRole('radio').props.style).backgroundColor).toBe(darkTheme.radio.selectedFill);
    });

    it('sets the badge and the field in theme colours', () => {
        const d = dark(<><Badge>New</Badge><TextField label="Email" placeholder="you@example.com" /></>);
        expect(flat<TextStyle>(d.getByText('New').props.style).color).toBe(darkTheme.badge.text);
        const input = d.getByPlaceholderText('you@example.com');
        expect(input.props.placeholderTextColor).toBe(darkTheme.ink.tertiary);
        expect(input.props.keyboardAppearance).toBe('dark');
    });
});
