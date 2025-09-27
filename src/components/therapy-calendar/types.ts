export interface Session {
	id: string;
	date: string;
	time: Date;
}

export type ScheduleMode = 'single' | 'weekly_pattern';

export interface MarkedDate {
	marked?: boolean;
	selected?: boolean;
	disabled?: boolean;
	disableTouchEvent?: boolean;
}

export interface MarkedDates {
	[date: string]: MarkedDate;
}
