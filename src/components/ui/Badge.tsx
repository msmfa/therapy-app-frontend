import { ReactNode } from "react";
import { View, StyleSheet, StyleProp, ViewStyle } from "react-native";
import AppText from "./AppText";
import { COLOR_VARIANTS } from "new-design";

type Props = {
    children: ReactNode;
    addedStyles?: StyleProp<ViewStyle>;
    hue?: number;
    tabWithBorder?: boolean;
}

export default function Badge({ children, addedStyles, tabWithBorder }: Props) {
    return (
        <View style={ [styles.badge, tabWithBorder && styles.tabWithBorder, addedStyles] }>
            <AppText
                variant="caption"
                style={ styles.badgeText }
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
        backgroundColor: COLOR_VARIANTS.blue.light,
    },
    tabWithBorder: {
        borderWidth: 1,
        borderTopWidth: 0,
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        borderBottomLeftRadius: 8,
        borderBottomRightRadius: 8,
        borderColor: COLOR_VARIANTS.blue.mid,
    },
    badgeText: {
        color: COLOR_VARIANTS.blue.dark,
    },
});
