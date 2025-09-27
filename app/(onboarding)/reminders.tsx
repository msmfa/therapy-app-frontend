// app/(onboarding)/reminders.tsx
import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTherapySessions } from '../../src/context/TherapySessionsContext';
import ReminderOptionCard from '../../src/components/reminders/reminder-card';

enum ReminderType {
	Custom = 'custom',
	ScienceBacked = 'science-backed',
}

export function RemindersScreen() {
	const [reminderType, setReminderType] = useState<ReminderType>(ReminderType.ScienceBacked);
	const router = useRouter();
	const { sessions } = useTherapySessions();

	// Get the next upcoming session
	const nextSession = useMemo(() => {
		const now = new Date();
		const upcomingSessions = sessions
			.filter((session) => new Date(session.startsAtUtc) > now)
			.sort((a, b) => new Date(a.startsAtUtc).getTime() - new Date(b.startsAtUtc).getTime());

		return upcomingSessions.length > 0 ? new Date(upcomingSessions[0].startsAtUtc) : null;
	}, [sessions]);

	const handleNext = () => {
		// You can save the reminder preference here
		router.push('/(onboarding)/success');
	};

	return (
		<SafeAreaView style={styles.container}>
			<ScrollView style={styles.scrollContent}>
				<View style={styles.header}>
					<Text style={styles.title}>Pick Reminder Type</Text>
					<Text style={styles.subtitle}>How would you like to be reminded?</Text>
				</View>

				<View style={styles.options}>
					<ReminderOptionCard
						isSelected={reminderType === ReminderType.ScienceBacked}
						onPress={() => setReminderType(ReminderType.ScienceBacked)}
						icon="🧠"
						title="Science-based pattern"
						description="Multiple reminders for optimal neuroplasticity"
						options={[
							'Day after session - Practice while fresh',
							'Mid-week - Reinforce when memory fades',
							'Day before - Prepare for next session',
						]}
						badge="RECOMMENDED"
						recommendedStyle={true}
					/>

					<ReminderOptionCard
						isSelected={reminderType === ReminderType.Custom}
						onPress={() => setReminderType(ReminderType.Custom)}
						icon="📅"
						title="Custom schedule"
						description="Pick your own reminder times"
						options={[
							'Choose specific days and times',
							'Set one-time or recurring reminders',
							'Full flexibility over your schedule',
						]}
					/>
				</View>
			</ScrollView>

			<View style={styles.buttons}>
				<Pressable style={[styles.button, styles.backButton]} onPress={() => router.back()}>
					<Text style={styles.backButtonText}>Back</Text>
				</Pressable>
				<Pressable style={styles.button} onPress={handleNext}>
					<Text style={styles.buttonText}>Next</Text>
				</Pressable>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fff',
	},
	scrollContent: {
		flex: 1,
		padding: 20,
	},
	header: {
		marginBottom: 30,
	},
	content: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	title: {
		fontSize: 32,
		fontWeight: 'bold',
		marginBottom: 10,
	},
	subtitle: {
		fontSize: 18,
		color: '#666',
	},
	options: {
		marginBottom: 20,
	},
	buttons: {
		flexDirection: 'row',
		padding: 20,
		gap: 10,
	},
	button: {
		flex: 1,
		backgroundColor: '#007AFF',
		padding: 16,
		borderRadius: 8,
		alignItems: 'center',
	},
	backButton: {
		backgroundColor: '#f0f0f0',
	},
	buttonText: {
		color: '#fff',
		fontSize: 18,
		fontWeight: '600',
	},
	backButtonText: {
		color: '#333',
		fontSize: 18,
		fontWeight: '600',
	},
	// Custom card styles
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
	cardHeader: {
		flexDirection: 'row',
		marginBottom: 8,
	},
	cardIcon: {
		fontSize: 24,
		marginRight: 12,
	},
	cardInfo: {
		flex: 1,
	},
	cardLabel: {
		fontSize: 16,
		fontWeight: '600',
		color: '#111',
	},
	cardLabelActive: {
		color: '#111',
	},
	cardDescription: {
		fontSize: 14,
		color: '#666',
		marginTop: 2,
	},
	cardDescriptionActive: {
		color: '#495057',
	},
	customOptions: {
		marginTop: 8,
	},
	optionText: {
		fontSize: 12,
		color: '#495057',
		fontWeight: '500',
		marginBottom: 4,
	},
	optionTextActive: {
		color: '#111',
		fontWeight: '600',
	},
});
