import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { palette } from '../../../new-design';

type FrostedCardProps = {
    children: React.ReactNode;
    containerStyle?: StyleProp<ViewStyle>;
    contentStyle?: StyleProp<ViewStyle>;
};

export default function FrostedCard({ children, containerStyle, contentStyle }: FrostedCardProps) {
    return (
        <View style={ [styles.shadowWrapper, containerStyle] }>
            <View style={ [styles.card, contentStyle] }>
                { children }
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    shadowWrapper: {
        borderRadius: 18,
        shadowColor: palette.overlay.blueMildTransparent,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 1,
        shadowRadius: 14,
        elevation: 18,
    },
    card: {
        borderRadius: 18,
        borderWidth: 1,
        borderColor: palette.overlay.whiteBorderTransparent,
        backgroundColor: palette.overlay.whiteSurfaceTransparent,
        paddingHorizontal: 20,
        paddingVertical: 18,
    },
});
