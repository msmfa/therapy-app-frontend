import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { PINK_CLEAR, PINK_SOLID } from '../../../src/const';

const TOP_OVERLAY = 48; // visual fade height at top, same as Notes screen
// new screen
export default function NewNoteScreen() {
	const router = useRouter();
	const headerHeight = useHeaderHeight();

	const [text, setText] = useState('');
	const [error, setError] = useState<string | null>(null);

	function goNext() {
		const value = text.trim();
		if (!value) {
			setError('Please enter a message');
			return;
		}
		setError(null);
		// pass the text to the reminder picker (step 2)
		router.push({ pathname: '/(tabs)/note/reminder', params: { text: value } });
	}

	return (
		<SafeAreaView style={styles.root} edges={['left', 'right', 'bottom']}>
			<View style={styles.fillCenter}>
				{/* Card-style input area matching your border + transparency */}
				<View style={[styles.card, styles.inputCentered]}>
					<TextInput
						placeholder="Thoughts?"
						value={text}
						onChangeText={setText}
						multiline
						numberOfLines={6}
						underlineColorAndroid="transparent"
						style={styles.textInput}
						placeholderTextColor="#A97C8C"
						selectionColor="#9E3D5E"
					/>
				</View>

				{error ? <Text style={styles.error}>{error}</Text> : null}

				<Pressable onPress={goNext} style={styles.primaryBtn} accessibilityRole="button">
					<Text style={styles.primaryBtnText}>Next</Text>
				</Pressable>
			</View>

			{/* Fixed pink overlay at the very top; purely visual under the transparent header */}
			<LinearGradient
				pointerEvents="none"
				colors={[PINK_SOLID, PINK_CLEAR]}
				start={{ x: 0, y: 0 }}
				end={{ x: 0, y: 1 }}
				style={[styles.topOverlay, { height: headerHeight + TOP_OVERLAY }]}
			/>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	// keep the same root/background approach as your Notes screen
	root: { flex: 1, backgroundColor: 'transparent' },

	// centers the content similarly to your previous new-note layout
	fillCenter: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 16,
		gap: 12,
	},

	// reuse your card look (border + transparent bg)
	card: {
		padding: 12,
		borderRadius: 10,
		backgroundColor: 'transparent',
		borderWidth: 1,
		borderColor: '#E9BFCB',
	},

	inputCentered: { width: '90%', maxWidth: 560 },

	// text input area — top-aligned placeholder/content
	textInput: {
		minHeight: 140,
		paddingTop: 12,
		paddingBottom: 12,
		paddingHorizontal: 0, // padding handled by card
		fontSize: 16,
		lineHeight: 22,
		textAlignVertical: 'top',
	},

	error: { color: 'red', textAlign: 'center' },

	// keep button styling consistent with prior screens you shared
	primaryBtn: {
		backgroundColor: '#111',
		borderRadius: 8,
		paddingVertical: 12,
		paddingHorizontal: 16,
	},
	primaryBtnText: { color: '#fff', fontWeight: '700' },

	// same overlay key as Notes screen
	topOverlay: {
		position: 'absolute',
		left: 0,
		right: 0,
		top: 0,
	},
});
