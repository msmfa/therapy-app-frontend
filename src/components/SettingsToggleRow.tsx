import React from 'react';
import { StyleSheet, Switch, View } from 'react-native';
import AppText from './ui/AppText';
import type { Theme } from 'designs/designs-themes';
import { useTheme, useThemedStyles } from '../context/theme';

type Props = {
    text: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
    accessibilityHint?: string;
    testID?: string;
};

/**
 * A settings row that carries a switch instead of an arrow.
 *
 * Same frame as `SettingsRow`, since the two sit in one stack and a row that
 * changed shape depending on what it did would read as two different lists.
 * The switch is the whole control: the row does not navigate, so the label
 * names the state the switch would move to rather than the page it opens.
 */
export function SettingsToggleRow({ text, value, onValueChange, accessibilityHint, testID }: Props) {
    const { theme } = useTheme();
    const styles = useThemedStyles(makeStyles);

    return (
        <View style={ styles.wrapper }>
            <AppText numberOfLines={ 3 } variant="body" style={ styles.text }>
                { text }
            </AppText>
            <Switch
                accessibilityHint={ accessibilityHint }
                accessibilityLabel={ text }
                ios_backgroundColor={ theme.surface.rowBorder }
                onValueChange={ onValueChange }
                testID={ testID }
                thumbColor={ theme.solid.text }
                trackColor={ { false: theme.surface.rowBorder, true: theme.accent.mark } }
                value={ value }
            />
        </View>
    );
}

const makeStyles = (theme: Theme) => StyleSheet.create({
    wrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 16,
        paddingHorizontal: 18,
        justifyContent: 'space-between',
        borderWidth: 1,
        borderRadius: 12,
        backgroundColor: theme.surface.row,
        borderColor: theme.surface.rowBorder,
        width: '100%',
        minHeight: 64,
    },
    text: {
        color: theme.ink.primary,
        flexShrink: 1,
    },
});
