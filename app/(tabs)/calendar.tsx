import React from 'react';

import TherapyCalendar from '../../src/components/therapy-calendar/therapy-calendar';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CalendarScreen() {
	function onSave(sessions: any) {
		alert(JSON.stringify(sessions)); // This will show on device too

		return console.log('sessions', sessions);
	}
	return (
		<SafeAreaView>
			<TherapyCalendar onSave={onSave} />
		</SafeAreaView>
	);
}
