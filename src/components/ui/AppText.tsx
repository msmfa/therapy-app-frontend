import { TYPOGRAPHY } from 'designs/designs-typography';
import React from 'react';
import {
    Text as RNText,
    TextProps,
    StyleProp,
    TextStyle,
} from 'react-native';

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
    allowFontScaling = true,
    maxFontSizeMultiplier,
    ...rest
}: AppTextProps) {
    const baseTypography = TYPOGRAPHY[variant];

    // Native Text scales both fontSize and lineHeight with the same multiplier.
    // Scaling lineHeight here as well applies Dynamic Type twice and makes
    // multiline labels (and their buttons/cards) excessively tall.
    const textStyles: StyleProp<TextStyle> = [
        baseTypography,
        align !== 'auto' ? { textAlign: align } : null,
        style,
    ];

    return (
        <RNText
            { ...rest }
            allowFontScaling={ allowFontScaling }
            maxFontSizeMultiplier={ maxFontSizeMultiplier }
            style={ textStyles }
        >
            { children }
        </RNText>
    );
}
