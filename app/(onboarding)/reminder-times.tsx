import { useCallback, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Button } from '../../src/components/ui/Button';
import AppText from '../../src/components/ui/AppText';
import { OnboardingScreen } from '../../src/components/onboarding/OnboardingScreen';
import { REMINDER_TIMES_COPY } from '../../src/features/onboarding/onboardingCopy';
import { useOnboardingAnswers } from '../../src/features/onboarding/OnboardingAnswersContext';
import { dateToMinutes, minutesToDate, timeLabel } from '../../src/features/onboarding/formatting';
import { COLOR_VARIANTS, PALETTE, TEXT_COLORS } from 'designs/designs-colors';

type Slot = 'morning' | 'evening';

export default function ReminderTimesScreen() {
    const router = useRouter();
    const { answers, setAnswer } = useOnboardingAnswers();
    const [androidSlot, setAndroidSlot] = useState<Slot | null>(null);

    const change = useCallback(
        (slot: Slot) => (_event: DateTimePickerEvent, picked?: Date) => {
            setAndroidSlot(null);
            if (!picked) return;
            setAnswer(slot === 'morning' ? 'morningMinutes' : 'eveningMinutes', dateToMinutes(picked));
        },
        [setAnswer],
    );

    const rows: { slot: Slot; label: string; hint: string; minutes: number }[] = [
        {
            slot: 'morning',
            label: REMINDER_TIMES_COPY.morningLabel,
            hint: REMINDER_TIMES_COPY.morningHint,
            minutes: answers.morningMinutes,
        },
        {
            slot: 'evening',
            label: REMINDER_TIMES_COPY.eveningLabel,
            hint: REMINDER_TIMES_COPY.eveningHint,
            minutes: answers.eveningMinutes,
        },
    ];

    return (
        <OnboardingScreen
            step={ 4 }
            backHref="/(onboarding)/session-cadence"
            headline={ REMINDER_TIMES_COPY.headline }
            supporting={ REMINDER_TIMES_COPY.supporting }
            footer={
                <Button
                    label={ REMINDER_TIMES_COPY.primaryCta }
                    onPress={ () => router.push('/(onboarding)/plan-preview') }
                />
            }
        >
            <View style={ styles.rows }>
                { rows.map((row, index) => {
                    const value = minutesToDate(row.minutes);

                    return (
                        <View key={ row.slot }>
                            { index > 0 && <View style={ styles.divider } /> }

                            <View style={ styles.row }>
                                <View style={ styles.rowText }>
                                    <AppText variant="h3" style={ styles.rowLabel }>
                                        { row.label }
                                    </AppText>
                                    <AppText variant="caption" style={ styles.rowHint }>
                                        { row.hint }
                                    </AppText>
                                </View>

                                { Platform.OS === 'ios' ? (
                                    <DateTimePicker
                                        value={ value }
                                        mode="time"
                                        display="compact"
                                        themeVariant="light"
                                        accessibilityLabel={ `${row.label}, ${timeLabel(value)}` }
                                        onChange={ change(row.slot) }
                                    />
                                ) : (
                                    <Button
                                        label={ timeLabel(value) }
                                        transparent
                                        onPress={ () => setAndroidSlot(row.slot) }
                                    />
                                ) }
                            </View>
                        </View>
                    );
                }) }
            </View>

            <AppText variant="body" style={ styles.reassurance }>
                { REMINDER_TIMES_COPY.reassurance }
            </AppText>

            { androidSlot !== null && (
                <DateTimePicker
                    value={ minutesToDate(
                        androidSlot === 'morning' ? answers.morningMinutes : answers.eveningMinutes,
                    ) }
                    mode="time"
                    display="default"
                    onChange={ change(androidSlot) }
                />
            ) }
        </OnboardingScreen>
    );
}

const styles = StyleSheet.create({
    rows: {
        marginTop: 24,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: PALETTE.overlay.whiteBorderTransparent,
        backgroundColor: 'hsla(0, 0%, 100%, 0.55)',
        paddingHorizontal: 16,
    },
    row: {
        minHeight: 64,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        paddingVertical: 12,
    },
    rowText: {
        flex: 1,
    },
    rowLabel: {
        fontSize: 17,
    },
    rowHint: {
        marginTop: 2,
        color: TEXT_COLORS.tertiary,
    },
    divider: {
        height: 1,
        backgroundColor: COLOR_VARIANTS.white.tertiary,
    },
    reassurance: {
        marginTop: 20,
        color: TEXT_COLORS.secondary,
    },
});
