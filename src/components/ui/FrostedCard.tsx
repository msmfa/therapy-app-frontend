import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import type { Theme } from 'designs/designs-themes';
import { useThemedStyles } from '../../context/theme';

type FrostedCardProps = {
    children: React.ReactNode;
    containerStyle?: StyleProp<ViewStyle>;
    contentStyle?: StyleProp<ViewStyle>;
    testID?: string;
};

export default function FrostedCard({ children, containerStyle, contentStyle, testID }: FrostedCardProps) {
    const styles = useThemedStyles(makeStyles);

    return (
        <View style={ [styles.shadowWrapper, containerStyle] }>
            <View testID={ testID } style={ [styles.card, contentStyle] }>
                { children }
            </View>
        </View>
    );
}

const makeStyles = (theme: Theme) => StyleSheet.create({
    shadowWrapper: {
        borderRadius: 18,
        shadowColor: theme.surface.frostedShadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 1,
        shadowRadius: 14,
        elevation: 18,
    },
    card: {
        borderRadius: 18,
        borderWidth: 1,
        borderColor: theme.surface.cardBorder,
        // The lit top edge: what lifts a card off a ground it is barely
        // lighter than. Equal to the border by day, so nothing changes there.
        borderTopColor: theme.surface.cardEdge,
        backgroundColor: theme.surface.card,
        paddingHorizontal: 20,
    },
});
