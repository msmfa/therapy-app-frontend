import { TYPOGRAPHY } from 'designs/designs-typography';
import React from 'react';
import { Text as RNText, TextProps, StyleProp, TextStyle } from 'react-native';

export type AppTextProps = TextProps & {
    variant: keyof typeof TYPOGRAPHY;
    align?: TextStyle['textAlign'];
    style?: StyleProp<TextStyle>;
};

export default function AppText({
    children,
    variant = 'body',
    align = 'auto',
    style,
    ...rest
}: AppTextProps) {
    const baseTypography = TYPOGRAPHY[variant];

    const textStyles: StyleProp<TextStyle> = [
        baseTypography,
        align !== 'auto' ? { textAlign: align } : null,
        style,
    ];

    return (
        <RNText { ...rest } style={ textStyles }>
            { children }
        </RNText>
    );
}
