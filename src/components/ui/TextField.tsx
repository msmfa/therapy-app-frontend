import React, { forwardRef, useState } from 'react';
import {
    StyleProp,
    StyleSheet,
    TextInput,
    TextInputProps,
    TextStyle,
    View,
    ViewStyle,
} from 'react-native';
import { spacing } from '../../constants';
import type { Theme } from 'designs/designs-themes';
import { useTheme, useThemedStyles } from '../../context/theme';
import AppText from './AppText';

type TextFieldProps = TextInputProps & {
    label: string;
    error?: string;
    /** Color of the validation message and invalid field border. */
    errorColor?: TextStyle['color'];
    containerStyle?: StyleProp<ViewStyle>;
    labelStyle?: StyleProp<TextStyle>;
    inputWrapperStyle?: StyleProp<ViewStyle>;
    RightAccessory?: React.ReactNode;
};

const TextField = forwardRef<TextInput, TextFieldProps>(
    (
        {
            label,
            error,
            errorColor: errorColorProp,
            containerStyle,
            labelStyle,
            inputWrapperStyle,
            RightAccessory,
            onFocus,
            onBlur,
            style,
            accessibilityLabel,
            ...inputProps
        },
        ref,
    ) => {
        const { theme } = useTheme();
        const styles = useThemedStyles(makeStyles);
        const errorColor = errorColorProp ?? theme.status.error;
        const [focused, setFocused] = useState(false);
        type FocusEventType = Parameters<NonNullable<TextInputProps['onFocus']>>[0];
        type BlurEventType = Parameters<NonNullable<TextInputProps['onBlur']>>[0];

        const handleFocus = (event: FocusEventType) => {
            setFocused(true);
            onFocus?.(event);
        };

        const handleBlur = (event: BlurEventType) => {
            setFocused(false);
            onBlur?.(event);
        };

        return (
            <View style={ [styles.container, containerStyle] }>
                <AppText style={ [styles.label, labelStyle] } variant='body'>
                    { label }
                </AppText>

                <View
                    style={ [
                        styles.inputWrapper,
                        focused && styles.inputWrapperFocused,
                        error && { borderColor: errorColor },
                        inputWrapperStyle,
                    ] }
                >
                    <TextInput
                        ref={ ref }
                        style={ [styles.input, style] }
                        placeholderTextColor={ theme.ink.tertiary }
                        keyboardAppearance={ theme.scheme }
                        accessibilityLabel={ accessibilityLabel ?? label }
                        { ...inputProps }
                        onFocus={ handleFocus }
                        onBlur={ handleBlur }
                    />

                    { RightAccessory ? <View style={ styles.accessory }>{ RightAccessory }</View> : null }
                </View>

                { error ? (
                    <AppText
                        style={ [styles.error, { color: errorColor }] }
                        variant='caption'
                        accessibilityLiveRegion='polite'
                    >
                        { error }
                    </AppText>
                ) : null }
            </View>
        );
    },
);

TextField.displayName = 'TextField';

export type { TextFieldProps };
export default TextField;

const makeStyles = (theme: Theme) => StyleSheet.create({
    container: {
        marginBottom: spacing.lg,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    inputWrapper: {
        borderWidth: 1,
        borderColor: theme.surface.fieldBorder,
        backgroundColor: theme.surface.field,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        minHeight: 48,
    },
    inputWrapperFocused: {
        borderColor: theme.surface.fieldBorderFocused,
    },
    input: {
        flex: 1,
        fontSize: 16,
        // Fixed rather than left to intrinsic sizing: the wrapper centers this
        // box via `alignItems: 'center'`, and centering a box whose height is
        // derived from padding + content metrics depends on a layout pass
        // completing before first paint. A literal height is centered
        // correctly from the first frame.
        lineHeight: 20,
        height: 20,
        color: theme.ink.secondary,
        paddingVertical: 0,
        textAlignVertical: 'center',
        includeFontPadding: false,
    },
    accessory: {
        marginLeft: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    error: {
        fontSize: 12,
        marginTop: 8,
    },
});
