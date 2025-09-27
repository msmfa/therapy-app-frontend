import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

export interface ReminderTiming {
	id: string;
	label: string;
	description: string;
	icon: string;
	badge?: string;
	isMultiple?: boolean;
	calculate: (now: Date, next: Date) => Date | Array<{ time: Date; message: string }>;
}

interface TimingCardProps {
	timing: ReminderTiming;
	isSelected: boolean;
	isValid: boolean;
	reminderData: Date | Array<{ time: Date; message: string }> | null;
	onPress: () => void;
	formatReminderTime: (date: Date | null) => string;
}

export const TimingCard: React.FC<TimingCardProps> = ({
	timing,
	isSelected,
	isValid,
	reminderData,
	onPress,
	formatReminderTime,
}) => {
	return (
		<Pressable
			onPress={onPress}
			style={[
				styles.timingCard,
				isSelected && styles.timingCardActive,
				!isValid && styles.timingCardDisabled,
				timing.badge && styles.timingCardRecommended,
			]}
			disabled={!isValid}
		>
			<View style={styles.timingHeader}>
				<Text style={styles.timingIcon}>{timing.icon}</Text>
				<View style={styles.timingInfo}>
					<View style={styles.timingTitleRow}>
						<Text style={[styles.timingLabel, isSelected && styles.timingLabelActive]}>
							{timing.label}
						</Text>
						{timing.badge && (
							<Text style={styles.recommendedBadge}>{timing.badge}</Text>
						)}
					</View>
					<Text
						style={[
							styles.timingDescription,
							isSelected && styles.timingDescriptionActive,
						]}
					>
						{timing.description}
					</Text>
				</View>
			</View>

			{isValid && !timing.isMultiple && reminderData && !Array.isArray(reminderData) && (
				<Text style={[styles.timingTime, isSelected && styles.timingTimeActive]}>
					{formatReminderTime(reminderData)}
				</Text>
			)}

			{isValid && timing.isMultiple && Array.isArray(reminderData) && (
				<View style={styles.multipleReminders}>
					{reminderData.map((reminder, index) => (
						<Text
							key={index}
							style={[
								styles.multipleReminderTime,
								isSelected && styles.timingTimeActive,
							]}
						>
							• {formatReminderTime(reminder.time)}
						</Text>
					))}
				</View>
			)}
		</Pressable>
	);
};

interface TimingOptionsProps {
	timings: ReminderTiming[];
	selectedTiming: string;
	onTimingSelect: (timingId: string) => void;
	calculateReminderTime: (
		timingId: string,
	) => Date | Array<{ time: Date; message: string }> | null;
	formatReminderTime: (date: Date | null) => string;
}

export const TimingOptions: React.FC<TimingOptionsProps> = ({
	timings,
	selectedTiming,
	onTimingSelect,
	calculateReminderTime,
	formatReminderTime,
}) => {
	return (
		<View style={styles.timingOptions}>
			{timings.map((timing) => {
				const isSelected = selectedTiming === timing.id;
				const reminderData = calculateReminderTime(timing.id);
				const isValid = timing.isMultiple
					? reminderData && Array.isArray(reminderData) && reminderData.length > 0
					: reminderData &&
						!Array.isArray(reminderData) &&
						reminderData.getTime() > Date.now();

				return (
					<TimingCard
						key={timing.id}
						timing={timing}
						isSelected={isSelected}
						isValid={!!isValid}
						reminderData={reminderData}
						onPress={() => onTimingSelect(timing.id)}
						formatReminderTime={formatReminderTime}
					/>
				);
			})}
		</View>
	);
};

const styles = StyleSheet.create({
	timingOptions: {
		marginBottom: 24,
	},
	timingCard: {
		backgroundColor: '#fff',
		padding: 16,
		borderRadius: 12,
		borderWidth: 2,
		borderColor: '#e9ecef',
		marginBottom: 12,
	},
	timingCardActive: {
		borderColor: '#111',
		backgroundColor: '#f8f9fa',
	},
	timingCardDisabled: {
		opacity: 0.4,
	},
	timingCardRecommended: {
		borderColor: '#0066cc',
		backgroundColor: '#f8fbff',
	},
	timingHeader: {
		flexDirection: 'row',
		marginBottom: 8,
	},
	timingIcon: {
		fontSize: 24,
		marginRight: 12,
	},
	timingInfo: {
		flex: 1,
	},
	timingTitleRow: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	timingLabel: {
		fontSize: 16,
		fontWeight: '600',
		color: '#111',
		marginRight: 8,
	},
	timingLabelActive: {
		color: '#111',
	},
	recommendedBadge: {
		fontSize: 10,
		color: '#0066cc',
		backgroundColor: '#e8f4fd',
		paddingHorizontal: 6,
		paddingVertical: 2,
		borderRadius: 4,
		fontWeight: '700',
		textTransform: 'uppercase',
	},
	timingDescription: {
		fontSize: 14,
		color: '#666',
		marginTop: 2,
	},
	timingDescriptionActive: {
		color: '#495057',
	},
	timingTime: {
		fontSize: 13,
		color: '#495057',
		fontWeight: '500',
	},
	timingTimeActive: {
		color: '#111',
		fontWeight: '600',
	},
	multipleReminders: {
		marginTop: 8,
	},
	multipleReminderTime: {
		fontSize: 12,
		color: '#495057',
		fontWeight: '500',
		marginBottom: 4,
	},
});
