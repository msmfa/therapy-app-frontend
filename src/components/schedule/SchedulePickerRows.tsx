import { Platform, StyleSheet, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { DateTimePickerEvent } from '@react-native-community/datetimepicker';

import AppText from '../ui/AppText';
import { Button } from '../ui/Button';
import { DottedDivider } from '../ui/DottedDivider';
import { longDateLabel, timeLabel } from '../../features/onboarding/formatting';
import { formattingLocale } from '../../i18n';
import type { Theme } from 'designs/designs-themes';
import { useTheme, useThemedStyles } from '../../context/theme';

export type ScheduleSlot = 'date' | 'time' | 'morning' | 'evening';

export type SchedulePickerRow = {
    slot: ScheduleSlot;
    label: string;
    mode: 'date' | 'time';
    value: Date;
    minimumDate: Date;
    maximumDate: Date;
};

type Props = {
    rows: SchedulePickerRow[];
    onChange: (slot: ScheduleSlot) => (event: DateTimePickerEvent, picked?: Date) => void;
    /** Android has no inline picker; the row opens the page's own panel. */
    onOpenAndroid: (slot: ScheduleSlot) => void;
};

export const pickerValueLabel = (row: SchedulePickerRow) =>
    (row.mode === 'date' ? longDateLabel(row.value) : timeLabel(row.value));

/** The reminder settings page's time rows, for any date or time on the schedule page. */
export function SchedulePickerRows({ rows, onChange, onOpenAndroid }: Props) {
    const { theme } = useTheme();
    const styles = useThemedStyles(makeStyles);

    return (
        <View style={ styles.timeRows }>
            { rows.map((row, index) => (
                <View key={ row.slot }>
                    { index > 0 && <DottedDivider style={ styles.divider } /> }
                    <View style={ styles.timeRow }>
                        <View style={ styles.timeCopy }>
                            <AppText variant="h3" style={ styles.label }>
                                { row.label }
                            </AppText>
                        </View>
                        { /* Apple's compact control, left as it comes, as on
                             the reminder settings page. */ }
                        { Platform.OS === 'ios' ? (
                            <DateTimePicker
                                accentColor={ theme.accent.mark }
                                value={ row.value }
                                mode={ row.mode }
                                display="compact"
                                minimumDate={ row.minimumDate }
                                maximumDate={ row.maximumDate }
                                themeVariant={ theme.scheme }
                                locale={ formattingLocale() }
                                accessibilityLabel={ `${row.label}, ${pickerValueLabel(row)}` }
                                onChange={ onChange(row.slot) }
                                testID={ `session-schedule.${row.slot}` }
                            />
                        ) : (
                            <Button
                                label={ pickerValueLabel(row) }
                                transparent
                                onPress={ () => onOpenAndroid(row.slot) }
                            />
                        ) }
                    </View>
                </View>
            )) }
        </View>
    );
}

const TIME_ROWS_PADDING = 14;

const makeStyles = (theme: Theme) => StyleSheet.create({
    timeRows: {
        paddingHorizontal: TIME_ROWS_PADDING,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.surface.rowGroupBorder,
        backgroundColor: theme.surface.rowGroup,
    },
    divider: {
        marginHorizontal: -TIME_ROWS_PADDING,
    },
    timeRow: {
        minHeight: 70,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        paddingVertical: 12,
    },
    timeCopy: {
        flex: 1,
    },
    label: {
        fontSize: 17,
    },
});
