import React, { useEffect, useMemo, useState } from 'react';
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	Platform,
	ActivityIndicator,
	Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { createTherapySession, listTherapySessions, TherapySession } from '../../src/api/therapy';

type Props = {
	/** JWT from your login flow */
	authToken: string;
	/** Optional default duration to save with new sessions */
	defaultDurationMin?: number;
};

export default function CalendarScreen({ authToken, defaultDurationMin = 50 }: Props) {
	const [selectedDate, setSelectedDate] = useState<Date>(new Date());
	const [showAndroidPicker, setShowAndroidPicker] = useState(false);
	const [loading, setLoading] = useState(false);
	const [weekSessions, setWeekSessions] = useState<TherapySession[]>([]);
	const [saving, setSaving] = useState(false);

	const startOfWeek = (date: string | number | Date) => {
		const d = new Date(date);
		d.setHours(0, 0, 0, 0);
		const day = d.getDay(); // 0=Sun...6=Sat
		const mondayOffset = (day + 6) % 7; // Monday as first day
		d.setDate(d.getDate() - mondayOffset);
		return d;
	};

	const endOfWeek = (weekStart: Date) => {
		const d = new Date(weekStart);
		d.setDate(d.getDate() + 7); // exclusive upper bound
		return d;
	};

	const isSameDay = (a: Date, b: Date) =>
		a.getFullYear() === b.getFullYear() &&
		a.getMonth() === b.getMonth() &&
		a.getDate() === b.getDate();

	const weekStart = useMemo(() => startOfWeek(selectedDate), [selectedDate]);
	const weekEnd = useMemo(() => endOfWeek(weekStart), [weekStart]);

	const weekDays = useMemo(
		() =>
			Array.from({ length: 7 }, (_, i) => {
				const d = new Date(weekStart);
				d.setDate(weekStart.getDate() + i);
				return d;
			}),
		[weekStart],
	);

	const weekdayShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

	// Use API sessions instead of a hardcoded list
	const hasSessionOn = (date: Date) =>
		weekSessions.some((s) => {
			const d = new Date(s.startsAtUtc);
			return isSameDay(d, date);
		});

	const onChangePicker = (event: DateTimePickerEvent, date?: Date) => {
		if (Platform.OS === 'android') setShowAndroidPicker(false);
		if (date) setSelectedDate(date);
	};

	// Load sessions whenever the selected week changes
	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				setLoading(true);
				const data = await listTherapySessions(authToken, weekStart, weekEnd);
				if (!cancelled) setWeekSessions(data);
			} catch (e: any) {
				console.warn('Failed to load sessions:', e?.message ?? e);
			} finally {
				if (!cancelled) setLoading(false);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [authToken, weekStart, weekEnd]);

	// Save the selected date as a therapy session (UTC)
	const onSaveTherapySession = async () => {
		try {
			setSaving(true);

			// Optimistic UI: add a temporary item so the ring appears immediately
			const optimisticId = `optimistic-${Date.now()}`;
			const optimistic: TherapySession = {
				_id: optimisticId,
				userId: 'me',
				startsAtUtc: selectedDate.toISOString(),
				durationMin: defaultDurationMin,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			};
			setWeekSessions((prev) => [...prev, optimistic]);

			const saved = await createTherapySession(authToken, selectedDate, defaultDurationMin);

			// Replace optimistic with server doc
			setWeekSessions((prev) => prev.map((s) => (s._id === optimisticId ? saved : s)));
		} catch (e: any) {
			// Roll back optimistic add
			setWeekSessions((prev) => prev.filter((s) => !s._id.startsWith('optimistic-')));
			Alert.alert('Save failed', e?.message ?? 'Please try again.');
		} finally {
			setSaving(false);
		}
	};

	return (
		<SafeAreaView style={styles.root}>
			<View style={{ padding: 16 }}>
				<Text style={styles.title}>Calendar</Text>
				<Text style={styles.subtitle}>
					Tap a day to select. Red ring = therapy session.
				</Text>

				{/* Week strip with therapy markers */}
				<View style={styles.weekStrip}>
					{weekDays.map((d) => {
						const selected = isSameDay(d, selectedDate);
						const hasSession = hasSessionOn(d);
						return (
							<TouchableOpacity
								key={d.toDateString()}
								style={styles.dayCell}
								onPress={() => setSelectedDate(new Date(d))}
								accessibilityRole="button"
								accessibilityLabel={`${weekdayShort[d.getDay()]} ${d.getDate()}. ${hasSession ? 'Therapy session.' : ''} ${selected ? 'Selected.' : ''}`}
							>
								<Text style={styles.weekday}>{weekdayShort[d.getDay()]}</Text>
								<View
									style={[
										styles.dayBubble,
										selected && styles.dayBubbleSelected,
										hasSession && styles.dayBubbleHasSession, // red circle ring
									]}
								>
									<Text
										style={[
											styles.dayNumber,
											selected && styles.dayNumberSelected,
										]}
									>
										{d.getDate()}
									</Text>
								</View>
							</TouchableOpacity>
						);
					})}
				</View>

				{/* Actions */}
				<View
					style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}
				>
					{Platform.OS === 'ios' ? (
						<DateTimePicker
							value={selectedDate}
							mode="date"
							display="inline" // iOS 14+ inline calendar
							onChange={onChangePicker}
							style={{ alignSelf: 'stretch' }}
						/>
					) : (
						<>
							<TouchableOpacity
								onPress={() => setShowAndroidPicker(true)}
								style={styles.openPickerBtn}
							>
								<Text style={styles.openPickerText}>Open calendar</Text>
							</TouchableOpacity>
							{showAndroidPicker && (
								<DateTimePicker
									value={selectedDate}
									mode="date"
									display="calendar" // Android calendar UI
									onChange={onChangePicker}
								/>
							)}
						</>
					)}

					<TouchableOpacity
						onPress={onSaveTherapySession}
						style={[styles.openPickerBtn, saving && { opacity: 0.6 }]}
						disabled={saving}
					>
						<Text style={styles.openPickerText}>
							{saving ? 'Saving...' : 'Save therapy session'}
						</Text>
					</TouchableOpacity>
				</View>

				{/* Loading indicator for week fetch */}
				{loading && (
					<View
						style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }}
					>
						<ActivityIndicator />
						<Text>Loading this week…</Text>
					</View>
				)}
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	root: { flex: 1, backgroundColor: 'transparent' },
	container: { flex: 1, padding: 16, alignItems: 'center', justifyContent: 'center' },
	title: { fontSize: 22, fontWeight: '700' },
	subtitle: { marginTop: 8, color: '#666' },

	weekStrip: {
		marginTop: 16,
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	dayCell: {
		alignItems: 'center',
		width: `${100 / 7}%`,
	},
	weekday: {
		fontSize: 12,
		color: '#666',
		marginBottom: 6,
	},
	dayBubble: {
		height: 40,
		width: 40,
		borderRadius: 20,
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 0, // default no ring
	},
	dayBubbleSelected: {
		backgroundColor: '#111',
	},
	dayBubbleHasSession: {
		borderWidth: 2,
		borderColor: '#E11900', // red circle ring for therapy day
	},
	dayNumber: {
		fontSize: 16,
		fontWeight: '600',
		color: '#111',
	},
	dayNumberSelected: {
		color: '#fff',
	},

	openPickerBtn: {
		paddingVertical: 10,
		paddingHorizontal: 14,
		borderRadius: 10,
		borderWidth: 1,
		borderColor: '#ddd',
		alignSelf: 'flex-start',
	},
	openPickerText: { fontWeight: '600' },
});
