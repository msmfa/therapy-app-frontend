import { ErrorBoundaryProps } from "expo-router";
import { View, StyleSheet } from "react-native";
import AppText from './ui/AppText';
import { COLOR_VARIANTS } from 'designs/designs-colors';
import { useTranslation } from 'react-i18next';

// Pending: align error boundary styling with app theme (see TODO.md).
export function ErrorBoundaryUI({ error, retry }: ErrorBoundaryProps) {
    const { t } = useTranslation('common');
    return (
        <View style={ styles.container }>
            <AppText variant="body">{ error.message }</AppText>
            <AppText onPress={ retry } variant="body">
                { t('a11y.tryAgainQuestion') }
            </AppText>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLOR_VARIANTS.white.primary,
    },
});
