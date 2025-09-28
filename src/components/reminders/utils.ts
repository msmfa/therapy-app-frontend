export interface ReminderTiming {
	id: string;
	label: string;
	description: string;
	icon: string;
	badge?: string;
	isMultiple?: boolean;
	calculate: (now: Date, next: Date) => Date | Array<{ time: Date; message: string }>;
}

export function calculateReminderTime(
    timingId: string,
    nextSessionDate: Date | null,
    reminderTimings: ReminderTiming[],
): Date | Array<{ time: Date; message: string }> | null {
    if (!nextSessionDate) return null;
    const timing = reminderTimings.find((t) => t.id === timingId);
    if (!timing) return null;

    const now = new Date();
    const result = timing.calculate(now, nextSessionDate);

    if (Array.isArray(result)) {
        const validReminders = result.filter((r) => r.time.getTime() > now.getTime());
        return validReminders.length > 0 ? validReminders : null;
    }

    if (result.getTime() <= now.getTime()) {
        return new Date(now.getTime() + 60 * 60 * 1000);
    }

    return result;
}

// export function formatReminderTime(date: Date | null): string {
// 	if (!date) return '';
// 	const now = new Date();
// 	const isToday = date.toDateString() === now.toDateString();
// 	const isTomorrow =
// 		date.toDateString() === new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString();

// 	if (isToday) {
// 		return `Today at ${dayjs(date).format('h:mm A')}`;
// 	} else if (isTomorrow) {
// 		return `Tomorrow at ${dayjs(date).format('h:mm A')}`;
// 	} else {
// 		return dayjs(date).format('ddd, MMM D [at] h:mm A');
// 	}
// }

export function getSessionInterval(nextSessionDate: Date | null): string {
    if (!nextSessionDate) return '';
    const now = new Date();
    const days = Math.round((nextSessionDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

    if (days === 7) return 'Weekly session';
    if (days === 14) return 'Bi-weekly session';
    if (days < 7) return `${days} days until session`;
    return `${days} days until session`;
}

export async function getSavedPreference(): Promise<string> {
    // This would fetch from user settings/storage
    // Default to 'smart-pattern' for new users
    return 'smart-pattern';
}

export async function savePreference(timingId: string): Promise<void> {
    // This would save to user settings/storage
    console.log('Saving preference:', timingId);
}
