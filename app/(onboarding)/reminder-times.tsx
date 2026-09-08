import { useCallback, useMemo, useState } from 'react';
import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { OnboardingButton } from '../../src/components/onboarding/OnboardingButton';
import AppText from '../../src/components/ui/AppText';
import { OnboardingScreen } from '../../src/components/onboarding/OnboardingScreen';
import { onboardingStyles } from '../../src/components/onboarding/onboardingStyles';
import { QuoteCard } from '../../src/components/onboarding/QuoteCard';
import { GlassPickerPanel } from '../../src/components/ui/GlassPickerPanel';
import { REMINDER_TIMES_COPY } from '../../src/features/onboarding/onboardingCopy';
import { useOnboardingAnswers } from '../../src/features/onboarding/OnboardingAnswersContext';
import { dateToMinutes, minutesToDate, timeLabel } from '../../src/features/onboarding/formatting';
import { TIME_PICKER_BOUNDS } from '../../src/utils/timePickerBounds';
import { ACTION_ORANGE, COLOR_VARIANTS } from 'designs/designs-colors';

type Slot = 'morning' | 'evening';

export default function ReminderTimesScreen() {
    const router = useRouter();
    const { width, fontScale } = useWindowDimensions();
    const stackTimeFields = width < 380 || fontScale >= 1.5 || Platform.OS !== 'ios';
    const { answers, setAnswer } = useOnboardingAnswers();
    const [androidSlot, setAndroidSlot] = useState<Slot | null>(null);

    const change = useCallback(
        (slot: Slot) => (event: DateTimePickerEvent, picked?: Date) => {
            setAndroidSlot(null);
            // The compact popover's dismiss event echoes its previous value;
            // only a real selection may update the reminder time.
            if (event.type === 'dismissed') return;
            if (!picked || !Number.isFinite(picked.getTime())) return;
            setAnswer(slot === 'morning' ? 'morningMinutes' : 'eveningMinutes', dateToMinutes(picked));
        },
        [setAnswer],
    );

    // Keep each time's date anchor stable while the wheel is open.
    const morningValue = useMemo(
        () => minutesToDate(answers.morningMinutes),
        [answers.morningMinutes],
    );
    const eveningValue = useMemo(
        () => minutesToDate(answers.eveningMinutes),
        [answers.eveningMinutes],
    );
    const onMorningChange = useMemo(() => change('morning'), [change]);
    const onEveningChange = useMemo(() => change('evening'), [change]);

    const rows: {
        slot: Slot;
        label: string;
        value: Date;
        onChange: (event: DateTimePickerEvent, picked?: Date) => void;
    }[] = [
        {
            slot: 'morning',
            label: REMINDER_TIMES_COPY.morningLabel,
            value: morningValue,
            onChange: onMorningChange,
        },
        {
            slot: 'evening',
            label: REMINDER_TIMES_COPY.eveningLabel,
            value: eveningValue,
            onChange: onEveningChange,
        },
    ];

    return (
        <OnboardingScreen
            analyticsStep="reminder_times"
            step={ 4 }
            backHref="/(onboarding)/session-cadence"
            headline={ REMINDER_TIMES_COPY.headline }
            supporting={ REMINDER_TIMES_COPY.supporting }
            footer={
                <OnboardingButton
                    label={ REMINDER_TIMES_COPY.primaryCta }
                    onPress={ () => router.push('/(onboarding)/plan-preview') }
                />
            }
        >
            <View style={ [onboardingStyles.card, styles.rows] }>
                { rows.map((row, index) => {
                    const { value } = row;

                    return (
                        <View key={ row.slot }>
                            { index > 0 && <View style={ styles.divider } /> }

                            <View style={ [styles.row, stackTimeFields && styles.stackedRow] }>
                                <View style={ styles.rowText }>
                                    <AppText variant="h3" style={ [onboardingStyles.title, styles.rowLabel] }>
                                        { row.label }
                                    </AppText>
                                </View>

                                { /* The compact control draws its own grey pill
                                     and gives no way to restyle it, so it is
                                     left alone: framed in glass it read as two
                                     stacked rounded shapes. */ }
                                { Platform.OS === 'ios' ? (
                                    <DateTimePicker
                                        { ...TIME_PICKER_BOUNDS }
                                        accentColor={ ACTION_ORANGE }
                                        value={ value }
                                        mode="time"
                                        display="compact"
                                        themeVariant="light"
                                        accessibilityLabel={ `${row.label}, ${timeLabel(value)}` }
                                        onChange={ row.onChange }
                                    />
                                ) : (
                                    <OnboardingButton
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

            <View style={ styles.quote }>
                <QuoteCard
                    quote={ REMINDER_TIMES_COPY.testimonial.quote }
                    name={ REMINDER_TIMES_COPY.testimonial.name }
                    role={ REMINDER_TIMES_COPY.testimonial.role }
                />
            </View>

            { androidSlot !== null && (
                <GlassPickerPanel style={ styles.androidPicker }>
                    <DateTimePicker
                        { ...TIME_PICKER_BOUNDS }
                        accentColor={ ACTION_ORANGE }
                        value={ androidSlot === 'morning' ? morningValue : eveningValue }
                        mode="time"
                        display="default"
                        onChange={ androidSlot === 'morning' ? onMorningChange : onEveningChange }
                    />
                </GlassPickerPanel>
            ) }
        </OnboardingScreen>
    );
}

const styles = StyleSheet.create({
    rows: {
        marginTop: 24,
        paddingHorizontal: 20,
    },
    row: {
        minHeight: 70,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        paddingVertical: 12,
    },
    stackedRow: {
        flexDirection: 'column',
        alignItems: 'flex-start',
    },
    rowText: {
        flex: 1,
    },
    rowLabel: {
        fontSize: 17,
    },
    androidPicker: {
        marginTop: 16,
    },
    divider: {
        height: 1,
        backgroundColor: COLOR_VARIANTS.white.tertiary,
    },
    quote: {
        marginTop: 20,
    },
});
