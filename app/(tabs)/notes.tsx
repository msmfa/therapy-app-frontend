import React from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { useNotes } from '../../src/hooks/useNotes';
import { useRouter } from 'expo-router';

const BOTTOM_FADE = 96; // fade height at bottom (mask)

// Color palette from reminder screen
const colors = {
	// Backgrounds
	cardBg: '#ffffff',
	cardBgAlt: '#f8f9fa',
	scienceBg: '#e8f4fd',
	previewBg: '#e7f3ff',
	warningBg: '#fff3cd',

	// Borders
	cardBorder: '#e9ecef',
	activeBorder: '#111',
	blueBorder: '#bee5eb',
	warningBorder: '#ffeeba',

	// Text
	primaryText: '#111',
	secondaryText: '#666',
	mutedText: '#6c757d',
	darkGrayText: '#495057',
	blueText: '#0066cc',
	darkBlueText: '#004085',
	warningText: '#856404',
	successText: '#28a745',

	// Buttons
	primaryBtn: '#111',
	secondaryBorder: '#dee2e6',
};

export default function NotesScreen() {
	const { notes, loading, refresh } = useNotes();
	const headerHeight = useHeaderHeight();
	const router = useRouter();

	// Only a BOTTOM fade in the mask (no top fade)
	const nominal = 600;
	const bottomStart = Math.max(0, 1 - BOTTOM_FADE / nominal);

	const EmptyState = () => (
		<View style={styles.emptyContainer}>
			<View style={styles.emptyCard}>
				<Text style={styles.emptyEmoji}>📝</Text>
				<Text style={styles.emptyTitle}>No therapy notes yet</Text>
				<Text style={styles.emptySubtext}>
					Start capturing insights from your sessions to track your journey
				</Text>
			</View>

			<View style={styles.tipCard}>
				<Text style={styles.tipIcon}>💡</Text>
				<View style={styles.tipContent}>
					<Text style={styles.tipTitle}>Pro tip</Text>
					<Text style={styles.tipText}>
						Add notes right after your therapy session while insights are fresh
					</Text>
				</View>
			</View>

			<Pressable style={styles.createButton} onPress={() => router.push('/(tabs)/note/new')}>
				<Text style={styles.createButtonText}>Create your first note</Text>
			</Pressable>
		</View>
	);

	// Enhanced Note Container with new styling
	const EnhancedNoteContainer = ({ item, index }: { item: any; index: number }) => (
		<Pressable
			style={({ pressed }) => [
				styles.noteCard,
				pressed && styles.noteCardPressed,
				index === 0 && styles.firstCard,
			]}
		>
			<View style={styles.noteHeader}>
				<Text style={styles.noteDate}>
					{new Date(item.createdAt).toLocaleDateString('en-US', {
						weekday: 'short',
						month: 'short',
						day: 'numeric',
						year: 'numeric',
					})}
				</Text>
				{index === 0 && (
					<View style={styles.latestBadge}>
						<Text style={styles.latestBadgeText}>LATEST</Text>
					</View>
				)}
			</View>
			<Text style={styles.noteText} numberOfLines={3}>
				{item.text}
			</Text>
			<View style={styles.noteFooter}>
				<Text style={styles.noteTime}>
					{new Date(item.createdAt).toLocaleTimeString('en-US', {
						hour: 'numeric',
						minute: '2-digit',
					})}
				</Text>
				{item.hasReminder && (
					<View style={styles.reminderIndicator}>
						<Text style={styles.reminderIcon}>🔔</Text>
						<Text style={styles.reminderText}>Reminder set</Text>
					</View>
				)}
			</View>
		</Pressable>
	);

	return (
		<SafeAreaView style={styles.root} edges={['left', 'right', 'bottom']}>
			<View style={{ flex: 1 }}>
				<MaskedView
					style={{ flex: 1 }}
					maskElement={
						<LinearGradient
							colors={['#000', '#000', '#0000']}
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
								paddingTop: headerHeight + 20,
								paddingBottom: BOTTOM_FADE + 16,
							},
						]}
						refreshControl={
							<RefreshControl
								refreshing={loading}
								onRefresh={refresh}
								tintColor={colors.primaryText}
								colors={[colors.primaryText]}
							/>
						}
						ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
						renderItem={({ item, index }) => (
							<EnhancedNoteContainer item={item} index={index} />
						)}
						ListEmptyComponent={<EmptyState />}
						ListHeaderComponent={
							notes.length > 0 ? (
								<View style={styles.listHeader}>
									<Text style={styles.listTitle}>Your therapy journey</Text>
									<Text style={styles.listSubtitle}>
										{notes.length} {notes.length === 1 ? 'note' : 'notes'}{' '}
										captured
									</Text>
								</View>
							) : null
						}
					/>
				</MaskedView>

				{notes.length > 0 && (
					<Pressable style={styles.fab} onPress={() => router.push('/(tabs)/note/new')}>
						<Text style={styles.fabText}>+</Text>
					</Pressable>
				)}
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	root: {
		flex: 1,
		backgroundColor: 'transparent',
	},
	listContent: {
		paddingHorizontal: 16,
	},
	topOverlay: {
		position: 'absolute',
		left: 0,
		right: 0,
		top: 0,
	},

	// List Header
	listHeader: {
		marginBottom: 20,
	},
	listTitle: {
		fontSize: 28,
		fontWeight: '700',
		color: colors.primaryText,
		marginBottom: 4,
	},
	listSubtitle: {
		fontSize: 14,
		color: colors.secondaryText,
	},

	// Note Card
	noteCard: {
		backgroundColor: colors.cardBg,
		padding: 16,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: colors.cardBorder,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: 3,
		elevation: 2,
	},
	noteCardPressed: {
		backgroundColor: colors.cardBgAlt,
		transform: [{ scale: 0.98 }],
	},
	firstCard: {
		borderColor: colors.blueBorder,
		backgroundColor: colors.previewBg,
	},
	noteHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 8,
	},
	noteDate: {
		fontSize: 13,
		fontWeight: '600',
		color: colors.mutedText,
		textTransform: 'uppercase',
		letterSpacing: 0.5,
	},
	latestBadge: {
		backgroundColor: colors.scienceBg,
		paddingHorizontal: 8,
		paddingVertical: 3,
		borderRadius: 4,
	},
	latestBadgeText: {
		fontSize: 10,
		fontWeight: '700',
		color: colors.blueText,
		letterSpacing: 0.5,
	},
	noteText: {
		fontSize: 15,
		lineHeight: 22,
		color: colors.darkGrayText,
		marginBottom: 12,
	},
	noteFooter: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	noteTime: {
		fontSize: 12,
		color: colors.mutedText,
	},
	reminderIndicator: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
		backgroundColor: colors.cardBgAlt,
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 6,
	},
	reminderIcon: {
		fontSize: 12,
	},
	reminderText: {
		fontSize: 11,
		color: colors.successText,
		fontWeight: '600',
	},

	// Empty State
	emptyContainer: {
		paddingTop: 60,
		paddingHorizontal: 20,
		alignItems: 'center',
	},
	emptyCard: {
		backgroundColor: colors.warningBg,
		padding: 32,
		borderRadius: 12,
		alignItems: 'center',
		borderWidth: 1,
		borderColor: colors.warningBorder,
		marginBottom: 24,
		width: '100%',
	},
	emptyEmoji: {
		fontSize: 48,
		marginBottom: 16,
	},
	emptyTitle: {
		fontSize: 18,
		fontWeight: '600',
		color: colors.warningText,
		marginBottom: 8,
		textAlign: 'center',
	},
	emptySubtext: {
		fontSize: 14,
		color: colors.warningText,
		textAlign: 'center',
		lineHeight: 20,
		opacity: 0.9,
	},

	// Tip Card
	tipCard: {
		flexDirection: 'row',
		backgroundColor: colors.scienceBg,
		padding: 14,
		borderRadius: 10,
		marginBottom: 24,
		alignItems: 'center',
		gap: 12,
		width: '100%',
	},
	tipIcon: {
		fontSize: 20,
	},
	tipContent: {
		flex: 1,
	},
	tipTitle: {
		fontSize: 12,
		fontWeight: '700',
		color: colors.blueText,
		textTransform: 'uppercase',
		letterSpacing: 0.5,
		marginBottom: 2,
	},
	tipText: {
		fontSize: 13,
		color: colors.darkBlueText,
		lineHeight: 18,
	},

	// Create Button
	createButton: {
		backgroundColor: colors.primaryBtn,
		paddingVertical: 16,
		paddingHorizontal: 32,
		borderRadius: 12,
		alignItems: 'center',
	},
	createButtonText: {
		fontSize: 16,
		fontWeight: '700',
		color: '#fff',
	},

	// Floating Action Button
	fab: {
		position: 'absolute',
		bottom: 24,
		right: 24,
		width: 56,
		height: 56,
		borderRadius: 28,
		backgroundColor: colors.primaryBtn,
		justifyContent: 'center',
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 8,
		elevation: 8,
	},
	fabText: {
		fontSize: 32,
		color: '#fff',
		fontWeight: '300',
		marginTop: -2,
	},
});
