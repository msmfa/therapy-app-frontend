import { useState, type ReactNode } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import AppText from './AppText';
import { DottedDivider } from './DottedDivider';
import type { Theme } from 'designs/designs-themes';
import { useTheme, useThemedStyles } from '../../context/theme';

export type DropdownOption<Id extends string> = {
    id: Id;
    label: string;
};

type Props<Id extends string> = {
    options: readonly DropdownOption<Id>[];
    /** The chosen option's id; anything not in `options` shows the placeholder. */
    value: string | null;
    /** Asks for a choice while nothing in `options` is chosen. */
    placeholder: string;
    onChange: (next: Id) => void;
    /** Rows that stay in view above the trigger, in the same group. */
    leading?: ReactNode;
    triggerHint?: string;
    optionHint?: string;
    testID?: string;
};

/**
 * One row naming the choice, opening onto the options with the chosen one
 * ticked, as the language page has it. Picking an option closes the list.
 */
export function Dropdown<Id extends string>({
    options,
    value,
    placeholder,
    onChange,
    leading,
    triggerHint,
    optionHint,
    testID,
}: Props<Id>) {
    const { theme } = useTheme();
    const styles = useThemedStyles(makeStyles);
    const [open, setOpen] = useState(false);

    const chosen = options.find((option) => option.id === value);
    const triggerLabel = chosen?.label ?? placeholder;

    return (
        <View style={ styles.rows }>
            { leading !== undefined && (
                <>
                    { leading }
                    <DottedDivider style={ styles.divider } />
                </>
            ) }

            <TouchableOpacity
                style={ styles.row }
                onPress={ () => setOpen((wasOpen) => !wasOpen) }
                accessibilityRole="button"
                accessibilityState={ { expanded: open } }
                accessibilityLabel={ triggerLabel }
                accessibilityHint={ triggerHint }
                testID={ testID }
            >
                <View style={ styles.copy }>
                    <AppText
                        variant="body"
                        style={ [styles.label, chosen === undefined && styles.placeholder] }
                    >
                        { triggerLabel }
                    </AppText>
                </View>
                <Ionicons
                    name={ open ? 'chevron-up' : 'chevron-down' }
                    size={ 20 }
                    color={ theme.ink.primary }
                    // The trigger already announces its expanded state, so
                    // the glyph must not repeat it.
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                />
            </TouchableOpacity>

            { open && options.map((option) => (
                <View key={ option.id }>
                    <DottedDivider style={ styles.divider } />
                    <ChoiceRow
                        label={ option.label }
                        selected={ option.id === value }
                        indented
                        onPress={ () => {
                            setOpen(false);
                            onChange(option.id);
                        } }
                        accessibilityHint={ optionHint }
                        testID={ testID === undefined ? undefined : `${testID}.${option.id}` }
                    />
                </View>
            )) }
        </View>
    );
}

type ChoiceRowProps = {
    label: string;
    detail?: string;
    selected: boolean;
    onPress: () => void;
    /** Sits the row under a dropdown rather than as a peer of its trigger. */
    indented?: boolean;
    accessibilityLabel?: string;
    accessibilityHint?: string;
    testID?: string;
};

/** A ticked-when-chosen row, for a Dropdown's options and its leading rows. */
export function ChoiceRow({
    label,
    detail,
    selected,
    onPress,
    indented = false,
    accessibilityLabel,
    accessibilityHint,
    testID,
}: ChoiceRowProps) {
    const { theme } = useTheme();
    const styles = useThemedStyles(makeStyles);

    return (
        <TouchableOpacity
            style={ [styles.row, indented && styles.option] }
            onPress={ onPress }
            accessibilityRole="radio"
            accessibilityState={ { selected, checked: selected } }
            accessibilityLabel={ accessibilityLabel ?? label }
            accessibilityHint={ accessibilityHint }
            testID={ testID }
        >
            <View style={ styles.copy }>
                <AppText variant="body" style={ styles.label }>
                    { label }
                </AppText>
                { detail !== undefined && (
                    <AppText variant="caption" style={ styles.detail }>
                        { detail }
                    </AppText>
                ) }
            </View>
            { selected && (
                <Ionicons
                    name="checkmark"
                    size={ 22 }
                    color={ theme.accent.mark }
                    // The row already announces its selected state, so the
                    // glyph must not repeat it.
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                />
            ) }
        </TouchableOpacity>
    );
}

const ROWS_PADDING = 14;

const makeStyles = (theme: Theme) => StyleSheet.create({
    rows: {
        paddingHorizontal: ROWS_PADDING,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.surface.rowGroupBorder,
        backgroundColor: theme.surface.rowGroup,
    },
    divider: {
        marginHorizontal: -ROWS_PADDING,
    },
    row: {
        minHeight: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        paddingVertical: 12,
    },
    option: {
        paddingStart: 12,
    },
    copy: {
        flex: 1,
    },
    label: {
        color: theme.ink.primary,
    },
    placeholder: {
        color: theme.ink.secondary,
    },
    detail: {
        color: theme.ink.secondary,
        marginTop: 2,
    },
});
