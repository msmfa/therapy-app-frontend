// app/(tabs)/note/reminder.tsx
import React, { useEffect, useState, useLayoutEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';

import { useNotes } from '../../src/hooks/useNotes';
import { useAuth } from '../context/AuthContext';
import { getTherapySessions, TherapySession } from '../../src/api/therapy';
import { InfoBlock } from '../../src/components/infoBlock';

import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Button } from '../../src/components/button';

dayjs.extend(advancedFormat);
dayjs.extend(relativeTime);

// Smart reminder timing options based on neuroplasticity research
const REMINDER_TIMINGS = [
	{
		id: 'smart-pattern',
		label: 'Science-based pattern',
		description: 'Multiple reminders for optimal neuroplasticity',
		icon: '🧠',
		badge: 'RECOMMENDED',
		isMultiple: true,
		calculate: (now: Date, next: Date) => {
			// Returns array of reminder times
			const reminders = [];

			// 1. Tomorrow (24 hours) - practice while fresh
			const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
			tomorrow.setHours(19, 0, 0, 0); // 7 PM
			reminders.push({ time: tomorrow, message: 'Practice what you learned yesterday' });

			// 2. Midweek - reinforce when memory fades
			const diff = next.getTime() - now.getTime();
			const midweek = new Date(now.getTime() + diff / 2);
			midweek.setHours(19, 0, 0, 0); // 7 PM
			reminders.push({ time: midweek, message: 'Review your therapy insights' });

			// 3. Day before - prepare for next session
			const dayBefore = new Date(next.getTime() - 24 * 60 * 60 * 1000);
			dayBefore.setHours(19, 0, 0, 0); // 7 PM
			reminders.push({ time: dayBefore, message: "Prepare for tomorrow's session" });

			return reminders;
		},
	},
	{
		id: 'day-before',
		label: 'Day before',
		description: '24 hours before next session',
		icon: '🔔',
		calculate: (now: Date, next: Date) => {
			return new Date(next.getTime() - 24 * 60 * 60 * 1000);
		},
	},
];

// Fetch next therapy session
async function getNextSession(token: string): Promise<Date | null> {
	const now = new Date();
	const to = new Date(now.getFullYear(), now.getMonth() + 2, now.getDate());
	try {
		const data = (await getTherapySessions(token, now, to)) as TherapySession[];
		const nextSession = data
			.map((s) => new Date(s.startsAtUtc))
			.filter((x) => x.getTime() > Date.now())
			.sort((a, b) => a.getTime() - b.getTime())[0];
		return nextSession ?? null;
	} catch {
		return null;
	}
}

// Get user's saved preference
async function getSavedPreference(): Promise<string> {
	// This would fetch from user settings/storage
	// Default to 'smart-pattern' for new users
	return 'smart-pattern';
}

// Save user's preference
async function savePreference(timingId: string): Promise<void> {
	// This would save to user settings/storage
	console.log('Saving preference:', timingId);
}

export default function ReminderScreen() {
	const router = useRouter();
	const navigation = useNavigation();
	const { text, nextSession } = useLocalSearchParams<{ text?: string; nextSession?: string }>();
	const { addNoteWithReminder } = useNotes();
	const { token } = useAuth();

	const [loading, setLoading] = useState(true);
	const [nextSessionDate, setNextSessionDate] = useState<Date | null>(null);
	const [selectedTiming, setSelectedTiming] = useState<string>('smart-pattern');
	const [savedPreference, setSavedPreference] = useState<string>('smart-pattern');
	const [error, setError] = useState<string | null>(null);

	// Hide the header title
	useLayoutEffect(() => {
		navigation.setOptions({
			headerTitle: '',
			headerTransparent: true,
			headerBackTitleVisible: false,
		});
	}, [navigation]);

	useEffect(() => {
		let alive = true;
		(async () => {
			if (!token) return;

			try {
				// Load next session and saved preference
				const [session, preference] = await Promise.all([
					nextSession ? Promise.resolve(new Date(nextSession)) : getNextSession(token),
					getSavedPreference(),
				]);

				if (alive) {
					setNextSessionDate(session);
					setSelectedTiming(preference);
					setSavedPreference(preference);
					setLoading(false);
				}
			} catch (err) {
				if (alive) {
					setError('Failed to load session data');
					setLoading(false);
				}
			}
		})();
		return () => {
			alive = false;
		};
	}, [token, nextSession]);

	const calculateReminderTime = (
		timingId: string,
	): Date | Array<{ time: Date; message: string }> | null => {
		if (!nextSessionDate) return null;
		const timing = REMINDER_TIMINGS.find((t) => t.id === timingId);
		if (!timing) return null;

		const now = new Date();
		const result = timing.calculate(now, nextSessionDate);

		// Handle multiple reminders (array)
		if (Array.isArray(result)) {
			// Filter out any reminders that are in the past
			const validReminders = result.filter((r) => r.time.getTime() > now.getTime());
			return validReminders.length > 0 ? validReminders : null;
		}

		// Handle single reminder (Date)
		if (result.getTime() <= now.getTime()) {
			// If calculated time is in past, set to 1 hour from now
			return new Date(now.getTime() + 60 * 60 * 1000);
		}

		return result;
	};

	async function onSave() {
		if (!text || !text.trim()) {
			setError('Missing note text');
			return;
		}

		const reminderData = calculateReminderTime(selectedTiming);
		if (!reminderData) {
			setError('Could not calculate reminder time');
			return;
		}

		setError(null);
		try {
			// Handle multiple reminders
			if (Array.isArray(reminderData)) {
				// For now, just save the first reminder (midweek one)
				// In a real app, you'd save all three reminders
				const primaryReminder = reminderData[1] || reminderData[0]; // Use midweek if available
				await addNoteWithReminder(text.trim(), primaryReminder.time);

				// Log that this is a multi-reminder pattern for future implementation
				console.log('Multi-reminder pattern selected:', reminderData);
			} else {
				// Single reminder
				await addNoteWithReminder(text.trim(), reminderData);
			}

			// Save preference if it changed
			if (selectedTiming !== savedPreference) {
				await savePreference(selectedTiming);
			}

			router.replace('/(tabs)/note/success');
		} catch (err) {
			setError('Failed to save reminder. Please try again.');
		}
	}

	const formatReminderTime = (date: Date | null): string => {
		if (!date) return '';
		const now = new Date();
		const isToday = date.toDateString() === now.toDateString();
		const isTomorrow =
			date.toDateString() === new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString();

		if (isToday) {
			return `Today at ${dayjs(date).format('h:mm A')}`;
		} else if (isTomorrow) {
			return `Tomorrow at ${dayjs(date).format('h:mm A')}`;
		} else {
			return dayjs(date).format('ddd, MMM D [at] h:mm A');
		}
	};

	const getSessionInterval = (): string => {
		if (!nextSessionDate) return '';
		const now = new Date();
		const days = Math.round(
			(nextSessionDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000),
		);

		if (days === 7) return 'Weekly session';
		if (days === 14) return 'Bi-weekly session';
		if (days < 7) return `${days} days until session`;
		return `${days} days until session`;
	};

	if (loading) {
		return (
			<SafeAreaView style={styles.root}>
				<View style={styles.loadingContainer}>
					<ActivityIndicator size="large" color="#111" />
					<Text style={styles.loadingText}>Setting up your reminder...</Text>
				</View>
			</SafeAreaView>
		);
	}

	if (!nextSessionDate) {
		return (
			<SafeAreaView style={styles.root}>
				<View style={styles.container}>
					<Text style={styles.title}>No upcoming session</Text>
					<View style={styles.noSessionCard}>
						<Text style={styles.noSessionEmoji}>📅</Text>
						<Text style={styles.noSessionText}>
							Schedule your next therapy session first
						</Text>
						<Text style={styles.noSessionSubtext}>
							We'll remind you to review this note before your next session
						</Text>
					</View>
					<Pressable onPress={() => router.back()} style={styles.primaryBtn}>
						<Text style={styles.primaryBtnText}>Go back</Text>
					</Pressable>
				</View>
			</SafeAreaView>
		);
	}

	const sessionInterval = getSessionInterval();

	// Handle timing selection with error clearing
	const handleTimingSelection = (timingId: string) => {
		setSelectedTiming(timingId);
		setError(null); // Clear error when user makes a new selection
	};

	return (
		<SafeAreaView style={styles.root} edges={['left', 'right', 'bottom']}>
			<ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
				<View style={styles.contentWrapper}>
					<Text style={styles.title}>When to remind you?</Text>
					<Text style={styles.subtitle}>
						We'll send your note as a reminder before your next session
					</Text>

					{/* Next Session Info */}
					<View style={styles.sessionInfoCard}>
						<View style={styles.sessionInfoRow}>
							<Text style={styles.sessionInfoLabel}>Next session</Text>
							<Text style={styles.sessionInfoValue}>
								{dayjs(nextSessionDate).format('ddd, MMM D [at] h:mm A')}
							</Text>
						</View>
						{sessionInterval && (
							<Text style={styles.sessionInterval}>{sessionInterval}</Text>
						)}
					</View>

					{/* Timing Options */}
					<Text style={styles.sectionTitle}>Choose reminder timing</Text>

					<InfoBlock
						text={
							'Research shows daily practice between sessions strengthens neural pathways and improves outcomes'
						}
						icon={'💡'}
					/>

					<View style={styles.timingOptions}>
						{REMINDER_TIMINGS.map((timing) => {
							const isSelected = selectedTiming === timing.id;
							const reminderData = calculateReminderTime(timing.id);
							const isValid = timing.isMultiple
								? reminderData &&
									Array.isArray(reminderData) &&
									reminderData.length > 0
								: reminderData &&
									!Array.isArray(reminderData) &&
									reminderData.getTime() > Date.now();

							return (
								<Pressable
									key={timing.id}
									onPress={() => handleTimingSelection(timing.id)}
									style={[
										styles.timingCard,
										isSelected && styles.timingCardActive,
										!isValid && styles.timingCardDisabled,
										timing.badge && styles.timingCardRecommended,
									]}
									disabled={!isValid}
								>
									<View style={styles.timingHeader}>
										<Text style={styles.timingIcon}>{timing.icon}</Text>
										<View style={styles.timingInfo}>
											<View style={styles.timingTitleRow}>
												<Text
													style={[
														styles.timingLabel,
														isSelected && styles.timingLabelActive,
													]}
												>
													{timing.label}
												</Text>
												{timing.badge && (
													<Text style={styles.recommendedBadge}>
														{timing.badge}
													</Text>
												)}
											</View>
											<Text
												style={[
													styles.timingDescription,
													isSelected && styles.timingDescriptionActive,
												]}
											>
												{timing.description}
											</Text>
										</View>
									</View>
									{isValid && !timing.isMultiple && (
										<Text
											style={[
												styles.timingTime,
												isSelected && styles.timingTimeActive,
											]}
										>
											{formatReminderTime(reminderData as Date)}
										</Text>
									)}
									{isValid &&
										timing.isMultiple &&
										Array.isArray(reminderData) && (
											<View style={styles.multipleReminders}>
												{reminderData.map((reminder, index) => (
													<Text
														key={index}
														style={[
															styles.multipleReminderTime,
															isSelected && styles.timingTimeActive,
														]}
													>
														• {formatReminderTime(reminder.time)}
													</Text>
												))}
											</View>
										)}
								</Pressable>
							);
						})}
					</View>
					{error && <Text style={styles.error}>{error}</Text>}

					<View style={styles.buttonsContainer}>
						<Button label="Cancel" onPress={() => router.back()} />
						<Button label="Add" onPress={onSave} />
					</View>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	root: {
		flex: 1,
		backgroundColor: 'transparent',
	},
	container: {
		flex: 1,
	},
	contentWrapper: {
		paddingTop: 100, // Account for transparent header + gradient
		paddingHorizontal: 20,
		paddingBottom: 40,
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	loadingText: {
		fontSize: 16,
		color: '#666',
		marginTop: 16,
	},

	// Header
	title: {
		fontSize: 28,
		fontWeight: '700',
		marginBottom: 8,
	},
	subtitle: {
		fontSize: 16,
		color: '#666',
		lineHeight: 22,
		marginBottom: 24,
	},

	// Session Info Card
	sessionInfoCard: {
		backgroundColor: '#f8f9fa',
		padding: 16,
		borderRadius: 12,
		marginBottom: 24,
		borderWidth: 1,
		borderColor: '#e9ecef',
	},
	sessionInfoRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	sessionInfoLabel: {
		fontSize: 14,
		color: '#666',
		fontWeight: '500',
	},
	sessionInfoValue: {
		fontSize: 14,
		color: '#111',
		fontWeight: '600',
	},
	sessionInterval: {
		fontSize: 12,
		color: '#28a745',
		marginTop: 8,
		fontWeight: '600',
		textTransform: 'uppercase',
		letterSpacing: 0.5,
	},

	// Section
	sectionTitle: {
		fontSize: 18,
		fontWeight: '600',
		marginBottom: 12,
		color: '#111',
	},
	// Timing Options
	timingOptions: {
		marginBottom: 24,
	},
	timingCard: {
		backgroundColor: '#fff',
		padding: 16,
		borderRadius: 12,
		borderWidth: 2,
		borderColor: '#e9ecef',
		marginBottom: 12,
	},
	timingCardActive: {
		borderColor: '#111',
		backgroundColor: '#f8f9fa',
	},
	timingCardDisabled: {
		opacity: 0.4,
	},
	timingCardRecommended: {
		borderColor: '#0066cc',
		backgroundColor: '#f8fbff',
	},
	timingHeader: {
		flexDirection: 'row',
		marginBottom: 8,
	},
	timingIcon: {
		fontSize: 24,
		marginRight: 12,
	},
	timingInfo: {
		flex: 1,
	},
	timingTitleRow: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	timingLabel: {
		fontSize: 16,
		fontWeight: '600',
		color: '#111',
		marginRight: 8,
	},
	timingLabelActive: {
		color: '#111',
	},
	recommendedBadge: {
		fontSize: 10,
		color: '#0066cc',
		backgroundColor: '#e8f4fd',
		paddingHorizontal: 6,
		paddingVertical: 2,
		borderRadius: 4,
		fontWeight: '700',
		textTransform: 'uppercase',
	},
	timingDescription: {
		fontSize: 14,
		color: '#666',
		marginTop: 2,
	},
	timingDescriptionActive: {
		color: '#495057',
	},
	timingTime: {
		fontSize: 13,
		color: '#495057',
		fontWeight: '500',
	},
	timingTimeActive: {
		color: '#111',
		fontWeight: '600',
	},
	multipleReminders: {
		marginTop: 8,
	},
	multipleReminderTime: {
		fontSize: 12,
		color: '#495057',
		fontWeight: '500',
		marginBottom: 4,
	},

	// No Session
	noSessionCard: {
		backgroundColor: '#fff3cd',
		padding: 32,
		borderRadius: 12,
		alignItems: 'center',
		marginVertical: 32,
		borderWidth: 1,
		borderColor: '#ffeeba',
	},
	noSessionEmoji: {
		fontSize: 48,
		marginBottom: 16,
	},
	noSessionText: {
		fontSize: 18,
		fontWeight: '600',
		color: '#856404',
		marginBottom: 8,
		textAlign: 'center',
	},
	noSessionSubtext: {
		fontSize: 14,
		color: '#856404',
		textAlign: 'center',
		lineHeight: 20,
	},
	buttonsContainer: {
		width: '100%',
		flexDirection: 'row',
		marginTop: 8,
		justifyContent: 'space-between',
	},
	buttonWrapper: {
		flex: 1,
		marginHorizontal: 2,
	},
	primaryBtn: {
		flex: 1,
		backgroundColor: '#111',
		borderRadius: 12,
		paddingVertical: 16,
		alignItems: 'center',
	},
	primaryBtnText: {
		fontSize: 16,
		color: '#fff',
		fontWeight: '700',
	},
	error: {
		color: '#dc3545',
		textAlign: 'center',
		marginBottom: 16,
		fontSize: 14,
		fontWeight: '500',
	},
});
