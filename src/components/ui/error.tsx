import React from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Props = {
	message: string | null;
	style?: ViewStyle;
	testID?: string;
	onDismiss?: () => void;
};

const RED = '#DC2626'; // danger
const RED_SOFT = '#FEE2E2'; // dangerLight

export function ErrorMessage({ message, onDismiss, style, testID }: Props) {
    return (
        <View style={ [styles.container, style] } testID={ testID }>
            <Ionicons name="alert-circle" size={ 18 } color={ 'red' } style={ styles.icon } />
            <Text style={ styles.text }>{ message }</Text>

            { onDismiss ? (
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Dismiss error"
                    onPress={ onDismiss }
                    hitSlop={ 8 }
                    style={ styles.close }
                >
                    <Ionicons name="close" size={ 18 } color={ 'red' } />
                </Pressable>
            ) : null }
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: RED,
        backgroundColor: RED_SOFT,
    },
    icon: {
        marginRight: 8,
        marginTop: 1,
    },
    text: {
        flex: 1,
        color: RED,
        fontSize: 14,
        lineHeight: 20,
        fontWeight: '600',
    },
    close: {
        marginLeft: 8,
        padding: 2,
        alignSelf: 'center',
    },
});

export default ErrorMessage;
