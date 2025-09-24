import React from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { useNotes } from '../../src/hooks/useNotes';
import { PINK_CLEAR, PINK_SOLID } from '../../src/const';
import { NoteContainer } from './components/notes';

const TOP_OVERLAY = 48; // visual fade height at top
const BOTTOM_FADE = 96; // fade height at bottom (mask)

export default function NotesScreen() {
	const { notes, loading, refresh } = useNotes();
	const headerHeight = useHeaderHeight();

	// Only a BOTTOM fade in the mask (no top fade)
	const nominal = 600;
	const bottomStart = Math.max(0, 1 - BOTTOM_FADE / nominal);

	return (
		<SafeAreaView style={styles.root} edges={['left', 'right', 'bottom']}>
			<View style={{ flex: 1 }}>
				<MaskedView
					style={{ flex: 1 }}
					maskElement={
						<LinearGradient
							colors={['#000', '#000', '#0000']} // opaque → opaque → transparent
							locations={[0, bottomStart, 1]}
							start={{ x: 0, y: 0 }}
							end={{ x: 0, y: 1 }}
							style={StyleSheet.absoluteFill}
						/>
					}
				>
					<FlatList
						data={notes}
						keyExtractor={(n) => n.id}
						contentContainerStyle={[
							styles.listContent,
							{
								paddingTop: headerHeight + 8, // ✅ only header space (no extra top fade padding)
								paddingBottom: BOTTOM_FADE + 16, // room for bottom fade
							},
						]}
						refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}
						ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
						renderItem={({ item }) => (
							<NoteContainer createdAt={item.createdAt} text={item.text} />
						)}
						ListEmptyComponent={
							<Text
								style={{
									textAlign: 'center',
									opacity: 0.6,
									marginTop: headerHeight + 24,
								}}
							>
								No notes yet.
							</Text>
						}
					/>
				</MaskedView>

				{/* Fixed pink overlay at the very top; no padding added, purely visual */}
				<LinearGradient
					pointerEvents="none"
					colors={[PINK_SOLID, PINK_CLEAR]}
					start={{ x: 0, y: 0 }}
					end={{ x: 0, y: 1 }}
					style={[styles.topOverlay, { height: headerHeight + TOP_OVERLAY }]} // sits under the transparent header
				/>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	root: { flex: 1, backgroundColor: 'transparent' },
	listContent: { paddingHorizontal: 16 },
	topOverlay: {
		position: 'absolute',
		left: 0,
		right: 0,
		top: 0,
	},
});
