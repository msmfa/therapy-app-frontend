import React, { useEffect, useState, useLayoutEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import relativeTime from 'dayjs/plugin/relativeTime';

import { useNotes } from '../../../src/hooks/useNotes';
import { useAuth } from '../../../src/auth/AuthContext';
import { InfoBlock } from '../../../src/components/infoBlock';
import { Button } from '../../../src/components/button';
import { NextSessionCard } from '../../../src/components/reminders/next-session-card';
import { getNextSession } from '../../../src/utils/sessions';
import ScienceBackedCard from '../../../src/components/reminders/science-backed-card';
import Loading from '../../../src/components/loading';
import {
	getSavedPreference,
	calculateReminderTime,
	savePreference,
	getSessionInterval,
} from '../../../src/components/reminders/utils';
import { REMINDER_TIMINGS } from '../../../src/const';

dayjs.extend(advancedFormat);
dayjs.extend(relativeTime);

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

	async function onSave() {
		if (!text || !text.trim()) {
			setError('Missing note text');
			return;
		}

		const reminderData = calculateReminderTime(
			selectedTiming,
			nextSessionDate,
			REMINDER_TIMINGS,
		);
		if (!reminderData) {
			setError('Could not calculate reminder time');
			return;
		}

		setError(null);
		try {
			if (Array.isArray(reminderData)) {
				const primaryReminder = reminderData[1] || reminderData[0];
				await addNoteWithReminder(text.trim(), primaryReminder.time);
				console.log('Multi-reminder pattern selected:', reminderData);
			} else {
				await addNoteWithReminder(text.trim(), reminderData);
			}

			if (selectedTiming !== savedPreference) {
				await savePreference(selectedTiming);
			}

			router.replace('/(tabs)/note/success');
		} catch (err) {
			setError('Failed to save reminder. Please try again.');
		}
	}

	// const handleTimingSelection = (timingId: string) => {
	// 	setSelectedTiming(timingId);
	// 	setError(null);
	// };

	if (loading) {
		return <Loading />;
	}

	if (!nextSessionDate) return null;

	const sessionInterval = getSessionInterval(nextSessionDate);
	const infoBlockText =
		'Research shows daily practice between sessions strengthens neural pathways and improves outcomes';
	const reminderText = 'When to remind you?';
	const reminderSubtext = 'Choose reminder timing';

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
							onPress={() => {
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

export const styles = StyleSheet.create({
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
