import { useCallback, useMemo, useState } from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Button } from '../../src/components/ui/Button';
import AppText from '../../src/components/ui/AppText';
import { OnboardingScreen } from '../../src/components/onboarding/OnboardingScreen';
import { SESSION_DATE_COPY } from '../../src/features/onboarding/onboardingCopy';
import { useOnboardingAnswers } from '../../src/features/onboarding/OnboardingAnswersContext';
import { longDateLabel, timeLabel } from '../../src/features/onboarding/formatting';
import {
    isWithinFirstSessionWindow,
    latestFirstSessionAt,
} from '../../src/utils/sessionWindow';
import { COLOR_VARIANTS, PALETTE, TEXT_COLORS, THEME_COLORS } from 'designs/designs-colors';

type Field = 'date' | 'time';

/**
 * Where the pickers start from when nothing has been chosen yet.
 *
 * This is only the wheel's starting position. It is never shown as if it were
 * the user's answer: the rows read "Choose a date" until they pick.
 */
const pickerSeed = (): Date => {
    const next = new Date();
    next.setDate(next.getDate() + 1);
    next.setHours(17, 0, 0, 0);
    return next;
};

export default function SessionDateScreen() {
    const router = useRouter();
    const { answers, setAnswer } = useOnboardingAnswers();

    const saved = answers.sessionAt;
    const [draft, setDraft] = useState<Date>(() => saved ?? pickerSeed());
    // Tracked separately so a value the user never touched is never presented
    // as their answer. Coming back to a saved date counts as chosen.
    const [dateChosen, setDateChosen] = useState(() => saved !== null);
    const [timeChosen, setTimeChosen] = useState(() => saved !== null);
    const [open, setOpen] = useState<Field | null>(null);

    const complete = dateChosen && timeChosen;
    const isFuture = useMemo(() => draft.getTime() > Date.now(), [draft]);
    // A session beyond the series horizon would be projected into records the
    // calendar never fetches, so the user could not see, edit or delete them.
    const inRange = useMemo(() => isWithinFirstSessionWindow(draft), [draft]);
    // The whole of the final day counts, so an evening appointment on the last
    // permitted date is still a valid choice.
    const latestAllowed = useMemo(() => latestFirstSessionAt(), []);
    const canContinue = complete && isFuture && inRange;

    const applyDate = useCallback((_event: DateTimePickerEvent, picked?: Date) => {
        if (Platform.OS !== 'ios') setOpen(null);
        if (!picked) return;
        setDateChosen(true);
        setDraft((current) => {
            const next = new Date(current);
            next.setFullYear(picked.getFullYear(), picked.getMonth(), picked.getDate());
            return next;
        });
    }, []);

    const applyTime = useCallback((_event: DateTimePickerEvent, picked?: Date) => {
        if (Platform.OS !== 'ios') setOpen(null);
        if (!picked) return;
        setTimeChosen(true);
        setDraft((current) => {
            const next = new Date(current);
            next.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
            return next;
        });
    }, []);

    const togglePicker = useCallback((field: Field) => {
        const isOpening = open !== field;

        // The iOS spinner has no confirm button. Treat opening it as accepting
        // the visible value so a user can keep the sensible default without
        // having to move a wheel away and back again.
        if (isOpening) {
            if (field === 'date') setDateChosen(true);
            if (field === 'time') setTimeChosen(true);
        }

        setOpen(isOpening ? field : null);
    }, [open]);

    const handleContinue = useCallback(() => {
        // Re-checked against the clock at the moment of saving rather than
        // trusting the picker: a restored draft arrives without passing
        // through it at all, and on Android the dialog is a separate surface
        // whose bounds we cannot assume were honoured.
        if (!canContinue || !isWithinFirstSessionWindow(draft)) return;
        setAnswer('sessionAt', draft);
        setAnswer('sessionDateSkipped', false);
        setAnswer('reminderScheduled', false);
        router.push('/(onboarding)/session-cadence');
    }, [canContinue, draft, router, setAnswer]);

    const handleSamplePlan = useCallback(() => {
        // Keep the absence of a booking explicit. The preview creates its own
        // display-only example and this null is what prevents a fake session or
        // notification from being saved later.
        setAnswer('sessionAt', null);
        setAnswer('sessionDateSkipped', true);
        setAnswer('reminderScheduled', false);
        router.push('/(onboarding)/session-cadence');
    }, [router, setAnswer]);

    const rows: { field: Field; label: string; value: string | null }[] = [
        {
            field: 'date',
            label: SESSION_DATE_COPY.dateLabel,
            value: dateChosen ? longDateLabel(draft) : null,
        },
        {
            field: 'time',
            label: SESSION_DATE_COPY.timeLabel,
            value: timeChosen ? timeLabel(draft) : null,
        },
    ];

    return (
        <OnboardingScreen
            step={ 2 }
            backHref="/(onboarding)/goal"
            headline={ SESSION_DATE_COPY.headline }
            supporting={ SESSION_DATE_COPY.supporting }
            footer={
                <>
                    <Button
                        label={ SESSION_DATE_COPY.primaryCta }
                        disabled={ !canContinue }
                        onPress={ handleContinue }
                    />
                    <Button
                        label={ SESSION_DATE_COPY.sampleCta }
                        transparent
                        onPress={ handleSamplePlan }
                    />
                </>
            }
        >
            <View style={ styles.fields }>
                { rows.map((row, index) => {
                    const placeholder = `Choose a ${row.label.toLowerCase()}`;
                    const isOpen = open === row.field;

                    return (
                        <View key={ row.field }>
                            { index > 0 && <View style={ styles.divider } /> }

                            <TouchableOpacity
                                onPress={ () => togglePicker(row.field) }
                                accessibilityRole="button"
                                accessibilityLabel={ `${row.label}. ${row.value ?? 'Not chosen'}` }
                                accessibilityHint={ `Choose your therapy session ${row.label.toLowerCase()}` }
                                accessibilityState={ { expanded: isOpen } }
                                style={ styles.row }
                            >
                                <AppText variant="h3" style={ styles.rowLabel }>
                                    { row.label }
                                </AppText>
                                <AppText
                                    variant="body"
                                    style={ row.value === null ? styles.placeholder : styles.value }
                                >
                                    { row.value ?? placeholder }
                                </AppText>
                            </TouchableOpacity>

                            { isOpen && (
                                <DateTimePicker
                                    value={ draft }
                                    mode={ row.field }
                                    display={ Platform.OS === 'ios' ? 'spinner' : 'default' }
                                    minimumDate={ row.field === 'date' ? new Date() : undefined }
                                    maximumDate={ row.field === 'date' ? latestAllowed : undefined }
                                    themeVariant="light"
                                    textColor={ COLOR_VARIANTS.black.primary }
                                    onChange={ row.field === 'date' ? applyDate : applyTime }
                                />
                            ) }
                        </View>
                    );
                }) }
            </View>

            { complete && !isFuture && (
                <AppText variant="body" style={ styles.validation } accessibilityLiveRegion="polite">
                    { SESSION_DATE_COPY.validation }
                </AppText>
            ) }

            { /* A restored draft can be out of range without the picker ever
                 having been opened. Say why Continue is disabled rather than
                 quietly rewriting the date the user chose. */ }
            { complete && isFuture && !inRange && (
                <AppText variant="body" style={ styles.validation } accessibilityLiveRegion="polite">
                    { SESSION_DATE_COPY.rangeValidation }
                </AppText>
            ) }
        </OnboardingScreen>
    );
}

const styles = StyleSheet.create({
    fields: {
        marginTop: 24,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: PALETTE.overlay.whiteBorderTransparent,
        backgroundColor: 'hsla(0, 0%, 100%, 0.55)',
        paddingHorizontal: 16,
    },
    row: {
        minHeight: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        paddingVertical: 12,
    },
    rowLabel: {
        fontSize: 17,
    },
    value: {
        flexShrink: 1,
        textAlign: 'right',
        color: TEXT_COLORS.primary,
    },
    placeholder: {
        flexShrink: 1,
        textAlign: 'right',
        color: TEXT_COLORS.quaternary,
    },
    divider: {
        height: 1,
        backgroundColor: COLOR_VARIANTS.white.tertiary,
    },
    validation: {
        marginTop: 12,
        color: THEME_COLORS.error,
    },
});
