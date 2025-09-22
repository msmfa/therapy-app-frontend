import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import { useAuth } from '../../src/auth/AuthContext';
import {
	listTherapySessions,
	createTherapySession,
	deleteTherapySession,
	TherapySession,
} from '../../src/api/therapy';
import { PINK_CLEAR, PINK_DARK, PINK_SOLID } from '../../src/const';

/* ---------------- utils (tiny + timezone-safe) ---------------- */
const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const monthStart = (y: number, m1: number) => new Date(y, m1 - 1, 1, 0, 0, 0, 0);
const nextMonthStart = (y: number, m1: number) => new Date(y, m1, 1, 0, 0, 0, 0);
// create sessions at *local noon* to avoid UTC day shift
const localNoonFromYMD = (dateYMD: string) => {
	const [y, m, d] = dateYMD.split('-').map(Number);
	return new Date(y, (m as number) - 1, d as number, 12, 0, 0, 0);
};
// shapes from Calendar (don’t import types from the lib for version safety)
type MarkedDates = NonNullable<React.ComponentProps<typeof Calendar>['markedDates']>;
type DayObj = { dateString: string; day: number; month: number; year: number };

/* ---------------- component ---------------- */
export default function CalendarScreen() {
	const { token } = useAuth();

	const now = new Date();
	const [visible, setVisible] = useState<{ year: number; month: number }>({
		year: now.getFullYear(),
		month: now.getMonth() + 1,
	});

	// Backend truth for *this month*: map YYYY-MM-DD -> session id
	const [savedMap, setSavedMap] = useState<Record<string, string>>({});
	// User’s current selection for this month
	const [selected, setSelected] = useState<Set<string>>(new Set());

	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);

	const from = useMemo(() => monthStart(visible.year, visible.month), [visible]);
	const to = useMemo(() => nextMonthStart(visible.year, visible.month), [visible]);

	const fetchMonth = useCallback(async () => {
		if (!token) return;
		setLoading(true);
		try {
			const data = await listTherapySessions(token, from, to);
			const map: Record<string, string> = {};
			(data as TherapySession[]).forEach((s) => {
				map[ymd(new Date(s.startsAtUtc))] = s._id;
			});
			setSavedMap(map);
			// On month load, mirror selection to saved state (no unsaved changes initially)
			setSelected(new Set(Object.keys(map)));
		} catch (e: any) {
			console.warn('Load sessions failed:', e?.message ?? e);
		} finally {
			setLoading(false);
		}
	}, [token, from, to]);

	useEffect(() => {
		fetchMonth();
	}, [fetchMonth]);

	// Unsaved changes = selection differs from saved
	const unsaved = useMemo(() => {
		const savedSet = new Set(Object.keys(savedMap));
		if (savedSet.size !== selected.size) return true;
		for (const k of selected) if (!savedSet.has(k)) return true;
		return false;
	}, [savedMap, selected]);

	const DAY_SIZE = 32; // circle size inside each day cell
	const RING_OFFSET_Y = 2;

	const marked: MarkedDates = useMemo(() => {
		const m: MarkedDates = {};

		// saved = red ring
		Object.keys(savedMap).forEach((key) => {
			m[key] = {
				...(m[key] || {}),
				customStyles: {
					...(m[key]?.customStyles || {}),
					container: {
						...(m[key]?.customStyles?.container || {}),
						width: DAY_SIZE,
						height: DAY_SIZE,
						borderRadius: DAY_SIZE / 2,
						alignItems: 'center',
						justifyContent: 'center',
						borderWidth: 2,
						borderColor: PINK_DARK,
						backgroundColor: 'transparent',
						marginTop: RING_OFFSET_Y, // 👈 nudge down
					},
					text: {
						...(m[key]?.customStyles?.text || {}),
						color: '#111',
						fontWeight: '600',
					},
				},
			} as any;
		});

		// selected = filled dark (keeps ring if present)
		selected.forEach((key) => {
			const prev = m[key]?.customStyles || {};
			m[key] = {
				customStyles: {
					container: {
						...prev.container,
						width: DAY_SIZE,
						height: DAY_SIZE,
						borderRadius: DAY_SIZE / 2,
						alignItems: 'center',
						justifyContent: 'center',
						backgroundColor: 'transparent',
						marginTop: RING_OFFSET_Y, // 👈 same nudge
					},
					text: {
						...prev.text,
						color: PINK_DARK,
						fontWeight: '700',
					},
				},
			} as any;
		});

		return m;
	}, [savedMap, selected]);

	/* ---------------- interactions ---------------- */
	const onDayPress = (day: DayObj) => {
		// Only toggle days shown in current month grid (react-native-calendars handles month bounds)
		const next = new Set(selected);
		next.has(day.dateString) ? next.delete(day.dateString) : next.add(day.dateString);
		setSelected(next);
	};

	const onMonthChange = (m: DayObj) => {
		// Only reachable when next/prev arrows are enabled (we disable right when unsaved)
		setVisible({ year: m.year, month: m.month });
	};

	const discard = () => setSelected(new Set(Object.keys(savedMap)));

	const saveThisMonth = async () => {
		if (!token) {
			Alert.alert('Not logged in', 'Please log in first.');
			return;
		}
		try {
			setSaving(true);
			const savedSet = new Set(Object.keys(savedMap));
			const toCreate = [...selected].filter((d) => !savedSet.has(d));
			const toDeleteIds = [...savedSet]
				.filter((d) => !selected.has(d))
				.map((d) => savedMap[d])
				.filter(Boolean) as string[];

			await Promise.all([
				...toDeleteIds.map((id) => deleteTherapySession(token, id)),
				...toCreate.map((d) => createTherapySession(token, localNoonFromYMD(d), 50)),
			]);

			// Refresh month, then snapshot selection to saved state so arrows re-enable
			await fetchMonth();
			Alert.alert('Saved', 'This month’s therapy dates have been updated.');
		} catch (e: any) {
			Alert.alert('Save failed', e?.message ?? 'Please try again.');
			await fetchMonth();
		} finally {
			setSaving(false);
		}
	};

	/* ---------------- render ---------------- */
	return (
		<SafeAreaView style={styles.root}>
			<View style={{ paddingTop: 36, paddingLeft: 10, paddingRight: 10 }}>
				<Text style={styles.subtitle}>Select your therapy sessions</Text>

				<Calendar
					style={styles.calendar}
					enableSwipeMonths={false} // prevent bypassing arrow lock
					disableArrowRight={unsaved} // lock NEXT until saved
					onMonthChange={onMonthChange}
					onDayPress={onDayPress}
					markingType="custom"
					markedDates={marked}
					hideExtraDays={false}
					theme={{
						calendarBackground: 'transparent',
						backgroundColor: 'transparent',
						selectedDayBackgroundColor: '#111',
						selectedDayTextColor: '#fff',
						todayTextColor: '#111',
						arrowColor: unsaved ? '#E11900' : '#111',
						monthTextColor: '#111',
						textDayFontWeight: '600',
						textMonthFontWeight: '700',
					}}
				/>

				{/* {(loading || saving) && (
					<View style={styles.statusRow}>
						<ActivityIndicator />
						<Text style={styles.statusText}>{loading ? 'Loading…' : 'Saving…'}</Text>
					</View>
				)} */}

				{unsaved && (
					<View style={styles.banner}>
						<Text style={styles.bannerText}>
							You have unsaved changes for this month.
						</Text>
					</View>
				)}

				<View style={styles.actions}>
					<TouchableOpacity onPress={discard} style={[styles.btn, styles.btnGhost]}>
						<Text style={styles.btnGhostText}>Discard</Text>
					</TouchableOpacity>
					<TouchableOpacity
						onPress={saveThisMonth}
						disabled={!unsaved || saving}
						style={[
							styles.btn,
							!unsaved || saving ? styles.btnDisabled : styles.btnPrimary,
						]}
					>
						<Text
							style={
								!unsaved || saving ? styles.btnDisabledText : styles.btnPrimaryText
							}
						>
							{saving ? 'Saving…' : 'Save this month'}
						</Text>
					</TouchableOpacity>
				</View>
			</View>
		</SafeAreaView>
	);
}

/* ---------------- styles ---------------- */
const styles = StyleSheet.create({
	root: { flex: 1, backgroundColor: 'transparent' },
	title: { fontSize: 22, fontWeight: '700' },
	subtitle: { marginTop: 8, color: '#666', marginBottom: 12 },
	calendar: { backgroundColor: 'transparent' },
	statusRow: { marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
	statusText: { marginLeft: 8 },
	banner: {
		marginTop: 12,
		padding: 10,
		borderRadius: 10,
		backgroundColor: 'rgba(225,25,0,0.08)',
		borderWidth: 1,
		borderColor: '#E7B0AA',
	},
	bannerText: { color: '#7A3026', fontWeight: '600' },
	actions: { marginTop: 16, flexDirection: 'row', gap: 12 },
	btn: {
		flex: 1,
		paddingVertical: 12,
		paddingHorizontal: 14,
		borderRadius: 12,
		alignItems: 'center',
		justifyContent: 'center',
	},
	btnGhost: { borderWidth: 1, borderColor: '#ddd' },
	btnGhostText: { fontWeight: '700', color: '#444' },
	btnPrimary: { backgroundColor: '#111' },
	btnPrimaryText: { color: '#fff', fontWeight: '700' },
	btnDisabled: { backgroundColor: '#eee' },
	btnDisabledText: { color: '#aaa', fontWeight: '700' },
});
