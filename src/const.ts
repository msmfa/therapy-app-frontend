export enum Colors {
	White = '#FFFFFF',
	LightBlue = '#E8F4FD',
	DarkBlue = '#0066CC',
	Green = '#059669',
	Red = '#DC2626',
	PaleRed = '#FEE2E2',
}

export const Palette = {
	background: {
		base: Colors.LightBlue, // light blue
	},
	button: {
		label: Colors.DarkBlue,
	},
};

export const colors = {
	background: Palette.background.base, // app background (from Palette)
	surface: '#FFFFFF', // white
	surfaceAlt: '#F8F9FA', // very light gray (off-white)

	text: {
		primary: '#111111', // near-black
		secondary: '#666666', // medium gray
		muted: '#9CA3AF', // cool gray (gray-400)
		inverse: '#FFFFFF', // white
	},
	primary: '#0066CC', // vivid blue
	primaryLight: '#E8F4FD', // very light blue
	success: '#059669', // emerald green
	danger: '#DC2626', // strong red
	dangerLight: '#FEE2E2', // pale red / rose tint
	border: '#E5E7EB', // light gray
	overlay: 'rgba(0, 0, 0, 0.5)', // 50% black overlay
};

export const spacing = {
	xs: 4,
	sm: 8,
	md: 12,
	lg: 16,
	xl: 24,
	xxl: 32,
};

export const radius = {
	sm: 6,
	md: 10,
	lg: 14,
	xl: 20,
};

export const typography = {
	h1: { fontSize: 28, fontWeight: '700' as const },
	h2: { fontSize: 20, fontWeight: '600' as const },
	h3: { fontSize: 16, fontWeight: '600' as const },
	body: { fontSize: 14, fontWeight: '400' as const },
	caption: { fontSize: 12, fontWeight: '500' as const },
	button: { fontSize: 14, fontWeight: '600' as const },
};
