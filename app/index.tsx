import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNotes } from '../src/hooks/useNotes'; // ← your hook

export default function MessageScreen() {
	const [text, setText] = useState('');
	const [error, setError] = useState<string | null>(null);
	const { addNote } = useNotes(); // persistence handled by the hook

	async function addMessage() {
		const value = text.trim();
		if (!value) {
			setError('Please enter a message');
			return;
		}
		setError(null);
		await addNote(value);
		setText('');
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
				/>
				{error ? <Text style={styles.error}>{error}</Text> : null}

				<Pressable
					onPress={addMessage}
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
	container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16, gap: 12 },
	inputCentered: { width: '90%', maxWidth: 560 },
	input: { borderWidth: 2, borderRadius: 8, paddingHorizontal: 12, borderColor: '#E9BFCB' },
	textArea: {
		minHeight: 140,
		paddingTop: 12,
		paddingBottom: 12,
		fontSize: 16,
		textAlignVertical: 'top',
	},
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
