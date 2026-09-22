import { Link } from "expo-router";
import type { Href } from "expo-router";
import { Pressable, StyleSheet, StyleProp, Text, TextStyle } from "react-native";
import type { ReactNode } from "react";
import { useTheme } from '../../context/theme';

type InternalLinkProps = {
    href: Href;
    children: ReactNode;
    style?: StyleProp<TextStyle>;
};

export function InternalLink({ href, children, style }: InternalLinkProps) {
    const { theme } = useTheme();

    return (
        <Link href={ href } asChild>
            <Pressable
                android_ripple={ { color: 'transparent' } }
                style={ ({ pressed }) => [styles.pressable, pressed && styles.pressablePressed] }
            >
                <Text style={ [{ color: theme.link.bright }, style] }>{ children }</Text>
            </Pressable>
        </Link>
    );
}

const styles = StyleSheet.create({
    pressable: {
        borderRadius: 4,
    },
    pressablePressed: {
        opacity: 0.75,
    },
});
