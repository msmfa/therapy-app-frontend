import { TYPOGRAPHY } from 'designs/designs-typography';
import React from 'react';
import {
    Text as RNText,
    TextProps,
    StyleProp,
    TextStyle,
} from 'react-native';
import { useTheme } from '../../context/theme';

export type AppTextProps = TextProps & {
    variant: keyof typeof TYPOGRAPHY;
    align?: TextStyle['textAlign'];
    style?: StyleProp<TextStyle>;
};

type Variant = keyof typeof TYPOGRAPHY;

/**
 * Which ink each variant is set in.
 *
 * TYPOGRAPHY carries the light ink for each variant and is frozen at import,
 * so the colour is taken from the theme here and laid over it. The mapping
 * is the one TYPOGRAPHY already encodes: headings in the primary ink, running
 * text in the secondary.
 */
const INK_FOR_VARIANT: Record<Variant, 'primary' | 'secondary'> = {
    h1: 'primary',
    h2: 'primary',
    h3: 'primary',
    body: 'secondary',
    bodySecondary: 'secondary',
    caption: 'secondary',
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
    const { theme } = useTheme();
    const baseTypography = TYPOGRAPHY[variant];

    // Native Text scales both fontSize and lineHeight with the same multiplier.
    // Scaling lineHeight here as well applies Dynamic Type twice and makes
    // multiline labels (and their buttons/cards) excessively tall.
    const textStyles: StyleProp<TextStyle> = [
        baseTypography,
        { color: theme.ink[INK_FOR_VARIANT[variant]] },
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
