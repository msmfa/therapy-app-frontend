import React from 'react';
import { View, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppText from './AppText';
import type { Theme } from 'designs/designs-themes';
import { useTranslation } from 'react-i18next';
import { useTheme, useThemedStyles } from '../../context/theme';

type Props = {
    message: string | null;
    style?: ViewStyle;
    testID?: string;
    onDismiss?: () => void;
};

export function ErrorMessage({ message, onDismiss, style, testID }: Props) {
    const { t } = useTranslation('common');
    const { theme } = useTheme();
    const styles = useThemedStyles(makeStyles);
    return (
        <View style={ [styles.container, style] } testID={ testID }>
            <Ionicons name="alert-circle" size={ 18 } color={ theme.red.mid } style={ styles.icon } />
            <AppText style={ styles.text } variant='body'>
                { message }
            </AppText>

            { onDismiss ? (
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={ t('a11y.dismissError') }
                    onPress={ onDismiss }
                    hitSlop={ 8 }
                    style={ styles.close }
                >
                    <Ionicons name="close" size={ 18 } color={ theme.red.mid } />
                </Pressable>
            ) : null }
        </View>
    );
}

const makeStyles = (theme: Theme) => StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: theme.red.light,
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
