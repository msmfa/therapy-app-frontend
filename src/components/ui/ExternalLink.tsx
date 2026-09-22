import React from 'react';
import { Linking, Pressable, StyleSheet, StyleProp, TextStyle, ViewStyle } from 'react-native';
import type { Theme } from 'designs/designs-themes';
import AppText, { AppTextProps } from './AppText';
import { useThemedStyles } from '../../context/theme';

type TextProps = Omit<AppTextProps, 'variant' | 'onPress' | 'children' | 'style'>;

export type ExternalLinkProps = TextProps & {
    text: string;
    url: string;
    variant?: AppTextProps['variant'];
    containerStyle?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
};

export function ExternalLink({
    text,
    url,
    variant = 'body',
    containerStyle,
    textStyle,
    ...rest
}: ExternalLinkProps) {
    const styles = useThemedStyles(makeStyles);
    const handlePress = () => {
        void Linking.openURL(url).catch(() => undefined);
    };

    return (
        <Pressable
            onPress={ handlePress }
            accessibilityRole="link"
            hitSlop={ 8 }
            style={ [styles.container, containerStyle] }
        >
            { ({ pressed }) => (
                <AppText
                    variant={ variant }
                    style={ [styles.linkText, pressed && styles.linkTextPressed, textStyle] }
                    { ...rest }
                >
                    { text }
                </AppText>
            ) }
        </Pressable>
    );
}

const makeStyles = (theme: Theme) => StyleSheet.create({
    container: {
        alignSelf: 'stretch',
        paddingVertical: 6,
    },
    linkText: {
        color: theme.link.bright,
    },
    linkTextPressed: {
        color: theme.link.brightPressed,
    },
});
