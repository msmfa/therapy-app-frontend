import { ReactNode } from "react";
import { View, StyleSheet, StyleProp, ViewStyle } from "react-native";
import AppText from "./AppText";
import type { Theme } from 'designs/designs-themes';
import { useThemedStyles } from '../../context/theme';

type Props = {
    children: ReactNode;
    addedStyles?: StyleProp<ViewStyle>;
    hue?: number;
    tabWithBorder?: boolean;
}

export default function Badge({ children, addedStyles, tabWithBorder }: Props) {
    const styles = useThemedStyles(makeStyles);

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

const makeStyles = (theme: Theme) => StyleSheet.create({
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.badge.fill,
    },
    tabWithBorder: {
        borderWidth: 1,
        borderTopWidth: 0,
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        borderBottomLeftRadius: 8,
        borderBottomRightRadius: 8,
        borderColor: theme.badge.border,
    },
    badgeText: {
        color: theme.badge.text,
    },
});
