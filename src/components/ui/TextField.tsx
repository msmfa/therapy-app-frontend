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
// Pending: consolidate color imports once design tokens settle (see TODO.md).
import { spacing } from '../../const';
import { colors } from '../../../new-design';
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
        marginBottom: spacing.xs,
    },
    inputWrapper: {
        borderWidth: 1,
        borderColor: colors.borderLight,
        borderRadius: 12,
        backgroundColor: colors.bgLight,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        minHeight: 48,
    },
    inputWrapperFocused: {
        borderColor: colors.primary,
    },
    inputWrapperError: {
        borderColor: colors.error,
    },
    input: {
        flex: 1,
        fontSize: 16,
        paddingVertical: spacing.sm,
        color: colors.text,
    },
    accessory: {
        marginLeft: spacing.sm,
        justifyContent: 'center',
        alignItems: 'center',
    },
    error: {
        fontSize: 12,
        marginTop: spacing.xs,
        color: colors.error,
    },
});
