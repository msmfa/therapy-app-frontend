import { useCallback, useMemo, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Button } from '../../src/components/ui/Button';
import AppText from '../../src/components/ui/AppText';
import { OnboardingScreen } from '../../src/components/onboarding/OnboardingScreen';
import { QuoteCard } from '../../src/components/onboarding/QuoteCard';
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
        (slot: Slot) => (event: DateTimePickerEvent, picked?: Date) => {
            setAndroidSlot(null);
            // Closing the picker reports a "dismissed" change carrying the value
            // this render was already showing, not anything the user chose. The
            // iOS compact popover fires it every time it closes (the library's
            // own source marks the date it attaches as a TODO to remove), so
            // treating it as a pick overwrote the real choice made a moment
            // earlier and snapped the field back to what it showed before.
            if (event.type === 'dismissed') return;
            if (!picked) return;
            setAnswer(slot === 'morning' ? 'morningMinutes' : 'eveningMinutes', dateToMinutes(picked));
        },
        [setAnswer],
    );

    /**
     * Stable values and handlers, recomputed only when the answer changes.
     *
     * Note this is hygiene, not the snap-back fix: the picker wrapper converts
     * `value` to milliseconds before it reaches native, so object identity
     * never crossed the bridge. The snap-back was the "dismissed" event above.
     */
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
        hint: string;
        value: Date;
        onChange: (event: DateTimePickerEvent, picked?: Date) => void;
    }[] = [
        {
            slot: 'morning',
            label: REMINDER_TIMES_COPY.morningLabel,
            hint: REMINDER_TIMES_COPY.morningHint,
            value: morningValue,
            onChange: onMorningChange,
        },
        {
            slot: 'evening',
            label: REMINDER_TIMES_COPY.eveningLabel,
            hint: REMINDER_TIMES_COPY.eveningHint,
            value: eveningValue,
            onChange: onEveningChange,
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
                    const { value } = row;

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
                                        onChange={ row.onChange }
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

            <View style={ styles.quote }>
                <QuoteCard
                    quote={ REMINDER_TIMES_COPY.testimonial.quote }
                    name={ REMINDER_TIMES_COPY.testimonial.name }
                    role={ REMINDER_TIMES_COPY.testimonial.role }
                />
            </View>

            { androidSlot !== null && (
                <DateTimePicker
                    value={ androidSlot === 'morning' ? morningValue : eveningValue }
                    mode="time"
                    display="default"
                    onChange={ androidSlot === 'morning' ? onMorningChange : onEveningChange }
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
    quote: {
        marginTop: 20,
    },
});
