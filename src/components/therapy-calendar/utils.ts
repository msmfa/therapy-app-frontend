import { Session } from './types';

/**
 * Converts a JavaScript Date object to a string in YYYY-MM-DD format
 * Example: new Date(2024, 2, 15) becomes "2024-03-15"
 */
export function convertDateObjectToYYYYMMDDString(dateObjectToConvert: Date): string {
	const fourDigitYear = dateObjectToConvert.getFullYear();
	const monthNumberStartingFromOne = dateObjectToConvert.getMonth() + 1; // JS months are 0-11
	const monthWithLeadingZeroIfNeeded = String(monthNumberStartingFromOne).padStart(2, '0');
	const dayOfMonthWithLeadingZeroIfNeeded = String(dateObjectToConvert.getDate()).padStart(
		2,
		'0',
	);

	const finalYYYYMMDDString = `${fourDigitYear}-${monthWithLeadingZeroIfNeeded}-${dayOfMonthWithLeadingZeroIfNeeded}`;

	return finalYYYYMMDDString;
}

/**
 * Generates all dates for a weekly recurring pattern
 * Example: If user selects Tuesday March 5th, this generates all Tuesdays for the next 8 weeks
 * But skips any Tuesdays that already have sessions scheduled
 */
export function generateAllWeeklyRecurringDatesFromSelectedDate(
	selectedDateAsYYYYMMDDString: string,
	mapOfExistingSessionsByDate: Map<string, Session>,
	numberOfWeeksToScheduleIntoTheFuture: number = 8,
): string[] {
	// Step 1: Parse the selected date string into numbers
	const [yearFromString, monthFromStringStartingAt1, dayOfMonthFromString] =
		selectedDateAsYYYYMMDDString.split('-').map(Number);

	// Step 2: Create a Date object from the parsed numbers (subtract 1 from month for JS Date)
	const selectedDateAsJavaScriptDateObject = new Date(
		yearFromString,
		monthFromStringStartingAt1 - 1,
		dayOfMonthFromString,
	);

	// Step 3: Calculate when to stop creating recurring dates
	const finalDateToCreateSessionFor = new Date(selectedDateAsJavaScriptDateObject);
	const totalDaysToAddForAllWeeks = numberOfWeeksToScheduleIntoTheFuture * 7;
	finalDateToCreateSessionFor.setDate(
		finalDateToCreateSessionFor.getDate() + totalDaysToAddForAllWeeks,
	);

	// Step 4: Generate all the recurring dates
	const allRecurringDateStringsToSchedule: string[] = [];
	const currentDateWeAreCheckingInLoop = new Date(selectedDateAsJavaScriptDateObject);

	while (currentDateWeAreCheckingInLoop <= finalDateToCreateSessionFor) {
		// Convert current date to string format
		const currentDateAsYYYYMMDDString = convertDateObjectToYYYYMMDDString(
			currentDateWeAreCheckingInLoop,
		);

		// Check if a session already exists on this date
		const sessionAlreadyExistsOnThisDate = mapOfExistingSessionsByDate.has(
			currentDateAsYYYYMMDDString,
		);

		// Only add this date if there's no existing session
		if (!sessionAlreadyExistsOnThisDate) {
			allRecurringDateStringsToSchedule.push(currentDateAsYYYYMMDDString);
		}

		// Move to the same day next week (add 7 days)
		const moveToNextWeekByAdding7Days = 7;
		currentDateWeAreCheckingInLoop.setDate(
			currentDateWeAreCheckingInLoop.getDate() + moveToNextWeekByAdding7Days,
		);
	}

	return allRecurringDateStringsToSchedule;
}

/**
 * Formats a time for display to the user
 * Example: Date object with time 19:30 becomes "7:30 PM"
 */
export function formatTimeForHumanReadableDisplay(dateObjectContainingTime: Date): string {
	const formattedTimeString = dateObjectContainingTime.toLocaleTimeString([], {
		hour: 'numeric', // Show hour without leading zero
		minute: '2-digit', // Always show two digits for minutes
		hour12: true, // Use 12-hour format with AM/PM
	});

	return formattedTimeString;
}

/**
 * Gets the name of the day of the week from a date string
 * Example: "2024-03-15" returns "Friday"
 */
export function getDayOfWeekNameFromDateString(dateInYYYYMMDDFormat: string): string {
	const allDayNamesInOrderStartingFromSunday = [
		'Sunday', // 0
		'Monday', // 1
		'Tuesday', // 2
		'Wednesday', // 3
		'Thursday', // 4
		'Friday', // 5
		'Saturday', // 6
	];

	// Parse the date string
	const [yearFromString, monthFromStringStartingAt1, dayOfMonthFromString] = dateInYYYYMMDDFormat
		.split('-')
		.map(Number);

	// Create Date object (remember to subtract 1 from month)
	const dateObjectFromParsedString = new Date(
		yearFromString,
		monthFromStringStartingAt1 - 1,
		dayOfMonthFromString,
	);

	// Get day of week as number (0-6)
	const dayOfWeekAsNumberFrom0To6 = dateObjectFromParsedString.getDay();

	// Use the number to get the day name from our array
	const dayNameForThisDate = allDayNamesInOrderStartingFromSunday[dayOfWeekAsNumberFrom0To6];

	return dayNameForThisDate;
}
