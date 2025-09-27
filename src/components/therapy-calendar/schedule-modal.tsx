import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Platform, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { InfoBlock } from '../infoBlock';

interface Session {
	id: string;
	date: string;
	time: Date;
}

type ScheduleMode = 'single' | 'weekly_pattern';

interface ScheduleModalProps {
	visible: boolean;
	selectedDate: string | null;
	existingSession: Session | null;
	defaultTime: Date;
	onConfirm: (mode: ScheduleMode, time: Date) => void;
	onDelete: () => void;
	onCancel: () => void;
}

export default function ScheduleModal({
	visible,
	selectedDate,
	existingSession,
	defaultTime,
	onConfirm,
	onDelete,
	onCancel,
}: ScheduleModalProps) {
	const [time, setTime] = useState(defaultTime);
	const [scheduleMode, setScheduleMode] = useState<ScheduleMode>('weekly_pattern');
	const [showPicker, setShowPicker] = useState(false);

	useEffect(() => {
		if (visible) {
			setTime(existingSession?.time || defaultTime);
			setScheduleMode('weekly_pattern');
		}
	}, [visible, existingSession, defaultTime]);

	const handleTimeChange = (event: any, selectedTime?: Date) => {
		if (Platform.OS === 'android') {
			setShowPicker(false);
			if (event.type === 'dismissed') return;
		}
		if (selectedTime && !isNaN(selectedTime.getTime())) {
			setTime(selectedTime);
		}
	};

	const handleConfirm = () => {
		onConfirm(scheduleMode, time);
	};

	const formatDate = (dateString: string | null) => {
		if (!dateString) return '';
		const [year, month, day] = dateString.split('-').map(Number);
		const date = new Date(year, month - 1, day);
		return date.toLocaleDateString(undefined, {
			weekday: 'long',
			month: 'long',
			day: 'numeric',
			year: 'numeric',
		});
	};

	const formatTime = (date: Date) => {
		return date.toLocaleTimeString([], {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true,
		});
	};

	const getSelectedDayName = () => {
		if (!selectedDate) return '';
		const [year, month, day] = selectedDate.split('-').map(Number);
		const date = new Date(year, month - 1, day);
		const weekDays = [
			'Sunday',
			'Monday',
			'Tuesday',
			'Wednesday',
			'Thursday',
			'Friday',
			'Saturday',
		];
		return weekDays[date.getDay()];
	};

	const isEdit = !!existingSession;

	if (!visible) return null;

	return (
		<Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
			<View style={styles.modalOverlay}>
				<TouchableOpacity
					style={styles.modalBackdrop}
					activeOpacity={1}
					onPress={onCancel}
				/>

				<View style={styles.modalContent}>
					<Text style={styles.modalTitle}>
						{isEdit ? 'Edit Session' : 'Schedule Session'}
					</Text>
					<Text style={styles.modalDate}>{formatDate(selectedDate)}</Text>

					<View style={styles.section}>
						<Text style={styles.label}>Session Time</Text>
						{Platform.OS === 'ios' ? (
							<DateTimePicker
								value={time}
								mode="time"
								display="spinner"
								onChange={handleTimeChange}
							/>
						) : (
							<>
								<TouchableOpacity
									style={styles.timeButton}
									onPress={() => setShowPicker(true)}
								>
									<Ionicons name="time-outline" size={20} />
									<Text>{formatTime(time)}</Text>
								</TouchableOpacity>

								{showPicker && (
									<DateTimePicker
										value={time}
										mode="time"
										display="default"
										onChange={handleTimeChange}
									/>
								)}
							</>
						)}
					</View>

					{!isEdit && selectedDate && (
						<>
							<Text style={styles.label}>Apply To</Text>
							<View style={styles.radioGroup}>
								<TouchableOpacity
									style={[
										styles.radioOption,
										scheduleMode === 'weekly_pattern' && styles.radioSelected,
									]}
									onPress={() => setScheduleMode('weekly_pattern')}
								>
									<View style={styles.radio}>
										{scheduleMode === 'weekly_pattern' && (
											<View style={styles.radioDot} />
										)}
									</View>
									<View>
										<Text>Every week</Text>
										<Text style={styles.subtext}>
											Schedule every {getSelectedDayName()} for the next 2
											months
										</Text>
									</View>
								</TouchableOpacity>

								<TouchableOpacity
									style={[
										styles.radioOption,
										scheduleMode === 'single' && styles.radioSelected,
									]}
									onPress={() => setScheduleMode('single')}
								>
									<View style={styles.radio}>
										{scheduleMode === 'single' && (
											<View style={styles.radioDot} />
										)}
									</View>
									<View>
										<Text>This day only</Text>
										<Text style={styles.subtext}>
											Schedule just for selected date
										</Text>
									</View>
								</TouchableOpacity>
							</View>

							{scheduleMode === 'weekly_pattern' && (
								<View style={styles.infoBox}>
									<InfoBlock
										text={`This will create sessions every ${getSelectedDayName()} at ${formatTime(time)} for the next two months`}
										icon={'!'}
									/>
								</View>
							)}
						</>
					)}

					<View style={styles.buttonRow}>
						{isEdit && (
							<TouchableOpacity
								style={[styles.button, styles.deleteButton]}
								onPress={onDelete}
							>
								<Ionicons name="trash-outline" size={18} />
								<Text>Delete</Text>
							</TouchableOpacity>
						)}

						<TouchableOpacity style={styles.button} onPress={onCancel}>
							<Text>Cancel</Text>
						</TouchableOpacity>

						<TouchableOpacity
							style={[styles.button, styles.primaryButton]}
							onPress={handleConfirm}
						>
							<Text style={styles.primaryText}>{isEdit ? 'Update' : 'Schedule'}</Text>
						</TouchableOpacity>
					</View>
				</View>
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'flex-end',
	},
	modalBackdrop: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
	},
	modalContent: {
		backgroundColor: 'white',
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
		padding: 20,
		paddingBottom: 40,
	},
	modalTitle: {
		fontSize: 20,
		fontWeight: 'bold',
		textAlign: 'center',
		marginBottom: 10,
	},
	modalDate: {
		textAlign: 'center',
		marginBottom: 20,
		color: '#666',
	},
	section: {
		marginBottom: 20,
	},
	label: {
		fontWeight: 'bold',
		marginBottom: 10,
	},
	timeButton: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 10,
		borderWidth: 1,
		borderColor: '#ccc',
		borderRadius: 5,
		gap: 10,
	},
	radioGroup: {
		marginBottom: 20,
	},
	radioOption: {
		flexDirection: 'row',
		padding: 10,
		marginBottom: 10,
		borderWidth: 1,
		borderColor: '#ccc',
		borderRadius: 5,
		gap: 10,
	},
	radioSelected: {
		borderColor: '#007AFF',
		backgroundColor: '#f0f8ff',
	},
	radio: {
		width: 20,
		height: 20,
		borderRadius: 10,
		borderWidth: 2,
		borderColor: '#ccc',
		alignItems: 'center',
		justifyContent: 'center',
	},
	radioDot: {
		width: 10,
		height: 10,
		borderRadius: 5,
		backgroundColor: '#007AFF',
	},
	subtext: {
		fontSize: 12,
		color: '#666',
	},
	infoBox: {
		// flexDirection: 'row',
		// padding: 10,
		// backgroundColor: '#f0f8ff',
		// borderRadius: 5,
		// marginBottom: 20,
		// gap: 10,
	},

	buttonRow: {
		flexDirection: 'row',
		gap: 10,
	},
	button: {
		flex: 1,
		padding: 12,
		borderRadius: 5,
		borderWidth: 1,
		borderColor: '#ccc',
		alignItems: 'center',
		flexDirection: 'row',
		justifyContent: 'center',
		gap: 5,
	},
	primaryButton: {
		backgroundColor: '#007AFF',
		borderColor: '#007AFF',
	},
	primaryText: {
		color: 'white',
	},
	deleteButton: {
		flex: 0,
		paddingHorizontal: 15,
		borderColor: '#ff3b30',
	},
});
