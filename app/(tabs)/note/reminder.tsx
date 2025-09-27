// app/(tabs)/note/reminder.tsx
import React, { useEffect, useState, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';

import { useNotes } from '../../../src/hooks/useNotes';
import { useAuth } from '../../../src/auth/AuthContext';
import { listTherapySessions, TherapySession } from '../../../src/api/therapy';
import { InfoBlock } from '../../../src/components/infoBlock';

import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Button } from '../../../src/components/button';
import { NextSessionCard } from '../../../src/components/reminders/next-session-card';
import { TimingOptions } from '../../../src/components/reminders/timing-card';
import { getNextSession } from '../../../src/utils/sessions';
import ScienceBackedCard from '../../../src/components/reminders/science-backed-card';

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
	const { text } = useLocalSearchParams<{ text?: string }>();
	const { addNoteWithReminder } = useNotes();
	const { token } = useAuth();

	const [loading, setLoading] = useState(true);
	const [nextSessionDate, setNextSessionDate] = useState<Date | null>(null);
	const [selectedTiming, setSelectedTiming] = useState<string>('smart-pattern');
	const [savedPreference, setSavedPreference] = useState<string>('smart-pattern');
	const [error, setError] = useState<string | null>(null);

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
					getNextSession(token),
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
	}, [token]);

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
		return <View>Loading</View>;
	}

	const sessionInterval = getSessionInterval();

	const handleTimingSelection = (timingId: string) => {
		setSelectedTiming(timingId);
		setError(null);
	};

	const infoBlockText =
		'Research shows daily practice between sessions strengthens neural pathways and improves outcomes';
	const reminderText = 'When to remind you?';
	const reminderSubtext = 'Choose reminder timing';

	if (!nextSessionDate) return;

	return (
		<SafeAreaView style={styles.root} edges={['left', 'right', 'bottom']}>
			<ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
				<View style={styles.contentWrapper}>
					<Text style={styles.title}>{reminderText}</Text>
					<NextSessionCard
						timestamp={dayjs(nextSessionDate).format('ddd, MMM D [at] h:mm A')}
						sessionInterval={sessionInterval}
					/>
					<Text style={styles.sectionTitle}>{reminderSubtext}</Text>
					<InfoBlock text={infoBlockText} icon={'💡'} />
					<View style={styles.timingOptions}>
						<ScienceBackedCard
							isSelected={false}
							nextSession={nextSessionDate}
							onPress={function (): void {
								throw new Error('Function not implemented.');
							}}
						/>
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
		paddingTop: 100,
		paddingHorizontal: 20,
		paddingBottom: 40,
	},
	title: {
		fontSize: 28,
		fontWeight: '700',
		marginBottom: 8,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: '600',
		marginBottom: 12,
		color: '#111',
	},
	timingOptions: {
		marginBottom: 24,
	},
	buttonsContainer: {
		width: '100%',
		flexDirection: 'row',
		marginTop: 8,
	},
	error: {
		color: '#dc3545',
		textAlign: 'center',
		marginBottom: 16,
		fontSize: 14,
		fontWeight: '500',
	},
});
