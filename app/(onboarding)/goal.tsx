import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingButton } from '../../src/components/onboarding/OnboardingButton';
import { OnboardingScreen } from '../../src/components/onboarding/OnboardingScreen';
import { SelectableCard } from '../../src/components/onboarding/SelectableCard';
import { GOAL_COPY, GOAL_OPTIONS } from '../../src/features/onboarding/onboardingCopy';
import { useOnboardingAnswers } from '../../src/features/onboarding/OnboardingAnswersContext';

export default function GoalScreen() {
    const router = useRouter();
    const { answers, setAnswer } = useOnboardingAnswers();

    return (
        <OnboardingScreen
            step={ 1 }
            backHref="/(onboarding)"
            headline={ GOAL_COPY.headline }
            supporting={ GOAL_COPY.supporting }
            footer={
                <OnboardingButton
                    label={ GOAL_COPY.primaryCta }
                    disabled={ answers.goal === null }
                    onPress={ () => router.push('/(onboarding)/session-date') }
                />
            }
        >
            <View style={ styles.options } accessibilityRole="radiogroup">
                { GOAL_OPTIONS.map((option) => (
                    <SelectableCard
                        key={ option.id }
                        label={ option.label }
                        selected={ answers.goal === option.id }
                        // Selection never advances on its own: the user should be
                        // able to change their mind before committing.
                        onPress={ () => setAnswer('goal', option.id) }
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
