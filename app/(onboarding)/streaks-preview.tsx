import { useMemo } from 'react';
import dayjs from 'dayjs';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { OnboardingScreen, ONBOARDING_SCREEN_PADDING } from '../../src/components/onboarding/OnboardingScreen';
import { OnboardingButton } from '../../src/components/onboarding/OnboardingButton';
import { useOnboardingStyles } from '../../src/components/onboarding/onboardingStyles';
import { WidgetExample } from '../../src/components/widgets/WidgetExample';
import AppText from '../../src/components/ui/AppText';
import { useOnboardingAnswers } from '../../src/features/onboarding/OnboardingAnswersContext';
import { firstStreakReviewWindow } from '../../src/features/onboarding/streakWindow';
import { formattingLocale } from '../../src/i18n';

export default function StreaksPreviewScreen() {
    const router = useRouter();
    const { t } = useTranslation('onboarding');
    const { onboardingStyles } = useOnboardingStyles();
    const { answers } = useOnboardingAnswers();
    const reviewWindow = useMemo(() => firstStreakReviewWindow(answers), [
        answers.sessionAt, answers.cadence, answers.morningMinutes, answers.eveningMinutes,
    ]);
    const dateTime = new Intl.DateTimeFormat(formattingLocale(), {
        weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    });
    const time = new Intl.DateTimeFormat(formattingLocale(), { hour: 'numeric', minute: '2-digit' });
    const relativeTime = (at: number, from: Date) => {
        if (dayjs(at).isSame(from, 'day')) return time.format(new Date(at));
        if (dayjs(at).isSame(dayjs(from).add(1, 'day'), 'day')) {
            return t('streaksPreview.nextDayAt', { time: time.format(new Date(at)) });
        }
        return dateTime.format(new Date(at));
    };
    const windowExample = reviewWindow && answers.sessionAt
        ? t('streaksPreview.windowExample', {
            session: dateTime.format(answers.sessionAt),
            opens: relativeTime(reviewWindow.atMs, answers.sessionAt),
            closes: relativeTime(reviewWindow.closesAtMs, new Date(reviewWindow.atMs)),
        })
        : t(answers.sessionAt ? 'streaksPreview.windowNeedsNextSession' : 'streaksPreview.windowNeedsSession');

    return (
        <OnboardingScreen
            analyticsStep='streaks_preview'
            backHref='/(onboarding)/note-preview'
            headline={ t('streaksPreview.headline') }
            supporting={ t('streaksPreview.body') }
            supportingAppearance='banner'
            footer={
                <OnboardingButton
                    label={ t('streaksPreview.primaryCta') }
                    onPress={ () => router.push('/(onboarding)/subscription-preview') }
                />
            }
        >
            <View style={ styles.widget }>
                <WidgetExample style={ styles.widgetShadow } />
            </View>
            <View style={ [onboardingStyles.card, styles.explainer] }>
                <AppText variant='body' style={ onboardingStyles.body }>
                    { t('streaksPreview.widgetBody') }
                </AppText>
                <AppText variant='h3' accessibilityRole='header' style={ [onboardingStyles.title, styles.windowTitle] }>
                    { t('streaksPreview.windowTitle') }
                </AppText>
                <AppText variant='body' style={ [onboardingStyles.body, styles.widgetBody] }>
                    { windowExample }
                </AppText>
            </View>
        </OnboardingScreen>
    );
}

const styles = StyleSheet.create({
    widget: {
        alignItems: 'center',
        paddingTop: 28,
        zIndex: 1,
    },
    widgetShadow: {
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 12,
    },
    explainer: {
        marginTop: -12,
        marginHorizontal: -ONBOARDING_SCREEN_PADDING,
        borderRadius: 0,
        borderLeftWidth: 0,
        borderRightWidth: 0,
        paddingHorizontal: ONBOARDING_SCREEN_PADDING,
        paddingTop: 34,
        paddingBottom: 22,
    },
    windowTitle: {
        marginTop: 20,
    },
    widgetBody: {
        marginTop: 10,
    },
});
