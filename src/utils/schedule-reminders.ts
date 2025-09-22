import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { SchedulableTriggerInputTypes } from 'expo-notifications';

Notifications.setNotificationHandler({
	handleNotification: async (): Promise<Notifications.NotificationBehavior> => ({
		shouldShowAlert: true,
		shouldPlaySound: true,
		shouldSetBadge: false,
		shouldShowBanner: true,
		shouldShowList: true,
	}),
});

export async function initNotifications() {
	if (Platform.OS === 'android') {
		await Notifications.setNotificationChannelAsync('default', {
			name: 'Default',
			importance: Notifications.AndroidImportance.DEFAULT,
			sound: 'default',
		});
	}

	if (!Device.isDevice) return;

	const { status } = await Notifications.getPermissionsAsync();
	if (status !== 'granted') {
		await Notifications.requestPermissionsAsync();
	}
}

export async function scheduleNoteReminder(
	noteId: string,
	body: string,
	when: Date,
): Promise<string> {
	if (when.getTime() <= Date.now()) {
		throw new Error('Pick a future date & time');
	}

	const trigger: Notifications.DateTriggerInput = {
		type: SchedulableTriggerInputTypes.DATE,
		date: when,
	};

	const id = await Notifications.scheduleNotificationAsync({
		content: {
			title: 'Note reminder',
			body,
			data: { noteId },
		},
		trigger,
	});

	return id;
}

export async function cancelReminder(notificationId: string) {
	await Notifications.cancelScheduledNotificationAsync(notificationId).catch(() => {});
}
