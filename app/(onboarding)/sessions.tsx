import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import TherapyCalendar from '../../src/components/therapy-calendar/therapy-calendar';
import { useTherapySessions } from '../../src/context/TherapySessionsContext';
import Loading from '../../src/components/loading';

export function SessionsScreen() {
	const router = useRouter();
	const { addSession } = useTherapySessions();
	const [isSaving, setIsSaving] = useState(false);

	const handleSave = async (sessions: { [date: string]: Date }) => {
		const sessionCount = Object.keys(sessions).length;

		// Check minimum sessions
		if (sessionCount < 4) {
			Alert.alert('Not Enough Sessions', 'Please add at least 4 therapy sessions.', [
				{ text: 'OK', style: 'default' },
			]);
			return;
		}

		setIsSaving(true);
		try {
			for (const time of Object.values(sessions)) {
				await addSession(time, 50);
			}
			router.push('/(onboarding)/reminders');
		} catch (error) {
			Alert.alert('Error', 'Failed to save sessions. Please try again.');
			console.error(error);
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.content}>
				<Text style={styles.title}>
					Tell us your therapy sessions so we can work out when to remind you
				</Text>
				<SafeAreaView>
					<TherapyCalendar onSave={handleSave} buttonAtBottom={true} />
				</SafeAreaView>
			</View>
			{isSaving && <Loading />}
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fff',
		padding: 20,
	},
	content: {
		flex: 1,
	},
	title: {
		fontWeight: 'bold',
		marginBottom: 10,
	},
});
