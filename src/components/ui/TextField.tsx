import React, { forwardRef, useState } from 'react';
import {
    Platform,
    StyleProp,
    StyleSheet,
    TextInput,
    TextInputProps,
    TextStyle,
    View,
    ViewStyle,
} from 'react-native';
// Pending: consolidate color imports once design tokens settle (see TODO.md).
import { spacing } from '../../constants';
import { COLOR_VARIANTS, colors, palette } from '../../../new-design';
import AppText from './AppText';

type TextFieldProps = TextInputProps & {
    label: string;
    error?: string;
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
            containerStyle,
            labelStyle,
            inputWrapperStyle,
            RightAccessory,
            onFocus,
            onBlur,
            style,
            ...inputProps
        },
        ref,
    ) => {
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
                        error && styles.inputWrapperError,
                        inputWrapperStyle,
                    ] }
                >
                    <TextInput
                        ref={ ref }
                        style={ [styles.input, style] }
                        placeholderTextColor={ colors.textMuted }
                        { ...inputProps }
                        onFocus={ handleFocus }
                        onBlur={ handleBlur }
                    />

                    { RightAccessory ? <View style={ styles.accessory }>{ RightAccessory }</View> : null }
                </View>

                { error ? (
                    <AppText style={ styles.error } variant='caption'>
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

const styles = StyleSheet.create({
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
        borderColor: palette.neutral.boundary,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        minHeight: 48,
    },
    inputWrapperFocused: {
        borderColor: COLOR_VARIANTS.black.dark,
    },
    inputWrapperError: {
        borderColor: colors.error,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: colors.text,
        paddingVertical: Platform.select({ android: 0, default: 8 }),
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
        color: colors.error,
    },
});
