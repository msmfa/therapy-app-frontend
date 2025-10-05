import React, { forwardRef, useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { colors } from '../../../new-design';
import TextField, { TextFieldProps } from './TextField';

export type PasswordFieldProps = Omit<TextFieldProps, 'secureTextEntry' | 'RightAccessory'> & {
    initiallyVisible?: boolean;
};

const PasswordField = forwardRef<TextInput, PasswordFieldProps>(
    ({ initiallyVisible = false, textContentType, autoCapitalize, autoCorrect, ...props }, ref) => {
        const [visible, setVisible] = useState(initiallyVisible);

        const handleToggleVisibility = () => {
            setVisible((prev) => !prev);
        };

        return (
            <TextField
                ref={ ref }
                secureTextEntry={ !visible }
                textContentType={ textContentType ?? 'password' }
                autoCapitalize={ autoCapitalize ?? 'none' }
                autoCorrect={ autoCorrect ?? false }
                RightAccessory={ (
                    <TouchableOpacity
                        onPress={ handleToggleVisibility }
                        style={ styles.toggleButton }
                        accessibilityRole="button"
                        accessibilityLabel={ visible ? 'Hide password' : 'Show password' }
                        hitSlop={ styles.hitSlop }
                    >
                        <Feather name={ visible ? 'eye-off' : 'eye' } size={ 18 } color={ colors.text } />
                    </TouchableOpacity>
                ) }
                { ...props }
            />
        );
    },
);

PasswordField.displayName = 'PasswordField';

export default PasswordField;

const styles = StyleSheet.create({
    toggleButton: {
        padding: 4,
    },
    hitSlop: {
        top: 8,
        bottom: 8,
        left: 8,
        right: 8,
    },
});
