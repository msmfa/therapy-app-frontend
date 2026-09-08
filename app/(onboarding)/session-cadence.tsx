import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingButton } from '../../src/components/onboarding/OnboardingButton';
import { OnboardingScreen } from '../../src/components/onboarding/OnboardingScreen';
import {
    SelectableCard,
    useEqualSelectableCardHeights,
} from '../../src/components/onboarding/SelectableCard';
import {
    CADENCE_COPY,
    CADENCE_OPTIONS,
} from '../../src/features/onboarding/onboardingCopy';
import { useOnboardingAnswers } from '../../src/features/onboarding/OnboardingAnswersContext';

export default function SessionCadenceScreen() {
    const router = useRouter();
    const { answers, setAnswer } = useOnboardingAnswers();
    const { height: cardHeight, onCardLayout } = useEqualSelectableCardHeights();

    return (
        <OnboardingScreen
            analyticsStep="session_cadence"
            step={ 3 }
            backHref="/(onboarding)/session-date"
            headline={ CADENCE_COPY.headline }
            supporting={ CADENCE_COPY.supporting }
            footer={
                <OnboardingButton
                    label={ CADENCE_COPY.primaryCta }
                    disabled={ answers.cadence === null }
                    onPress={ () => router.push('/(onboarding)/reminder-times') }
                />
            }
        >
            <View style={ styles.options } accessibilityRole="radiogroup">
                { CADENCE_OPTIONS.map((option) => (
                    <SelectableCard
                        key={ option.id }
                        label={ option.label }
                        selected={ answers.cadence === option.id }
                        height={ cardHeight }
                        onLayout={ onCardLayout }
                        onPress={ () => setAnswer('cadence', option.id) }
                    />
                )) }
            </View>
        </OnboardingScreen>
    );
}

const styles = StyleSheet.create({
    options: {
        marginTop: 24,
        gap: 12,
    },
});
