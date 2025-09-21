import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function MessageScreen() {
	const [text, setText] = useState('');
	const [error, setError] = useState<string | null>(null);

	function addMessage() {
		const value = text.trim();
		if (!value) {
			setError('Please enter a message');
			return;
		}
		setError(null);
		setText('');
	}

	return (
		<SafeAreaView style={styles.root}>
			<View style={styles.container}>
				<TextInput
					placeholder="What do you need to think and between now and your next session?"
					value={text}
					onChangeText={setText}
					multiline
					numberOfLines={6}
					style={[styles.input, styles.textArea, styles.inputCentered]}
				/>

				{error ? <Text style={styles.error}>{error}</Text> : null}

				<Pressable
					onPress={addMessage}
					style={styles.button}
					accessibilityRole="button"
					accessibilityLabel="Add note"
					hitSlop={12}
				>
					<Ionicons name="add" size={28} color="#fff" />
				</Pressable>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	root: { flex: 1, backgroundColor: 'transparent' },
	container: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 16,
		gap: 12,
	},
	inputCentered: { width: '90%', maxWidth: 560 },
	title: { fontSize: 22, fontWeight: '700' },
	input: {
		borderWidth: 1,
		borderColor: '#E9BFCB',
		borderRadius: 16,
		paddingHorizontal: 12,
	},
	textArea: {
		minHeight: 200,
		paddingTop: 12,
		paddingBottom: 44,
		fontSize: 16,
		textAlignVertical: 'top',
	},
	error: { color: 'green' },
	primaryBtn: {
		backgroundColor: '#111',
		borderRadius: 8,
		paddingVertical: 10,
		alignItems: 'center',
	},
	primaryBtnText: { color: '#fff', fontWeight: '600' },
	sectionTitle: { marginTop: 8, fontWeight: '700' },
	listItem: { paddingVertical: 8 },
	separator: { height: 1, backgroundColor: '#eee' },
	button: {
		width: 56,
		height: 56,
		borderRadius: 28,
		backgroundColor: '#111',
		alignItems: 'center',
		justifyContent: 'center',
		shadowColor: '#E9BFCB',
		shadowOpacity: 0.78,
		shadowRadius: 10,
		shadowOffset: { width: 0, height: 3 },
		elevation: 4,
	},
});
