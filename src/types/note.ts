export type Note = {
	id: string;
	text: string;
	createdAt: number;
	remindAt: number;
	notifId: string; // Expo notification id
};
