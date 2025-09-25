import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	ScrollView,
	ActivityIndicator,
	Modal,
	Alert,
	Platform,
	KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../../src/auth/AuthContext';
import {
	listTherapySessions,
	createTherapySession,
	deleteTherapySession,
	updateTherapySession,
	TherapySession,
} from '../../src/api/therapy';

/* ---------------- Design System ---------------- */
const colors = {
	background: '#FAFBFC',
	surface: '#FFFFFF',
	surfaceAlt: '#F8F9FA',
	text: {
		primary: '#111111',
		secondary: '#666666',
		muted: '#9CA3AF',
		inverse: '#FFFFFF',
	},
	primary: '#0066CC',
	primaryLight: '#E8F4FD',
	success: '#059669',
	danger: '#DC2626',
	dangerLight: '#FEE2E2',
	border: '#E5E7EB',
	overlay: 'rgba(0, 0, 0, 0.5)',
};

const typography = {
	h1: { fontSize: 28, fontWeight: '700' as const },
	h2: { fontSize: 20, fontWeight: '600' as const },
	h3: { fontSize: 16, fontWeight: '600' as const },
	body: { fontSize: 14, fontWeight: '400' as const },
	caption: { fontSize: 12, fontWeight: '500' as const },
	button: { fontSize: 14, fontWeight: '600' as const },
};

const spacing = {
	xs: 4,
	sm: 8,
	md: 12,
	lg: 16,
	xl: 24,
	xxl: 32,
};

const radius = {
	sm: 6,
	md: 10,
	lg: 14,
	xl: 20,
};

interface Session {
	id: string;
	date: string;
	time: Date;
}

type ScheduleMode = 'single' | 'weekly_pattern';

const ScheduleModal: React.FC<{
	visible: boolean;
	selectedDate: string | null;
	existingSession: Session | null;
	defaultTime: Date;
	onConfirm: (mode: ScheduleMode, time: Date) => void;
	onDelete: () => void;
	onCancel: () => void;
}> = ({ visible, selectedDate, existingSession, defaultTime, onConfirm, onDelete, onCancel }) => {
	const [time, setTime] = useState(defaultTime);
	const [scheduleMode, setScheduleMode] = useState<ScheduleMode>('single');
	const [showPicker, setShowPicker] = useState(false);

	useEffect(() => {
		if (visible) {
			setTime(existingSession?.time || defaultTime);
			setScheduleMode('single');
		}
	}, [visible, existingSession, defaultTime]);

	const handleTimeChange = (event: any, selectedTime?: Date) => {
		if (Platform.OS === 'android') {
			setShowPicker(false);
			if (event.type === 'dismissed') return;
		}
		if (selectedTime && !isNaN(selectedTime.getTime())) {
			setTime(selectedTime);
		}
	};

	const handleConfirm = () => {
		onConfirm(scheduleMode, time);
	};

	const formatDate = (dateString: string | null) => {
		if (!dateString) return '';
		const [year, month, day] = dateString.split('-').map(Number);
		const date = new Date(year, month - 1, day);
		return date.toLocaleDateString(undefined, {
			weekday: 'long',
			month: 'long',
			day: 'numeric',
			year: 'numeric',
		});
	};

	const formatTime = (date: Date) => {
		return date.toLocaleTimeString([], {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true,
		});
	};

	const getSelectedDayName = () => {
		if (!selectedDate) return '';
		const [year, month, day] = selectedDate.split('-').map(Number);
		const date = new Date(year, month - 1, day);
		const weekDays = [
			'Sunday',
			'Monday',
			'Tuesday',
			'Wednesday',
			'Thursday',
			'Friday',
			'Saturday',
		];
		return weekDays[date.getDay()];
	};

	const isEdit = !!existingSession;

	if (!visible) return null;

	return (
		<Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
			<View style={styles.modalOverlay}>
				<TouchableOpacity
					style={styles.modalBackdrop}
					activeOpacity={1}
					onPress={onCancel}
				/>
				<KeyboardAvoidingView
					behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
					style={styles.modalContainer}
				>
					<View style={styles.modalContent}>
						<View style={styles.modalHandle} />
						<View style={styles.modalHeader}>
							<Text style={styles.modalTitle}>
								{isEdit ? 'Edit Session' : 'Schedule Session'}
							</Text>
							<TouchableOpacity onPress={onCancel} style={styles.modalCloseButton}>
								<Ionicons name="close" size={24} color={colors.text.secondary} />
							</TouchableOpacity>
						</View>
						<ScrollView
							style={styles.modalScroll}
							showsVerticalScrollIndicator={false}
							contentContainerStyle={styles.modalScrollContent}
						>
							<Text style={styles.modalDateDisplay}>{formatDate(selectedDate)}</Text>
							<View style={styles.timeSection}>
								<Text style={styles.sectionLabel}>Session Time</Text>
								{Platform.OS === 'ios' ? (
									<DateTimePicker
										value={time}
										mode="time"
										display="spinner"
										onChange={handleTimeChange}
										style={styles.iosTimePicker}
									/>
								) : (
									<>
										<TouchableOpacity
											onPress={() => setShowPicker(true)}
											style={styles.androidTimeButton}
										>
											<Ionicons
												name="time-outline"
												size={20}
												color={colors.primary}
											/>
											<Text style={styles.androidTimeText}>
												{formatTime(time)}
											</Text>
										</TouchableOpacity>

										{showPicker && (
											<DateTimePicker
												value={time}
												mode="time"
												display="default"
												onChange={handleTimeChange}
											/>
										)}
									</>
								)}
							</View>

							{/* Schedule Options - Only show for new sessions */}
							{!isEdit && selectedDate && (
								<>
									<Text style={styles.sectionLabel}>Apply To</Text>
									<View style={styles.scheduleModeOptions}>
										<TouchableOpacity
											onPress={() => setScheduleMode('single')}
											style={[
												styles.scheduleModeOption,
												scheduleMode === 'single' &&
													styles.scheduleModeOptionSelected,
											]}
										>
											<View style={styles.radioButton}>
												{scheduleMode === 'single' && (
													<View style={styles.radioButtonInner} />
												)}
											</View>
											<View style={styles.scheduleModeTextContainer}>
												<Text style={styles.scheduleModeTitle}>
													This day only
												</Text>
												<Text style={styles.scheduleModeDescription}>
													Schedule just for selected date
												</Text>
											</View>
										</TouchableOpacity>

										<TouchableOpacity
											onPress={() => setScheduleMode('weekly_pattern')}
											style={[
												styles.scheduleModeOption,
												scheduleMode === 'weekly_pattern' &&
													styles.scheduleModeOptionSelected,
											]}
										>
											<View style={styles.radioButton}>
												{scheduleMode === 'weekly_pattern' && (
													<View style={styles.radioButtonInner} />
												)}
											</View>
											<View style={styles.scheduleModeTextContainer}>
												<Text style={styles.scheduleModeTitle}>
													Weekly pattern
												</Text>
												<Text style={styles.scheduleModeDescription}>
													Schedule every {getSelectedDayName()} for the
													next 2 months
												</Text>
											</View>
										</TouchableOpacity>
									</View>

									{scheduleMode === 'weekly_pattern' && (
										<View style={styles.weeklyPatternInfo}>
											<Ionicons
												name="information-circle"
												size={18}
												color={colors.primary}
											/>
											<Text style={styles.weeklyPatternInfoText}>
												This will create sessions every{' '}
												{getSelectedDayName()} at {formatTime(time)} for the
												next two months
											</Text>
										</View>
									)}
								</>
							)}
						</ScrollView>

						<View style={styles.modalActions}>
							{isEdit && (
								<TouchableOpacity
									onPress={onDelete}
									style={[styles.modalButton, styles.deleteButton]}
								>
									<Ionicons
										name="trash-outline"
										size={18}
										color={colors.danger}
									/>
									<Text style={styles.deleteButtonText}>Delete</Text>
								</TouchableOpacity>
							)}

							<TouchableOpacity
								onPress={onCancel}
								style={[
									styles.modalButton,
									styles.cancelButton,
									isEdit && { flex: 1 },
								]}
							>
								<Text style={styles.cancelButtonText}>Cancel</Text>
							</TouchableOpacity>

							<TouchableOpacity
								onPress={handleConfirm}
								style={[
									styles.modalButton,
									styles.confirmButton,
									isEdit && { flex: 2 },
								]}
							>
								<Text style={styles.confirmButtonText}>
									{isEdit ? 'Update' : 'Schedule'}
								</Text>
							</TouchableOpacity>
						</View>
					</View>
				</KeyboardAvoidingView>
			</View>
		</Modal>
	);
};

/* ---------------- Main Component ---------------- */
export default function CalendarScreen() {
	const { token } = useAuth();
	const [sessions, setSessions] = useState<Map<string, Session>>(new Map());
	const [loading, setLoading] = useState(false);
	const [selectedDate, setSelectedDate] = useState<string | null>(null);
	const [showScheduleModal, setShowScheduleModal] = useState(false);
	const [currentMonth, setCurrentMonth] = useState({
		month: new Date().getMonth(),
		year: new Date().getFullYear(),
	});
	const [defaultTime, setDefaultTime] = useState(() => {
		const time = new Date();
		time.setHours(10, 0, 0, 0);
		return time;
	});

	// Computed values for calendar
	const markedDates = useMemo(() => {
		const marks: any = {};

		const today = new Date();
		today.setHours(0, 0, 0, 0);

		sessions.forEach((session, dateString) => {
			const sessionDate = new Date(dateString);
			const isPast = sessionDate < today;

			marks[dateString] = {
				marked: true,
				dotColor: isPast ? colors.text.muted : colors.primary,
				selected: selectedDate === dateString,
				selectedColor: isPast ? colors.text.muted : colors.primary,
				disabled: isPast,
				disableTouchEvent: isPast,
			};
		});

		if (selectedDate && !marks[selectedDate]) {
			marks[selectedDate] = {
				selected: true,
				selectedColor: colors.primary,
			};
		}

		return marks;
	}, [sessions, selectedDate]);

	const selectedSession: Session | null = useMemo(
		() => (selectedDate ? (sessions.get(selectedDate) ?? null) : null),
		[selectedDate, sessions],
	);

	const fetchSessions = useCallback(async () => {
		if (!token) return;

		setLoading(true);
		try {
			const startDate = new Date();
			startDate.setMonth(startDate.getMonth() - 3);
			const endDate = new Date();
			endDate.setMonth(endDate.getMonth() + 3);

			const data = (await listTherapySessions(token, startDate, endDate)) as TherapySession[];

			const sessionsMap = new Map<string, Session>();
			data.forEach((session) => {
				const sessionDate = new Date(session.startsAtUtc);
				const year = sessionDate.getFullYear();
				const month = String(sessionDate.getMonth() + 1).padStart(2, '0');
				const day = String(sessionDate.getDate()).padStart(2, '0');
				const dateString = `${year}-${month}-${day}`;

				sessionsMap.set(dateString, {
					id: session._id,
					date: dateString,
					time: sessionDate,
				});
			});

			setSessions(sessionsMap);
		} catch (error) {
			console.error('Failed to fetch sessions:', error);
			Alert.alert('Error', 'Failed to load sessions');
		} finally {
			setLoading(false);
		}
	}, [token]);

	useEffect(() => {
		fetchSessions();
	}, [fetchSessions]);

	const handleDayPress = (day: any) => {
		setSelectedDate(day.dateString);
		setShowScheduleModal(true);
	};

	const handleScheduleConfirm = async (mode: ScheduleMode, time: Date) => {
		if (!token) return;

		setShowScheduleModal(false);
		setLoading(true);

		setDefaultTime(time);

		let datesToSchedule: string[] = [];

		switch (mode) {
			case 'single':
				if (selectedDate) {
					datesToSchedule = [selectedDate];
				}
				break;

			case 'weekly_pattern':
				if (!selectedDate) return;

				const [selectedYear, selectedMonth, selectedDay] = selectedDate
					.split('-')
					.map(Number);
				const selectedDateObj = new Date(selectedYear, selectedMonth - 1, selectedDay);
				const targetDayOfWeek = selectedDateObj.getDay();

				const patternStart = new Date(selectedYear, selectedMonth - 1, selectedDay);
				const patternEnd = new Date(selectedYear, selectedMonth - 1 + 2, selectedDay);

				for (let d = new Date(patternStart); d <= patternEnd; d.setDate(d.getDate() + 1)) {
					const year = d.getFullYear();
					const month = String(d.getMonth() + 1).padStart(2, '0');
					const day = String(d.getDate()).padStart(2, '0');
					const dateStr = `${year}-${month}-${day}`;

					if (d.getDay() === targetDayOfWeek && !sessions.has(dateStr)) {
						datesToSchedule.push(dateStr);
					}
				}
				break;
		}

		if (datesToSchedule.length === 0) {
			setLoading(false);
			setSelectedDate(null);
			return;
		}

		let successCount = 0;
		let errorCount = 0;

		try {
			for (const dateString of datesToSchedule) {
				try {
					const [year, month, day] = dateString.split('-').map(Number);
					const date = new Date(year, month - 1, day);
					date.setHours(time.getHours(), time.getMinutes(), 0, 0);

					const existingSession = sessions.get(dateString);

					if (existingSession) {
						await updateTherapySession(token, existingSession.id, date, 50);
					} else {
						await createTherapySession(token, date, 50);
					}

					successCount++;
				} catch (error) {
					console.error(`Failed to schedule for ${dateString}:`, error);
					errorCount++;
				}
			}

			await fetchSessions();

			const fmtTime = (date: Date) =>
				date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });

			if (mode === 'weekly_pattern') {
				const weekDayNames = [
					'Sunday',
					'Monday',
					'Tuesday',
					'Wednesday',
					'Thursday',
					'Friday',
					'Saturday',
				];
				const [yy, mm, dd] = selectedDate!.split('-').map(Number);
				const selectedDateObj2 = new Date(yy, mm - 1, dd);
				const dayName = weekDayNames[selectedDateObj2.getDay()];

				Alert.alert(
					'Success',
					`Scheduled ${successCount} sessions on ${dayName}s at ${fmtTime(time)} for the next 2 months`,
				);
			} else if (successCount > 0) {
				Alert.alert('Success', `Session scheduled for ${fmtTime(time)}`);
			}

			if (errorCount > 0) {
				Alert.alert('Warning', `Failed to schedule ${errorCount} session(s)`);
			}
		} catch (error) {
			console.error('Error in scheduling:', error);
			Alert.alert('Error', 'Failed to schedule sessions');
		} finally {
			setLoading(false);
			setSelectedDate(null);
		}
	};

	const handleDelete = async () => {
		if (!token || !selectedDate || !selectedSession) return;

		Alert.alert('Delete Session', 'Are you sure you want to delete this session?', [
			{ text: 'Cancel', style: 'cancel' },
			{
				text: 'Delete',
				style: 'destructive',
				onPress: async () => {
					setShowScheduleModal(false);
					setLoading(true);

					try {
						await deleteTherapySession(token, selectedSession.id);
						await fetchSessions();
						Alert.alert('Success', 'Session deleted');
					} catch (error) {
						Alert.alert('Error', 'Failed to delete session');
					} finally {
						setLoading(false);
						setSelectedDate(null);
					}
				},
			},
		]);
	};

	const handleClearMonth = async () => {
		if (!token) return;

		const monthSessions = Array.from(sessions.entries()).filter(([dateStr]) => {
			const [year, month] = dateStr.split('-').map(Number);
			return month === currentMonth.month + 1 && year === currentMonth.year;
		});

		if (monthSessions.length === 0) {
			Alert.alert('No Sessions', 'No sessions to delete in this month');
			return;
		}

		Alert.alert('Clear Month', `Delete all ${monthSessions.length} sessions in this month?`, [
			{ text: 'Cancel', style: 'cancel' },
			{
				text: 'Delete All',
				style: 'destructive',
				onPress: async () => {
					setLoading(true);
					let deletedCount = 0;

					for (const [_, session] of monthSessions) {
						try {
							await deleteTherapySession(token, session.id);
							deletedCount++;
						} catch (error) {
							console.error('Failed to delete session:', error);
						}
					}

					await fetchSessions();
					Alert.alert('Success', `Deleted ${deletedCount} sessions`);
					setLoading(false);
				},
			},
		]);
	};

	const todayYMD = useMemo(() => {
		const t = new Date();
		const y = t.getFullYear();
		const m = String(t.getMonth() + 1).padStart(2, '0');
		const d = String(t.getDate()).padStart(2, '0');
		return `${y}-${m}-${d}`;
	}, []);

	return (
		<View style={styles.container}>
			<SafeAreaView style={styles.safeArea} edges={['top']}>
				<ScrollView
					style={styles.scrollView}
					contentInsetAdjustmentBehavior="automatic" // ✅ helps on iOS with translucent headers
					contentContainerStyle={[
						styles.scrollContent,
						{ paddingTop: 20 }, // ✅ give room under the nav header
					]}
					showsVerticalScrollIndicator={false}
				>
					<View style={styles.calendarContainer}>
						<Calendar
							onDayPress={handleDayPress}
							onMonthChange={(date) => {
								setCurrentMonth({ month: date.month - 1, year: date.year });
							}}
							markedDates={markedDates}
							markingType={'dot'}
							hideExtraDays
							minDate={String(new Date())}
							theme={{
								backgroundColor: colors.surface,
								calendarBackground: colors.surface,
								textSectionTitleColor: colors.text.muted,
								selectedDayBackgroundColor: colors.primary,
								selectedDayTextColor: colors.text.inverse,
								todayTextColor: colors.primary,
								dayTextColor: colors.text.primary,
								textDisabledColor: '#d9e1e8',
								dotColor: colors.primary,
								selectedDotColor: colors.text.inverse,
								arrowColor: colors.primary,
								monthTextColor: colors.text.primary,
								textDayFontWeight: '400',
								textMonthFontWeight: '600',
								textDayHeaderFontWeight: '600',
								textDayFontSize: 14,
								textMonthFontSize: 16,
								textDayHeaderFontSize: 12,
							}}
						/>
					</View>

					<View style={styles.actionButtons}>
						<TouchableOpacity
							style={styles.actionButton}
							onPress={() => {
								const today = new Date();
								const year = today.getFullYear();
								const month = String(today.getMonth() + 1).padStart(2, '0');
								const day = String(today.getDate()).padStart(2, '0');
								setSelectedDate(`${year}-${month}-${day}`);
								setShowScheduleModal(true);
							}}
						>
							<Ionicons name="add-circle-outline" size={20} color={colors.primary} />
							<Text style={styles.actionButtonText}>Add Session</Text>
						</TouchableOpacity>

						<TouchableOpacity
							style={[styles.actionButton, styles.dangerButton]}
							onPress={handleClearMonth}
						>
							<Ionicons name="trash-outline" size={20} color={colors.danger} />
							<Text style={[styles.actionButtonText, styles.dangerText]}>
								Clear Month
							</Text>
						</TouchableOpacity>
					</View>

					<View style={styles.infoCard}>
						<Text style={styles.infoText}>
							💡 Tap any date to schedule. Use weekly pattern to automatically
							schedule that day of the week for the next 2 months.
						</Text>
					</View>
				</ScrollView>

				{loading && (
					<View style={styles.loadingOverlay}>
						<ActivityIndicator size="large" color={colors.primary} />
					</View>
				)}

				{selectedDate && (
					<ScheduleModal
						visible={showScheduleModal}
						selectedDate={selectedDate}
						existingSession={selectedSession}
						defaultTime={defaultTime}
						onConfirm={handleScheduleConfirm}
						onDelete={handleDelete}
						onCancel={() => {
							setShowScheduleModal(false);
							setSelectedDate(null);
						}}
					/>
				)}
			</SafeAreaView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.background,
	},
	safeArea: {
		flex: 1,
	},
	scrollView: {
		flex: 1,
	},
	scrollContent: {
		paddingBottom: spacing.xs,
	},
	backButton: {
		padding: spacing.sm,
	},
	headerTitle: {
		...typography.h3,
		color: colors.text.primary,
	},
	calendarContainer: {
		margin: spacing.lg,
		borderRadius: radius.lg,
		overflow: 'hidden',
		backgroundColor: colors.surface,
		elevation: 2,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.05,
		shadowRadius: 4,
	},
	actionButtons: {
		flexDirection: 'row',
		gap: spacing.md,
		marginHorizontal: spacing.lg,
		marginTop: spacing.lg,
	},
	actionButton: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: spacing.sm,
		padding: spacing.md,
		backgroundColor: colors.surface,
		borderRadius: radius.md,
		borderWidth: 1,
		borderColor: colors.primary,
	},
	dangerButton: {
		borderColor: colors.danger,
		backgroundColor: colors.dangerLight,
	},
	actionButtonText: {
		...typography.button,
		color: colors.primary,
	},
	dangerText: {
		color: colors.danger,
	},
	infoCard: {
		margin: spacing.lg,
		padding: spacing.md,
		backgroundColor: colors.primaryLight,
		borderRadius: radius.md,
		borderWidth: 1,
		borderColor: colors.primary,
	},
	infoText: {
		...typography.body,
		color: colors.text.secondary,
		lineHeight: 20,
	},
	loadingOverlay: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: 'rgba(255, 255, 255, 0.9)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: colors.overlay,
		justifyContent: 'flex-end',
	},
	modalBackdrop: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
	},
	modalContainer: {
		maxHeight: '80%',
		justifyContent: 'flex-end',
	},
	modalContent: {
		backgroundColor: colors.surface,
		borderTopLeftRadius: radius.xl,
		borderTopRightRadius: radius.xl,
		paddingTop: spacing.sm,
		maxHeight: '100%',
	},
	modalScroll: {
		maxHeight: 400,
	},
	modalScrollContent: {
		paddingHorizontal: spacing.xl,
		paddingBottom: spacing.md,
	},
	modalHandle: {
		width: 40,
		height: 4,
		backgroundColor: colors.border,
		borderRadius: 2,
		alignSelf: 'center',
		marginBottom: spacing.lg,
	},
	modalHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: spacing.sm,
		paddingHorizontal: spacing.xl,
	},
	modalTitle: {
		...typography.h2,
		color: colors.text.primary,
	},
	modalCloseButton: {
		padding: spacing.xs,
	},
	modalDateDisplay: {
		...typography.body,
		color: colors.text.secondary,
		marginBottom: spacing.xl,
	},
	sectionLabel: {
		...typography.caption,
		color: colors.text.muted,
		textTransform: 'uppercase',
		letterSpacing: 1,
		marginBottom: spacing.md,
	},
	timeSection: {
		marginBottom: spacing.xl,
	},
	iosTimePicker: {
		height: 180,
		marginHorizontal: -spacing.lg,
	},
	androidTimeButton: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.md,
		padding: spacing.lg,
		backgroundColor: colors.primaryLight,
		borderRadius: radius.md,
		borderWidth: 1,
		borderColor: colors.primary,
	},
	androidTimeText: {
		...typography.h3,
		color: colors.primary,
	},
	scheduleModeOptions: {
		gap: spacing.md,
		marginBottom: spacing.xl,
	},
	scheduleModeOption: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.md,
		padding: spacing.md,
		borderRadius: radius.md,
		borderWidth: 1,
		borderColor: colors.border,
		backgroundColor: colors.surfaceAlt,
	},
	scheduleModeOptionSelected: {
		borderColor: colors.primary,
		backgroundColor: colors.primaryLight,
	},
	radioButton: {
		width: 20,
		height: 20,
		borderRadius: 10,
		borderWidth: 2,
		borderColor: colors.border,
		alignItems: 'center',
		justifyContent: 'center',
	},
	radioButtonInner: {
		width: 10,
		height: 10,
		borderRadius: 5,
		backgroundColor: colors.primary,
	},
	scheduleModeTextContainer: {
		flex: 1,
	},
	scheduleModeTitle: {
		...typography.body,
		fontWeight: '600',
		color: colors.text.primary,
	},
	scheduleModeDescription: {
		...typography.caption,
		color: colors.text.secondary,
		marginTop: 2,
	},
	weeklyPatternInfo: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		gap: spacing.sm,
		padding: spacing.md,
		backgroundColor: colors.primaryLight,
		borderRadius: radius.md,
		borderWidth: 1,
		borderColor: colors.primary,
		marginTop: spacing.md,
		marginBottom: spacing.xl,
	},
	weeklyPatternInfoText: {
		...typography.caption,
		color: colors.text.secondary,
		flex: 1,
		lineHeight: 18,
	},
	modalActions: {
		flexDirection: 'row',
		gap: spacing.md,
		paddingHorizontal: spacing.xl,
		paddingVertical: spacing.lg,
		paddingBottom: spacing.xxl,
		borderTopWidth: 1,
		borderTopColor: colors.border,
		backgroundColor: colors.surface,
	},
	modalButton: {
		flex: 1,
		paddingVertical: spacing.md,
		borderRadius: radius.md,
		alignItems: 'center',
		justifyContent: 'center',
		flexDirection: 'row',
		gap: spacing.xs,
	},
	deleteButton: {
		flex: 0,
		paddingHorizontal: spacing.lg,
		backgroundColor: colors.dangerLight,
		borderWidth: 1,
		borderColor: colors.danger,
	},
	deleteButtonText: {
		...typography.button,
		color: colors.danger,
	},
	cancelButton: {
		backgroundColor: colors.surfaceAlt,
		borderWidth: 1,
		borderColor: colors.border,
	},
	cancelButtonText: {
		...typography.button,
		color: colors.text.secondary,
	},
	confirmButton: {
		backgroundColor: colors.primary,
		flex: 2,
	},
	confirmButtonText: {
		...typography.button,
		color: colors.text.inverse,
	},

	disabledButton: {
		opacity: 0.5,
	},
});
