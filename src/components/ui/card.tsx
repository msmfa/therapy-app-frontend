import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

type CardProps = {
    children: React.ReactNode;
    containerStyle?: StyleProp<ViewStyle>;
    contentStyle?: StyleProp<ViewStyle>;
};

export default function Card({ children, containerStyle, contentStyle }: CardProps) {
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
        shadowColor: '#bb949458',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 1,
        shadowRadius: 14,
        elevation: 18,
    },
    card: {
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#FFFFFF3B',
        backgroundColor: '#ffffff9c',
        paddingHorizontal: 20,
        paddingVertical: 18,
    },
});
