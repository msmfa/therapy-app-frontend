import { ReactNode, useMemo } from "react";
import { View, StyleSheet, StyleProp, ViewStyle } from "react-native";
import AppText from "./typography";

type Props = {
    children: ReactNode;
    addedStyles?: StyleProp<ViewStyle>;
    hue?: number;
    tabWithBorder?: boolean;
}

const BASE_HUE = 0;
const BACKGROUND_SATURATION = 60;
const BACKGROUND_LIGHTNESS = 88;
const TEXT_SATURATION = 70;
const TEXT_LIGHTNESS = 52;

export default function Badge({ children, addedStyles, hue, tabWithBorder }: Props) {
    const normalizedHue = useMemo(
        () => Math.max(0, Math.min(360, hue ?? BASE_HUE)),
        [hue]
    );

    const backgroundColor = useMemo(
        () => `hsl(${normalizedHue}, ${BACKGROUND_SATURATION}%, ${BACKGROUND_LIGHTNESS}%)`,
        [normalizedHue]
    );

    const textColor = useMemo(
        () => `hsl(${normalizedHue}, ${TEXT_SATURATION}%, ${TEXT_LIGHTNESS}%)`,
        [normalizedHue]
    );

    const borderColor = useMemo(
        () => `hsl(${normalizedHue}, ${TEXT_SATURATION}%, ${TEXT_LIGHTNESS}%)`,
        [normalizedHue]
    );


    return (
        <View style={ [styles.badge, tabWithBorder && styles.tabWithBorder, { backgroundColor, borderColor }, addedStyles] }>
            <AppText
                variant="caption"
                style={ [styles.badgeText, { color: textColor }] }
            >
                { children }
            </AppText>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabWithBorder: {
        borderWidth: 1,
        borderTopWidth: 0,
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        borderBottomLeftRadius: 8,
        borderBottomRightRadius: 8,
        borderColor: `hsl(${BASE_HUE}, ${TEXT_SATURATION}%, ${TEXT_LIGHTNESS}%)`,
    },
    badgeText: {
        color: `hsl(${BASE_HUE}, ${TEXT_SATURATION}%, ${TEXT_LIGHTNESS}%)`,
    },
});
