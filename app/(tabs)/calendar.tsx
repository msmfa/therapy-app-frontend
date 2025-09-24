import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import { useAuth } from '../../src/auth/AuthContext';
import {
	listTherapySessions,
	createTherapySession,
	deleteTherapySession,
	TherapySession,
} from '../../src/api/therapy';
import { PINK_CLEAR, PINK_DARK, PINK_SOLID } from '../../src/const';

/* ---------------- Constants ---------------- */
const DAY_SIZE = 32;
const THERAPY_DURATION_MINUTES = 50;

/* ---------------- Utils ---------------- */
const pad = (n: number): string => (n < 10 ? `0${n}` : `${n}`);

const ymd = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const monthStart = (y: number, m1: number): Date => new Date(y, m1 - 1, 1, 0, 0, 0, 0);

const nextMonthStart = (y: number, m1: number): Date => new Date(y, m1, 1, 0, 0, 0, 0);

// Create sessions at local noon to avoid UTC day shift
const localNoonFromYMD = (dateYMD: string): Date => {
	const [y, m, d] = dateYMD.split('-').map(Number);
	return new Date(y, m - 1, d, 12, 0, 0, 0);
};

// Check if a date string is before today
const isPastDate = (dateString: string): boolean => {
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const checkDate = new Date(dateString + 'T00:00:00');
	return checkDate < today;
};

/* ---------------- Types ---------------- */
type MarkedDates = NonNullable<React.ComponentProps<typeof Calendar>['markedDates']>;
type DayObj = { dateString: string; day: number; month: number; year: number };
type SessionMap = Record<string, string>; // dateString -> sessionId

/* ---------------- Component ---------------- */
export default function CalendarScreen() {
	const { token } = useAuth();

	const now = useMemo(() => new Date(), []);
	const todayString = useMemo(() => ymd(now), [now]);

	const [visible, setVisible] = useState<{ year: number; month: number }>({
		year: now.getFullYear(),
		month: now.getMonth() + 1,
	});

	// Backend truth for this month: map YYYY-MM-DD -> session id (excluding past dates)
	const [savedMap, setSavedMap] = useState<SessionMap>({});
	// User's current selection for this month
	const [selected, setSelected] = useState<Set<string>>(new Set());

	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);

	const from = useMemo(() => monthStart(visible.year, visible.month), [visible]);
	const to = useMemo(() => nextMonthStart(visible.year, visible.month), [visible]);

	const fetchMonth = useCallback(async () => {
		if (!token) return;

		setLoading(true);
		try {
			const data = (await listTherapySessions(token, from, to)) as TherapySession[];
			const map: SessionMap = {};

			data.forEach((session) => {
				const dateStr = ymd(new Date(session.startsAtUtc));
				// Only include future dates and today in the saved map
				if (!isPastDate(dateStr)) {
					map[dateStr] = session._id;
				}
			});

			setSavedMap(map);
			// Mirror selection to saved state (no unsaved changes initially)
			setSelected(new Set(Object.keys(map)));
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown error';
			console.warn('fetchMonth failed:', message);
			Alert.alert('Error loading sessions', 'Please try refreshing the page.');
		} finally {
			setLoading(false);
		}
	}, [token, from, to]);

	useEffect(() => {
		fetchMonth();
	}, [fetchMonth]);

	// Calculate changes
	const changeSummary = useMemo(() => {
		const savedSet = new Set(Object.keys(savedMap));
		const toAdd = Array.from(selected).filter((d) => !savedSet.has(d));
		const toRemove = Array.from(savedSet).filter((d) => !selected.has(d));
		return { toAdd, toRemove };
	}, [savedMap, selected]);

	// Check for unsaved changes
	const hasUnsavedChanges = useMemo(() => {
		return changeSummary.toAdd.length > 0 || changeSummary.toRemove.length > 0;
	}, [changeSummary]);

	// Generate marked dates for calendar
	const markedDates: MarkedDates = useMemo(() => {
		const marks: MarkedDates = {};

		// Mark all selected dates
		selected.forEach((dateString) => {
			const isSaved = dateString in savedMap;

			marks[dateString] = {
				customStyles: {
					container: {
						width: DAY_SIZE,
						height: DAY_SIZE,
						borderRadius: DAY_SIZE / 2,
						alignItems: 'center',
						justifyContent: 'center',
						backgroundColor: PINK_DARK,
						// Add border for saved sessions
						...(isSaved && {
							borderWidth: 2,
							borderColor: '#111',
						}),
					},
					text: {
						color: '#fff',
						fontWeight: '700',
					},
				},
			} as any;
		});

		return marks;
	}, [savedMap, selected]);

	/* ---------------- Event Handlers ---------------- */
	const handleDayPress = useCallback((day: DayObj) => {
		// Toggle selection
		setSelected((prev) => {
			const next = new Set(prev);
			if (next.has(day.dateString)) {
				next.delete(day.dateString);
			} else {
				next.add(day.dateString);
			}
			return next;
		});
	}, []);

	const handleMonthChange = useCallback(
		(month: DayObj) => {
			if (hasUnsavedChanges) {
				Alert.alert(
					'Unsaved Changes',
					'Please save or discard your changes before navigating to another month.',
					[{ text: 'OK' }],
				);
				return;
			}
			setVisible({ year: month.year, month: month.month });
		},
		[hasUnsavedChanges],
	);

	const handleDiscard = useCallback(() => {
		setSelected(new Set(Object.keys(savedMap)));
	}, [savedMap]);

	const handleSave = useCallback(async () => {
		if (!token) {
			Alert.alert('Not logged in', 'Please log in first.');
			return;
		}

		setSaving(true);
		try {
			const { toAdd, toRemove } = changeSummary;

			// Get session IDs to delete
			const toDeleteIds = toRemove
				.map((dateStr) => savedMap[dateStr])
				.filter(Boolean) as string[];

			// Execute all operations in parallel
			await Promise.all([
				...toDeleteIds.map((id) => deleteTherapySession(token, id)),
				...toAdd.map((dateStr) =>
					createTherapySession(
						token,
						localNoonFromYMD(dateStr),
						THERAPY_DURATION_MINUTES,
					),
				),
			]);

			// Refresh month data
			await fetchMonth();

			// Show success message
			const message = (() => {
				if (toAdd.length > 0 && toDeleteIds.length > 0) {
					return `Added ${toAdd.length} session(s), removed ${toDeleteIds.length} session(s).`;
				} else if (toAdd.length > 0) {
					return `Added ${toAdd.length} session(s).`;
				} else {
					return `Removed ${toDeleteIds.length} session(s).`;
				}
			})();

			Alert.alert('Success', message);
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown error';
			Alert.alert('Save failed', message);
			// Refresh to ensure UI is in sync
			await fetchMonth();
		} finally {
			setSaving(false);
		}
	}, [token, changeSummary, savedMap, fetchMonth]);

	// Generate save button text
	const getSaveButtonText = useCallback((): string => {
		if (saving) return 'Saving…';

		const { toAdd, toRemove } = changeSummary;

		if (toAdd.length > 0 && toRemove.length > 0) {
			return `Add ${toAdd.length} / Remove ${toRemove.length}`;
		}
		if (toAdd.length > 0) {
			return `Add ${toAdd.length} session${toAdd.length !== 1 ? 's' : ''}`;
		}
		if (toRemove.length > 0) {
			return `Remove ${toRemove.length} session${toRemove.length !== 1 ? 's' : ''}`;
		}
		return 'Save changes';
	}, [saving, changeSummary]);

	const isCurrentMonth =
		visible.year === now.getFullYear() && visible.month === now.getMonth() + 1;

	/* ---------------- Render ---------------- */
	return (
		<SafeAreaView style={styles.root}>
			<View style={styles.container}>
				<Text style={styles.title}>Therapy Sessions</Text>
				<Text style={styles.subtitle}>Tap dates to add or remove sessions</Text>

				<Calendar
					style={styles.calendar}
					enableSwipeMonths={false}
					disableArrowRight={hasUnsavedChanges}
					disableArrowLeft={hasUnsavedChanges || isCurrentMonth}
					onMonthChange={handleMonthChange}
					onDayPress={handleDayPress}
					markingType="custom"
					markedDates={markedDates}
					hideExtraDays={false}
					current={todayString}
					minDate={todayString}
					theme={{
						calendarBackground: 'transparent',
						backgroundColor: 'transparent',
						selectedDayBackgroundColor: '#111',
						selectedDayTextColor: '#fff',
						todayTextColor: PINK_DARK,
						todayBackgroundColor: '#fef2f2',
						arrowColor: hasUnsavedChanges ? '#E11900' : '#111',
						monthTextColor: '#111',
						textDayFontWeight: '600',
						textMonthFontWeight: '700',
						textMonthFontSize: 18,
						textDisabledColor: '#d4d4d4',
					}}
				/>

				{loading && (
					<View style={styles.statusRow}>
						<ActivityIndicator color={PINK_DARK} />
						<Text style={styles.statusText}>Loading sessions...</Text>
					</View>
				)}

				{hasUnsavedChanges && !loading && (
					<View style={styles.banner}>
						<Text style={styles.bannerText}>
							You have unsaved changes. Save or discard before leaving this month.
						</Text>
					</View>
				)}

				{!loading && (
					<View style={styles.legend}>
						<View style={styles.legendItem}>
							<View style={[styles.legendDot, styles.legendDotNew]} />
							<Text style={styles.legendText}>New session</Text>
						</View>
						<View style={styles.legendItem}>
							<View style={[styles.legendDot, styles.legendDotSaved]} />
							<Text style={styles.legendText}>Saved session</Text>
						</View>
					</View>
				)}

				<View style={styles.actions}>
					<TouchableOpacity
						onPress={handleDiscard}
						disabled={!hasUnsavedChanges}
						style={[
							styles.btn,
							styles.btnGhost,
							!hasUnsavedChanges && styles.btnGhostDisabled,
						]}
					>
						<Text
							style={[
								styles.btnGhostText,
								!hasUnsavedChanges && styles.btnGhostTextDisabled,
							]}
						>
							Discard
						</Text>
					</TouchableOpacity>
					<TouchableOpacity
						onPress={handleSave}
						disabled={!hasUnsavedChanges || saving}
						style={[
							styles.btn,
							!hasUnsavedChanges || saving ? styles.btnDisabled : styles.btnPrimary,
						]}
					>
						<Text
							style={
								!hasUnsavedChanges || saving
									? styles.btnDisabledText
									: styles.btnPrimaryText
							}
						>
							{getSaveButtonText()}
						</Text>
					</TouchableOpacity>
				</View>
			</View>
		</SafeAreaView>
	);
}

/* ---------------- Styles ---------------- */
const styles = StyleSheet.create({
	root: {
		flex: 1,
		backgroundColor: 'transparent',
	},
	container: {
		paddingTop: 36,
		paddingHorizontal: 10,
	},
	title: {
		fontSize: 24,
		fontWeight: '700',
		marginBottom: 4,
	},
	subtitle: {
		color: '#666',
		marginBottom: 16,
		fontSize: 14,
	},
	calendar: {
		backgroundColor: 'transparent',
	},
	statusRow: {
		marginTop: 12,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		justifyContent: 'center',
	},
	statusText: {
		color: '#666',
		fontSize: 14,
	},
	banner: {
		marginTop: 12,
		padding: 12,
		borderRadius: 10,
		backgroundColor: 'rgba(225,25,0,0.08)',
		borderWidth: 1,
		borderColor: '#E7B0AA',
	},
	bannerText: {
		color: '#7A3026',
		fontWeight: '600',
		fontSize: 14,
	},
	legend: {
		flexDirection: 'row',
		gap: 20,
		marginTop: 16,
		justifyContent: 'center',
	},
	legendItem: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	legendDot: {
		width: 16,
		height: 16,
		borderRadius: 8,
		backgroundColor: PINK_DARK,
	},
	legendDotNew: {
		// Base styles already in legendDot
	},
	legendDotSaved: {
		borderWidth: 2,
		borderColor: '#111',
	},
	legendText: {
		fontSize: 13,
		color: '#666',
	},
	actions: {
		marginTop: 20,
		flexDirection: 'row',
		gap: 12,
	},
	btn: {
		flex: 1,
		paddingVertical: 14,
		paddingHorizontal: 14,
		borderRadius: 12,
		alignItems: 'center',
		justifyContent: 'center',
	},
	btnGhost: {
		borderWidth: 1.5,
		borderColor: '#333',
	},
	btnGhostDisabled: {
		borderColor: '#ddd',
	},
	btnGhostText: {
		fontWeight: '700',
		color: '#333',
	},
	btnGhostTextDisabled: {
		color: '#bbb',
	},
	btnPrimary: {
		backgroundColor: '#111',
	},
	btnPrimaryText: {
		color: '#fff',
		fontWeight: '700',
	},
	btnDisabled: {
		backgroundColor: '#f0f0f0',
	},
	btnDisabledText: {
		color: '#aaa',
		fontWeight: '700',
	},
});
