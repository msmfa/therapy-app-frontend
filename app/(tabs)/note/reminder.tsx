// app/(tabs)/note/reminder.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useNotes } from '../../../src/hooks/useNotes';
import { useAuth } from '../../../src/auth/AuthContext';
import { listTherapySessions, TherapySession } from '../../../src/api/therapy';

// fetch earliest session > now (6-month window)
async function getNextSession(token: string): Promise<Date | null> {
	const now = new Date();
	const to = new Date(now.getFullYear(), now.getMonth() + 6, now.getDate());
	try {
		const data = (await listTherapySessions(token, now, to)) as TherapySession[];
		const d = data
			.map((s) => new Date(s.startsAtUtc))
			.filter((x) => x.getTime() > Date.now())
			.sort((a, b) => a.getTime() - b.getTime())[0];
		return d ?? null;
	} catch {
		return null;
	}
}

export default function ReminderScreen() {
	const router = useRouter();
	const { text, nextSession } = useLocalSearchParams<{ text?: string; nextSession?: string }>();
	const { addNoteWithReminder } = useNotes();
	const { token } = useAuth();

	const minDate = useMemo(() => new Date(Date.now() + 60 * 1000), []);
	const [maxDate, setMaxDate] = useState<Date>(
		nextSession ? new Date(nextSession) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
	);

	useEffect(() => {
		let alive = true;
		if (nextSession) {
			setMaxDate(new Date(nextSession));
			return;
		}
		(async () => {
			if (!token) return;
			const d = await getNextSession(token);
			if (alive && d) setMaxDate(d);
		})();
		return () => {
			alive = false;
		};
	}, [token, nextSession]);

	const [when, setWhen] = useState<Date | null>(null);
	const [show, setShow] = useState(true);
	const [error, setError] = useState<string | null>(null);

	async function onSave() {
		if (!text || !text.trim()) return setError('Missing note text');
		if (!when) return setError('Pick a date and time');
		if (when.getTime() <= Date.now()) return setError('Reminder must be in the future');
		if (maxDate && when > maxDate) return setError('Pick a time before your next session');

		setError(null);
		await addNoteWithReminder(text.trim(), when);
		router.replace('/(tabs)/note/success');
	}

	return (
		<SafeAreaView style={styles.root}>
			<View style={styles.container}>
				<Text style={styles.title}>Pick a reminder time</Text>
				<Text style={styles.caption}>From today until {maxDate.toLocaleDateString()}</Text>

				{show && (
					<DateTimePicker
						value={when ?? minDate}
						mode="datetime"
						display={Platform.OS === 'ios' ? 'inline' : 'default'}
						minimumDate={minDate}
						maximumDate={maxDate}
						onChange={(_, d) => {
							if (Platform.OS !== 'ios') setShow(false);
							if (d) setWhen(d);
						}}
					/>
				)}

				{error ? <Text style={styles.error}>{error}</Text> : null}

				<View style={styles.row}>
					<Pressable onPress={onSave} style={styles.primaryBtn}>
						<Text style={styles.primaryBtnText}>Save reminder</Text>
					</Pressable>
				</View>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	root: { flex: 1, backgroundColor: 'transparent' },
	container: { flex: 1, padding: 16, gap: 12, alignItems: 'center', justifyContent: 'center' },
	title: { fontSize: 22, fontWeight: '700' },
	caption: { color: '#666' },
	row: { flexDirection: 'row', gap: 12, marginTop: 8 },
	secondaryBtn: {
		paddingVertical: 10,
		paddingHorizontal: 12,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: '#E9BFCB',
		backgroundColor: 'rgba(255,255,255,0.9)',
	},
	secondaryBtnText: { color: '#111' },
	primaryBtn: {
		backgroundColor: '#111',
		borderRadius: 8,
		paddingVertical: 12,
		paddingHorizontal: 16,
	},
	primaryBtnText: { color: '#fff', fontWeight: '700' },
	error: { color: 'red', textAlign: 'center' },
});
