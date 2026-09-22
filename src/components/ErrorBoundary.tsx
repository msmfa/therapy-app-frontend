import { ErrorBoundaryProps } from "expo-router";
import { View, StyleSheet } from "react-native";
import AppText from './ui/AppText';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/theme';

// Pending: align error boundary styling with app theme (see TODO.md).
export function ErrorBoundaryUI({ error, retry }: ErrorBoundaryProps) {
    const { t } = useTranslation('common');
    const { theme } = useTheme();
    return (
        <View style={ [styles.container, { backgroundColor: theme.surface.sheet }] }>
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
    },
});
