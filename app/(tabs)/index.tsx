// app/index.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNotes } from '../../src/hooks/useNotes';

export default function NewNoteScreen() {
	const { addNoteWithReminder } = useNotes();
	const [text, setText] = useState('');
	const [when, setWhen] = useState<Date | undefined>(undefined);
	const [showPicker, setShowPicker] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function onAdd() {
		const value = text.trim();
		if (!value) {
			setError('Please enter a message');
			return;
		}
		if (when && when.getTime() <= Date.now()) {
			setError('Reminder must be in the future');
			return;
		}
		setError(null);
		await addNoteWithReminder(value, when);
		setText('');
		setWhen(undefined);
	}

	return (
		<SafeAreaView style={styles.root}>
			<View style={styles.container}>
				<TextInput
					placeholder="What do you need to think about before your next session?"
					value={text}
					onChangeText={setText}
					multiline
					numberOfLines={6}
					underlineColorAndroid="transparent"
					style={[styles.input, styles.textArea, styles.inputCentered]}
					placeholderTextColor="#A97C8C"
					selectionColor="#9E3D5E"
				/>

				<View style={styles.row}>
					<Pressable style={styles.secondaryBtn} onPress={() => setShowPicker(true)}>
						<Text style={styles.secondaryBtnText}>
							{when ? when.toLocaleString() : 'Set reminder time'}
						</Text>
					</Pressable>
					{when && (
						<Pressable
							style={[styles.secondaryBtn, { marginLeft: 8 }]}
							onPress={() => setWhen(undefined)}
						>
							<Text style={styles.secondaryBtnText}>Clear</Text>
						</Pressable>
					)}
				</View>

				{showPicker && (
					<DateTimePicker
						value={when ?? new Date(Date.now() + 5 * 60 * 1000)}
						mode="datetime"
						display={Platform.OS === 'ios' ? 'inline' : 'default'}
						minimumDate={new Date(Date.now() + 60 * 1000)}
						onChange={(_, d) => {
							// On Android, picker closes after a selection; on iOS 'inline' stays rendered
							if (Platform.OS !== 'ios') setShowPicker(false);
							if (d) setWhen(d);
						}}
					/>
				)}

				{error ? <Text style={styles.error}>{error}</Text> : null}

				<Pressable
					onPress={onAdd}
					style={styles.fab}
					accessibilityRole="button"
					accessibilityLabel="Add note"
					hitSlop={12}
				>
					<Text style={{ color: '#fff', fontSize: 20, fontWeight: '700' }}>＋</Text>
				</Pressable>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	root: { flex: 1, backgroundColor: 'transparent' },
	container: {
		flex: 1,
		justifyContent: 'center', // vertical center
		alignItems: 'center', // horizontal center
		padding: 16,
		gap: 12,
	},
	inputCentered: { width: '90%', maxWidth: 560 },
	input: {
		borderWidth: 2,
		borderRadius: 8,
		paddingHorizontal: 12,
		borderColor: '#9E3D5E', // darker pink outline
		backgroundColor: 'rgba(255,255,255,0.9)',
	},
	textArea: {
		minHeight: 140,
		paddingTop: 12,
		paddingBottom: 12,
		fontSize: 16,
		textAlignVertical: 'top',
	},
	row: { flexDirection: 'row', alignItems: 'center' },
	secondaryBtn: {
		paddingVertical: 10,
		paddingHorizontal: 12,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: '#E9BFCB',
		backgroundColor: 'rgba(255,255,255,0.9)',
	},
	secondaryBtnText: { color: '#111' },
	error: { color: 'red', textAlign: 'center' },
	fab: {
		width: 56,
		height: 56,
		borderRadius: 28,
		backgroundColor: '#111',
		alignItems: 'center',
		justifyContent: 'center',
		shadowColor: '#000',
		shadowOpacity: 0.18,
		shadowRadius: 6,
		shadowOffset: { width: 0, height: 3 },
		elevation: 4,
	},
});
