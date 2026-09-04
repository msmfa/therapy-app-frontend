import { TYPOGRAPHY } from 'designs/designs-typography';
import React from 'react';
import {
    Text as RNText,
    TextProps,
    StyleProp,
    StyleSheet,
    TextStyle,
    useWindowDimensions,
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

    // Font size follows Dynamic Type on its own, but a fixed lineHeight does
    // not, so at the larger accessibility sizes the glyphs outgrow their line
    // box and the text is clipped. Scaling the line height by the same factor
    // keeps it legible. Read from useWindowDimensions rather than
    // PixelRatio.getFontScale() so a change of text size re-renders.
    const { fontScale } = useWindowDimensions();
    // Follow whatever scale the glyphs actually get, including a caller's cap:
    // scaling the line box by 3.1 while the type is capped at 1.8 leaves a gulf
    // between the lines.
    const effectiveScale = !allowFontScaling
        ? 1
        : typeof maxFontSizeMultiplier === 'number' && maxFontSizeMultiplier > 0
            ? Math.min(fontScale, maxFontSizeMultiplier)
            : fontScale;
    const flattened = StyleSheet.flatten<TextStyle>(style);
    const typographyLineHeight: number | undefined =
        'lineHeight' in baseTypography ? baseTypography.lineHeight : undefined;
    const baseLineHeight: number | undefined =
        flattened?.lineHeight ?? typographyLineHeight;
    const scaledLineHeight: StyleProp<TextStyle> =
        baseLineHeight !== undefined && effectiveScale !== 1
            ? { lineHeight: baseLineHeight * effectiveScale }
            : null;

    const textStyles: StyleProp<TextStyle> = [
        baseTypography,
        align !== 'auto' ? { textAlign: align } : null,
        style,
        scaledLineHeight,
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
