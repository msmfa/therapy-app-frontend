import { Link } from "expo-router";
import type { Href } from "expo-router";
import { Pressable, StyleSheet, StyleProp, Text, TextStyle } from "react-native";
import { COLOR_VARIANTS } from "designs/designs-colors";
import type { ReactNode } from "react";

type InternalLinkProps = {
    href: Href;
    children: ReactNode;
    style?: StyleProp<TextStyle>;
    testID?: string;
};

export function InternalLink({ href, children, style, testID }: InternalLinkProps) {
    return (
        <Link href={ href } asChild>
            <Pressable
                testID={ testID }
                android_ripple={ { color: 'transparent' } }
                style={ ({ pressed }) => [styles.pressable, pressed && styles.pressablePressed] }
            >
                <Text style={ [styles.signupLink, style] }>{ children }</Text>
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
    signupLink: {
        color: COLOR_VARIANTS.blue.mid,
    },
});
