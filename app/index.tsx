import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MessageScreen() {
	const [text, setText] = useState('');
	const [messages, setMessages] = useState<string[]>([]);
	const [error, setError] = useState<string | null>(null);

	function addMessage() {
		const value = text.trim();
		if (!value) {
			setError('Please enter a message');
			return;
		}
		setError(null);
		setMessages((prev) => [value, ...prev]);
		setText('');
	}

	return (
		<SafeAreaView style={{ flex: 1 }}>
			<View style={{ padding: 16, gap: 12 }}>
				<Text style={{ fontSize: 22, fontWeight: '700' }}>Add a Message</Text>

				<TextInput
					placeholder="Type your message"
					value={text}
					onChangeText={setText}
					style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12 }}
				/>

				{error ? <Text style={{ color: 'red' }}>{error}</Text> : null}

				<Pressable
					onPress={addMessage}
					style={{
						backgroundColor: '#111',
						borderRadius: 8,
						paddingVertical: 10,
						alignItems: 'center',
					}}
				>
					<Text style={{ color: '#fff', fontWeight: '600' }}>Add</Text>
				</Pressable>

				<Text style={{ marginTop: 8, fontWeight: '700' }}>Messages:</Text>
				<FlatList
					data={messages}
					keyExtractor={(item, idx) => `${item}-${idx}`}
					renderItem={({ item }) => <Text style={{ paddingVertical: 8 }}>• {item}</Text>}
					ItemSeparatorComponent={() => (
						<View style={{ height: 1, backgroundColor: '#eee' }} />
					)}
				/>
			</View>
		</SafeAreaView>
	);
}
