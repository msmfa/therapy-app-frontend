import React, { forwardRef, useState } from 'react';
import {
    NativeSyntheticEvent,
    StyleProp,
    StyleSheet,
    Text,
    TextInput,
    TextInputFocusEventData,
    TextInputProps,
    TextStyle,
    View,
    ViewStyle,
} from 'react-native';

import { Colors, spacing } from '../../const';
import { Palette } from '../../../design';

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

        const handleFocus = (event: NativeSyntheticEvent<TextInputFocusEventData>) => {
            setFocused(true);
            if (typeof onFocus === 'function') {
                onFocus(event);
            }
        };

        const handleBlur = (event: NativeSyntheticEvent<TextInputFocusEventData>) => {
            setFocused(false);
            if (typeof onBlur === 'function') {
                onBlur(event);
            }
        };

        return (
            <View style={ [styles.container, containerStyle] }>
                <Text style={ [styles.label, labelStyle] }>{ label }</Text>

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
                        placeholderTextColor={ Palette.greyDarkest }
                        {...inputProps }
                        onFocus={ handleFocus }
                        onBlur={ handleBlur }
                    />

                    { RightAccessory ? <View style={ styles.accessory }>{ RightAccessory }</View> : null }
                </View>

                { error ? <Text style={ styles.error }>{ error }</Text> : null }
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
        color: Palette.greyDarkest,
        marginBottom: spacing.xs,
    },
    inputWrapper: {
        borderWidth: 1,
        borderColor: Palette.greyLight,
        borderRadius: 12,
        backgroundColor: Palette.white,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
    },
    inputWrapperFocused: {
        borderColor: Palette.darkBlue,
    },
    inputWrapperError: {
        borderColor: Colors.Red,
    },
    input: {
        flex: 1,
        fontSize: 16,
        paddingVertical: spacing.sm,
        color: Palette.dark,
    },
    accessory: {
        marginLeft: spacing.sm,
        justifyContent: 'center',
        alignItems: 'center',
    },
    error: {
        color: Colors.Red,
        fontSize: 12,
        marginTop: spacing.xs,
    },
});
