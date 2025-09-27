import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import dayjs from 'dayjs';

// todo: craete test suite. Must add the fact that someone wil sign up on a random date that is lets say two days before
// but then have a session every week
// Creates three spaced reminders based on therapy session timing
function createSpacedTherapyReminders(now: Date, nextSession: Date) {
	const sessionTime = dayjs(nextSession);
	const sessionHour = sessionTime.hour();
	const sessionMinute = sessionTime.minute();

	const daysUntilSession = sessionTime.diff(dayjs(now), 'day');
	const midpointDays = Math.floor(daysUntilSession / 2);

	const reminderConfigs = [
		{
			time: dayjs(now)
				.add(1, 'day')
				.hour(sessionHour)
				.minute(sessionMinute)
				.second(0)
				.toDate(),
			message: 'Practice what you learned yesterday',
		},
		{
			time: dayjs(now)
				.add(midpointDays, 'day')
				.hour(sessionHour)
				.minute(sessionMinute)
				.second(0)
				.toDate(),
			message: 'Review your therapy insights',
		},
		{
			time: dayjs(nextSession).subtract(1, 'day').toDate(),
			message: "Prepare for tomorrow's session",
		},
	];

	return reminderConfigs;
}

interface ScienceBackedCardProps {
	isSelected: boolean;
	nextSession: Date;
	onPress: () => void;
}

export default function ScienceBackedCard({
	isSelected,
	nextSession,
	onPress,
}: ScienceBackedCardProps) {
	const now = new Date();
	const reminders = createSpacedTherapyReminders(now, nextSession);

	const formatTime = (date: Date) => {
		return dayjs(date).format('ddd, MMM D [at] h:mm A');
	};

	return (
		<Pressable
			onPress={onPress}
			style={[styles.card, isSelected && styles.cardActive, styles.cardRecommended]}
		>
			<View style={styles.header}>
				<Text style={styles.icon}>🧠</Text>
				<View style={styles.info}>
					<View style={styles.titleRow}>
						<Text style={[styles.label, isSelected && styles.labelActive]}>
							Science-based pattern
						</Text>
						<Text style={styles.badge}>RECOMMENDED</Text>
					</View>
					<Text style={[styles.description, isSelected && styles.descriptionActive]}>
						Multiple reminders for optimal neuroplasticity
					</Text>
				</View>
			</View>

			<View style={styles.reminderList}>
				{reminders.map((reminder, index) => (
					<Text
						key={index}
						style={[styles.reminderTime, isSelected && styles.reminderTimeActive]}
					>
						• {formatTime(reminder.time)}
					</Text>
				))}
			</View>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	card: {
		backgroundColor: '#fff',
		padding: 16,
		borderRadius: 12,
		borderWidth: 2,
		borderColor: '#e9ecef',
		marginBottom: 12,
	},
	cardActive: {
		borderColor: '#111',
		backgroundColor: '#f8f9fa',
	},
	cardRecommended: {
		borderColor: '#0066cc',
		backgroundColor: '#f8fbff',
	},
	header: {
		flexDirection: 'row',
		marginBottom: 8,
	},
	icon: {
		fontSize: 24,
		marginRight: 12,
	},
	info: {
		flex: 1,
	},
	titleRow: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	label: {
		fontSize: 16,
		fontWeight: '600',
		color: '#111',
		marginRight: 8,
	},
	labelActive: {
		color: '#111',
	},
	badge: {
		fontSize: 10,
		color: '#0066cc',
		backgroundColor: '#e8f4fd',
		paddingHorizontal: 6,
		paddingVertical: 2,
		borderRadius: 4,
		fontWeight: '700',
		textTransform: 'uppercase',
	},
	description: {
		fontSize: 14,
		color: '#666',
		marginTop: 2,
	},
	descriptionActive: {
		color: '#495057',
	},
	reminderList: {
		marginTop: 8,
	},
	reminderTime: {
		fontSize: 12,
		color: '#495057',
		fontWeight: '500',
		marginBottom: 4,
	},
	reminderTimeActive: {
		color: '#111',
		fontWeight: '600',
	},
});
