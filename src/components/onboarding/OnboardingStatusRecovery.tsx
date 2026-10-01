import { ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import AppText from '../ui/AppText';
import { OnboardingButton } from './OnboardingButton';

/** A failed status lookup must not send an existing account through setup. */
export function OnboardingStatusRecovery({ onRetry }: { onRetry: () => void }) {
    const { t } = useTranslation('onboarding');
    const { t: common } = useTranslation('common');
    return (
        <ScrollView contentContainerStyle={ styles.content }>
            <AppText variant="h2" accessibilityRole="header">{ t('statusRecovery.title') }</AppText>
            <AppText variant="body">{ t('statusRecovery.message') }</AppText>
            <OnboardingButton label={ common('action.tryAgain') } onPress={ onRetry } />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    content: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 32,
        gap: 20,
    },
});
