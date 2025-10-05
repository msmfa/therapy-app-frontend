import React from 'react';
import { View, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppText from './AppText';

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
            <Ionicons name="alert-circle" size={ 18 } color={ RED } style={ styles.icon } />
            <AppText style={ styles.text } variant='body'>
                { message }
            </AppText>

            { onDismiss ? (
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Dismiss error"
                    onPress={ onDismiss }
                    hitSlop={ 8 }
                    style={ styles.close }
                >
                    <Ionicons name="close" size={ 18 } color={ RED } />
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
