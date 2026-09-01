import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import dayjs from 'dayjs';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';

import TherapyCalendar from '../../src/components/therapy-calendar/TherapyCalendar';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTherapySessions } from '../../src/context/therapy-sessions/TherapySessionsContext';
import { convertSessionsToCalendarFormat } from '../../src/utils/calendar';
import { useFocusEffect } from 'expo-router';
import LoadingSuccess from 'src/components/ui/LoadingWithSuccess';
import ErrorModal from '../../src/components/ui/ErrorModal';
import { DarkBackdrop } from '../../src/components/ui/DarkBackdrop';
import { useAppAlert } from '../../src/context/alert';
import Loading from 'src/components/ui/Loading';
import { GlassButtonOutline } from '../../src/components/ui/GlassButtonOutline';
import { GlassPillButton } from '../../src/components/ui/GlassPillButton';
import AppText from 'src/components/ui/AppText';
import { GradientCard } from '../../src/components/ui/GradientCard';
import { ACTION_ORANGE, CALENDAR_DARK_COLORS, COLOR_VARIANTS, TEXT_COLORS } from 'designs/designs-colors';
import { GRADIENTS, SURFACE_TINTS } from 'designs/designs-gradients';

type SelectedSessions = Record<string, Date>;
type SessionsMapInput = Record<string, Date | undefined>;

// The home screen lifts its button row off the bottom with a 40pt container
// pad plus a 28pt footer margin, both outside the safe-area inset. Matching the
// sum here keeps the two rows on the same line as you switch tabs.
const HOME_FOOTER_OFFSET = 68;

type NextEventCardProps = {
    label: string;
    date: Date | null;
    /** Matches the dots the month uses for this kind of day. */
    accent: string;
};

// Reads like a weather tile: a quiet label with a coloured dot on the shoulder,
// and the day number carrying the card the way a temperature does, with the
// month sitting up against it as the unit.
const NextEventCard = React.memo(function NextEventCard({ label, date, accent }: NextEventCardProps) {
    const when = date ? dayjs(date) : null;

    return (
        <GradientCard
            addedStyles={ styles.eventCard }
            borderRadius={ 20 }
            surfaceBackgroundColor={ SURFACE_TINTS.sheetCardBackground }
            surfaceBorderColor={ SURFACE_TINTS.sheetCardBorder }
        >
            <View style={ styles.eventCardBody }>
                <View style={ styles.eventValueRow }>
                    { when ? (
                        <View style={ styles.eventReading }>
                            <AppText variant="h1" style={ styles.eventDay }>
                                { when.format('D') }
                            </AppText>
                            <AppText variant="h1" style={ styles.eventMonth }>
                                { when.format('MMM').toUpperCase() }
                            </AppText>
                        </View>
                    ) : (
                        <AppText variant="body" style={ styles.eventEmpty }>
                            Nothing scheduled
                        </AppText>
                    ) }

                    { /* Label and weekday stack together on the right, opposite
                         the date. */ }
                    <View style={ styles.eventAside }>
                        <View style={ styles.eventLabelRow }>
                            <AppText variant="caption" style={ styles.eventLabel }>
                                { label }
                            </AppText>
                            <View style={ [styles.eventDot, { backgroundColor: accent }] } />
                        </View>
                        { when ? (
                            <AppText variant="caption" style={ styles.eventMeta }>
                                { when.format('ddd, h:mm A') }
                            </AppText>
                        ) : null }
                    </View>
                </View>
            </View>
        </GradientCard>
    );
});

const cloneSessionsMap = (sessionsMap: SessionsMapInput): SelectedSessions => (
    Object.keys(sessionsMap).reduce<SelectedSessions>((acc, key) => {
        const value = sessionsMap[key];
        if (value instanceof Date) {
            acc[key] = new Date(value);
        }
        return acc;
    }, {} as SelectedSessions)
);

const getSessionsSignature = (sessionsMap: SelectedSessions): string => (
    Object.keys(sessionsMap)
        .sort()
        .map((key) => {
            const value = sessionsMap[key];
            if (value instanceof Date) {
                const timestamp = value.getTime();
                return `${key}-${Number.isNaN(timestamp) ? 'invalid' : timestamp}`;
            }

            return `${key}-missing`;
        })
        .join('|')
);


export default function CalendarScreen() {
    const {
        sessions,
        syncSessions,
        neuroReminders,
        loading: sessionsLoading,
        error: sessionsError,
        refreshSessions,
    } = useTherapySessions();
    const insets = useSafeAreaInsets();
    const [saveStatus, setSaveStatus] = useState<'loading' | 'success' | null>(null);
    const [errorModalVisible, setErrorModalVisible] = useState(false);
    const [errorDismissed, setErrorDismissed] = useState(false);
    const initialSessions = useMemo(
        () => convertSessionsToCalendarFormat(sessions),
        [sessions],
    );

    const [selectedSessionsDraft, setSelectedSessionsDraft] = useState<SelectedSessions | null>(null);
    const selectedSessions = selectedSessionsDraft ?? initialSessions;
    const { showAlert } = useAppAlert();
    const normalizeReminderDates = useCallback((values: typeof neuroReminders) =>
        values
            .map((item) => {
                // Use the reminder's own local date. Deriving it from atUtc put
                // the dot on the wrong day for any reminder that crosses UTC
                // midnight — 20:00 in the Americas, 07:00 in Tokyo.
                if (item.localDate) {
                    return item.localDate;
                }

                const date = new Date(item.atUtc);
                if (Number.isNaN(date.getTime())) {
                    return null;
                }
                return date.toISOString().split('T')[0];
            })
            .filter((value): value is string => Boolean(value)),
    [],);

    const reminderDates = useMemo(
        () => normalizeReminderDates(neuroReminders),
        [neuroReminders, normalizeReminderDates],
    );
    const [reminderDatesDraft, setReminderDatesDraft] = useState<string[] | null>(null);
    const dotDates = reminderDatesDraft ?? reminderDates;

    useFocusEffect(
        useCallback(() => {
            setErrorDismissed(false);
            if (sessionsError) {
                setErrorModalVisible(true);
            }
            return () => {};
        }, [sessionsError]),
    );

    // Unsaved edits belong to the visit, not to the app. The draft is what the
    // screen shows in place of the loaded schedule, and nothing else clears it,
    // so leaving without saving used to strand the screen on that draft: clear
    // the calendar, switch tabs, and it stayed empty until the app restarted.
    // Dropping it on blur rather than on focus means a refresh landing while
    // you are still editing cannot wipe what you are part-way through.
    useFocusEffect(
        useCallback(() => () => {
            setSelectedSessionsDraft(null);
            setReminderDatesDraft(null);
        }, []),
    );

    const sessionCount = Object.keys(selectedSessions).length;

    const initialSignature = useMemo(
        () => getSessionsSignature(initialSessions),
        [initialSessions],
    );

    const selectedSignature = useMemo(
        () => getSessionsSignature(selectedSessions),
        [selectedSessions],
    );

    const hasChanges = selectedSignature !== initialSignature;

    const canSave = hasChanges && sessionCount !== 0;

    const nextSessionDate = useMemo(() => {
        const now = Date.now();
        return Object.values(selectedSessions)
            .filter((date) => !Number.isNaN(date.getTime()) && date.getTime() >= now)
            .sort((first, second) => first.getTime() - second.getTime())[0] ?? null;
    }, [selectedSessions]);

    const nextReminderDate = useMemo(() => {
        if (reminderDatesDraft?.length === 0) {
            return null;
        }

        const now = Date.now();
        return neuroReminders
            .map(({ atUtc }) => new Date(atUtc))
            .filter((date) => !Number.isNaN(date.getTime()) && date.getTime() >= now)
            .sort((first, second) => first.getTime() - second.getTime())[0] ?? null;
    }, [neuroReminders, reminderDatesDraft]);

    const handleSessionsChange = useCallback((next: SessionsMapInput) => {
        setSelectedSessionsDraft(cloneSessionsMap(next));
    }, []);

    const handleClearPress = useCallback(() => {
        setSelectedSessionsDraft({});
        setReminderDatesDraft([]);
    }, []);

    const handleSavePress = useCallback(async () => {
        setSaveStatus('loading');
        try {
            if (sessionCount < 5) {
                showAlert('Oops', 'Please select at least five therapy sessions to continue.');
                setSaveStatus(null); // ← Reset here since we're returning early
                return;
            }
            await syncSessions(selectedSessions, 50);
            setSelectedSessionsDraft(null);
            setReminderDatesDraft(null);
            setSaveStatus('success');

            // Auto-dismiss after showing success - no setTimeout here!

        } catch (error) {
            console.error('syncSessions failed', error);
            showAlert('Error', 'Unable to save sessions right now.');
            setSaveStatus(null);
        }
    // ← Remove the finally block that was setting loading to null
    }, [selectedSessions, sessionCount, showAlert, syncSessions]);

    // Delay resetting loading state after success
    useEffect(() => {
        if (saveStatus === 'success') {
            const timer = setTimeout(() => {
                setSaveStatus(null);
            }, 2500); // Show success for 2.5 seconds

            return () => clearTimeout(timer);
        }
    }, [saveStatus]);

    useEffect(() => {
        if (sessionsError && !errorDismissed) {
            setErrorModalVisible(true);
        }

        if (!sessionsError) {
            setErrorModalVisible(false);
            setErrorDismissed(false);
        }
    }, [sessionsError, errorDismissed]);

    const handleErrorModalClose = useCallback(() => {
        setErrorModalVisible(false);
        setErrorDismissed(true);
    }, []);

    const handleErrorPrimaryAction = useCallback(() => {
        if (!sessionsError) return;

        if (sessionsError.retryable) {
            setErrorDismissed(false);
            setErrorModalVisible(false);
            refreshSessions().catch(() => {});
        } else {
            handleErrorModalClose();
        }
    }, [sessionsError, refreshSessions, handleErrorModalClose]);

    // TODO: fix this tp still show tabs and be conststant with update loader
    if (sessionsLoading && !sessions.length) {
        return <Loading transparent={ false } />;
    }

    return (
        <View style={ styles.container }>
            <DarkBackdrop />
            <SafeAreaView style={ styles.root } edges={ ['left', 'right', 'top'] }>
                <TherapyCalendar
                    dotDates={ dotDates }
                    fillAvailableSpace={ false }
                    hideExtraDays={ false }
                    onSelectedSessionsChange={ handleSessionsChange }
                    selectedSessions={ selectedSessions }
                    variant="dark"
                />

                <View style={ styles.sheet }>
                    { /* A lit edge along the sheet's lip, brightest in the
                         middle, which is what separates it from the month
                         above without drawing a hard rule. */ }
                    <LinearGradient
                        colors={ ['rgba(255,255,255,0)', 'rgba(255,255,255,0.95)', 'rgba(255,255,255,0)'] }
                        start={ { x: 0, y: 0 } }
                        end={ { x: 1, y: 0 } }
                        pointerEvents="none"
                        style={ styles.sheetHighlight }
                    />
                    { /* The month grows to six rows in some months, which
                         shortens the sheet. The cards give way by scrolling;
                         the button row underneath stays put. */ }
                    <MaskedView
                        style={ styles.eventScroll }
                        maskElement={
                            <LinearGradient
                                colors={ ['#000000', '#000000', 'transparent'] }
                                locations={ [0, 0.9, 1] }
                                style={ StyleSheet.absoluteFillObject }
                            />
                        }
                    >
                        <ScrollView
                            contentContainerStyle={ styles.eventCards }
                            showsVerticalScrollIndicator={ false }
                            style={ styles.eventScroll }
                        >
                            <NextEventCard
                                label="Next session"
                                date={ nextSessionDate }
                                accent={ CALENDAR_DARK_COLORS.sessionDot }
                            />
                            <NextEventCard
                                label="Next reminder"
                                date={ nextReminderDate }
                                accent={ CALENDAR_DARK_COLORS.reminderDot }
                            />
                        </ScrollView>
                    </MaskedView>

                    <View style={ { paddingBottom: insets.bottom + HOME_FOOTER_OFFSET } }>
                        <View style={ styles.calendarFooter }>
                            <GlassButtonOutline buttonSize={ 72 } opacity={ 0.9 } />
                            <GlassPillButton
                                accessibilityLabel="Clear therapy sessions"
                                disabled={ sessionCount === 0 }
                                disabledLabelColor={ COLOR_VARIANTS.white.quaternary }
                                height={ 72 }
                                label="Clear"
                                labelColor={ ACTION_ORANGE }
                                labelSize={ 16 }
                                onPress={ handleClearPress }
                                style={ styles.footerButton }
                            />
                            <GlassPillButton
                                accessibilityLabel="Save therapy sessions"
                                height={ 72 }
                                label="Save"
                                labelColor={ ACTION_ORANGE }
                                disabledLabelColor={ COLOR_VARIANTS.white.quaternary }
                                labelSize={ 16 }
                                onPress={ handleSavePress }
                                disabled={ !canSave }
                                style={ styles.footerButton }
                            />
                        </View>
                    </View>
                </View>
            </SafeAreaView>
            { saveStatus &&
            <LoadingSuccess
                visible={ !!saveStatus }
                status={ saveStatus }
                successText="Updated your therapy sessions"
            /> }
            { sessionsError && (
                <ErrorModal
                    visible={ errorModalVisible }
                    title={ sessionsError.title }
                    message={ sessionsError.message }
                    buttonLabel={ sessionsError.retryable ? sessionsError.actionLabel : undefined }
                    onPress={ sessionsError.retryable ? handleErrorPrimaryAction : undefined }
                    onClose={ handleErrorModalClose }
                />
            ) }
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    root: {
        flex: 1,
    },
    // Runs to the bottom of the screen and under the tab bar, so only the top
    // corners are rounded.
    sheet: {
        flex: 1,
        backgroundColor: GRADIENTS.background.bottom,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        overflow: 'hidden',
    },
    sheetHighlight: {
        height: 1.5,
        left: 0,
        position: 'absolute',
        right: 0,
        top: 0,
        zIndex: 1,
    },
    eventScroll: {
        flex: 1,
    },
    eventCards: {
        gap: 12,
        paddingBottom: 12,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    eventCard: {
        width: '100%',
    },
    eventCardBody: {
        paddingBottom: 13,
        paddingTop: 13,
    },
    eventAside: {
        alignItems: 'flex-end',
        flexShrink: 1,
        marginLeft: 12,
    },
    eventLabelRow: {
        alignItems: 'center',
        flexDirection: 'row',
        marginBottom: 6,
    },
    eventDot: {
        borderRadius: 3,
        height: 6,
        marginLeft: 8,
        width: 6,
    },
    eventLabel: {
        color: TEXT_COLORS.secondary,
        fontSize: 12,
        fontWeight: '500',
        letterSpacing: 1.2,
        textAlign: 'right',
        textTransform: 'uppercase',
    },
    eventValueRow: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        minHeight: 34,
    },
    // The month hangs off the top of the day number, where a temperature's
    // unit sits.
    eventReading: {
        alignItems: 'baseline',
        flexDirection: 'row',
    },
    eventDay: {
        color: TEXT_COLORS.primary,
        fontSize: 32,
        fontWeight: '500',
        letterSpacing: -0.8,
        lineHeight: 34,
    },
    eventMonth: {
        color: TEXT_COLORS.primary,
        fontSize: 32,
        fontWeight: '500',
        letterSpacing: -0.8,
        lineHeight: 34,
        marginLeft: 7,
    },
    eventMeta: {
        color: TEXT_COLORS.tertiary,
        fontSize: 13,
        textAlign: 'right',
    },
    eventEmpty: {
        alignSelf: 'center',
        color: TEXT_COLORS.tertiary,
        fontSize: 16,
        marginBottom: 4,
    },
    calendarFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginHorizontal: 24,
    },
    footerButton: {
        opacity: 1,
        width: 132,
    },
});
