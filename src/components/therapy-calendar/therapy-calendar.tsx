import React, { useState, useMemo } from 'react';
import { View, Alert, StyleSheet } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { InfoBlock } from '../infoBlock';
import { Button } from '../button';
import ScheduleModal from './schedule-modal';

interface TherapyCalendarProps {
	buttonAtBottom?: boolean;
	onSave: (sessions: { [date: string]: Date }) => void;
}

export default function TherapyCalendar({ buttonAtBottom, onSave }: TherapyCalendarProps) {
	const [selectedSessions, setSelectedSessions] = useState<{ [date: string]: Date }>({});
	const [selectedDate, setSelectedDate] = useState<string | null>(null);
	const [showModal, setShowModal] = useState(false);

	const markedDates = useMemo(() => {
		const marks: any = {};
		Object.keys(selectedSessions).forEach((date) => {
			marks[date] = { marked: true, selected: selectedDate === date };
		});
		if (selectedDate && !marks[selectedDate]) {
			marks[selectedDate] = { selected: true };
		}
		return marks;
	}, [selectedSessions, selectedDate]);

	const handleDayPress = (day: any) => {
		setSelectedDate(day.dateString);
		setShowModal(true);
	};

	const handleSchedule = (mode: string, time: Date) => {
		if (!selectedDate) return;

		const sessions = { ...selectedSessions };

		if (mode === 'single') {
			const [year, month, day] = selectedDate.split('-').map(Number);
			const dateTime = new Date(year, month - 1, day);
			dateTime.setHours(time.getHours(), time.getMinutes());
			sessions[selectedDate] = dateTime;
		} else {
			// Weekly pattern - add 8 weeks
			const [year, month, day] = selectedDate.split('-').map(Number);
			const startDate = new Date(year, month - 1, day);

			for (let i = 0; i < 8; i++) {
				const date = new Date(startDate);
				date.setDate(date.getDate() + i * 7);
				date.setHours(time.getHours(), time.getMinutes());

				const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
				sessions[dateString] = date;
			}
		}

		setSelectedSessions(sessions);
		setShowModal(false);
		setSelectedDate(null);
	};

	const handleDelete = () => {
		if (!selectedDate) return;
		const sessions = { ...selectedSessions };
		delete sessions[selectedDate];
		setSelectedSessions(sessions);
		setShowModal(false);
		setSelectedDate(null);
	};

	const handleSave = () => {
		const count = Object.keys(selectedSessions).length;
		if (count === 0) {
			Alert.alert('No Sessions', 'Please add at least one session');
			return;
		}
		onSave(selectedSessions);
	};

	const sessionCount = Object.keys(selectedSessions).length;

	return (
  <>
    <View style={ styles.container }>
      <Calendar
        onDayPress={ handleDayPress }
        markedDates={ markedDates }
        markingType={ 'dot' }
        hideExtraDays
        minDate={ new Date().toISOString().split('T')[0] }
				/>
      <InfoBlock
        text={ `${sessionCount} sessions selected. Tap dates to add sessions, then save.` }
        icon="💡"
				/>
      <View style={ styles.buttons }>
        <Button
          label="Clear All"
          onPress={ () => setSelectedSessions({}) }
          disabled={ sessionCount === 0 }
					/>

        { !buttonAtBottom && (
        <Button
          label={ `Save (${sessionCount})` }
          onPress={ handleSave }
          disabled={ sessionCount === 0 }
						/>
					) }
      </View>

      { buttonAtBottom && (
      <View style={ styles.buttonAtBottom }>
        <Button
          label={ `Add Sessions` }
          onPress={ handleSave }
          disabled={ sessionCount === 0 }
						/>
      </View>
				) }
    </View>

    { selectedDate && (
    <ScheduleModal
      visible={ showModal }
      selectedDate={ selectedDate }
      existingSession={
						selectedSessions[selectedDate]
							? {
									id: selectedDate,
									date: selectedDate,
									time: selectedSessions[selectedDate],
								}
							: null
					}
      defaultTime={ new Date() }
      onConfirm={ handleSchedule }
      onDelete={ handleDelete }
      onCancel={ () => {
						setShowModal(false);
						setSelectedDate(null);
					} }
				/>
			) }
  </>
	);
}

const styles = StyleSheet.create({
	container: {
		height: '100%',
		position: 'relative',
	},
	buttons: {
		// flexDirection: 'row',
		// padding: 10,
		// gap: 10,
	},
	buttonAtBottom: {
		paddingTop: 10,
	},
});
