import React from 'react';
import { View, StyleSheet } from 'react-native';
import AppText from '../ui/AppText';
import { PALETTE, TEXT_COLORS } from 'designs/designs-colors';
import type { NoteReviewProgress } from '../../features/reviews';

/**
 * A row of thin rounded ticks rather than one filled track.
 *
 * The denominator is small - a gap holds about four reminders - so four fat
 * blocks would read as a rating, not progress. Ticks give the dense meter look
 * while the fill still lands on clean fractions of the row.
 *
 * The fill is a single run from the left, proportional to how many reminders
 * were answered, not a map of which ones. Two of four answered fills half the
 * row whether the missed one came first or last: a grey gap mid-row would read
 * as a bar that had gone backwards.
 */
const TICKS = 32;

export interface Rgb {
    r: number;
    g: number;
    b: number;
}

/**
 * The ramp spans the filled run, not the row.
 *
 * So it always starts red and ends orange whatever the fraction: two of three
 * and four of six both sweep the whole ramp, over different widths. Tying the
 * colour to the row instead made a short fill look like a different palette
 * from a long one.
 *
 * Interpolated channel by channel rather than by hue, because hue is not
 * perceptually even here - everything from 5 to about 15 still reads as plain
 * red, so a hue ramp held red for the first third then turned orange all at
 * once. Through RGB the change is mostly green rising, spread evenly.
 */
const PROGRESS_RAMP: readonly [Rgb, Rgb] = [
    { r: 226, g: 59, b: 41 },
    { r: 239, g: 160, b: 51 },
];

/** Every reminder answered. A different hue entirely, so finishing reads as a win. */
export const COMPLETE_RAMP: readonly [Rgb, Rgb] = [
    { r: 34, g: 150, b: 83 },
    { r: 124, g: 200, b: 74 },
];

/**
 * The resting colour of a tick: light grey, and what the whole row looks like
 * until a review actually happens. Not-yet-due, still-answerable and missed all
 * sit here, so colour only ever means a review that was done.
 */
const TRACK_COLOR = PALETTE.overlay.blackLightTransparent;

export const rampColor = ([from, to]: readonly [Rgb, Rgb], position: number): string => {
    const clamped = Math.min(1, Math.max(0, position));
    const channel = (start: number, end: number) =>
        Math.round(start + (end - start) * clamped);

    return `rgb(${channel(from.r, to.r)}, ${channel(from.g, to.g)}, ${channel(from.b, to.b)})`;
};

type Props = {
    progress: NoteReviewProgress;
    /** Optional caption, e.g. while comparing states side by side. */
    label?: string;
    /** Off on the card, where the bar speaks for itself. */
    showCaption?: boolean;
};

export function ReviewProgressBar({ progress, label, showCaption = true }: Props) {
    const { completed, total, hasSchedule, isComplete } = progress;

    const ticks = React.useMemo(() => {
        const empty = Array.from({ length: TICKS }, () => TRACK_COLOR);
        if (!hasSchedule || total === 0 || completed === 0) return empty;

        const filled = Math.round((completed / total) * TICKS);
        const ramp = isComplete ? COMPLETE_RAMP : PROGRESS_RAMP;

        return empty.map((track, index) =>
            index < filled
                ? rampColor(ramp, filled > 1 ? index / (filled - 1) : 0)
                : track,
        );
    }, [completed, hasSchedule, isComplete, total]);

    const caption = hasSchedule
        ? `${completed} of ${total} reviewed`
        : 'No reviews scheduled yet';

    return (
        <View style={ styles.root }>
            <View style={ styles.track }>
                { ticks.map((color, index) => (
                    <View
                        key={ index }
                        style={ [styles.tick, { backgroundColor: color }] }
                    />
                )) }
            </View>
            { showCaption && (
                <AppText variant='caption' style={ styles.caption }>
                    { label ?? caption }
                </AppText>
            ) }
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        marginTop: 14,
    },
    track: {
        flexDirection: 'row',
        alignItems: 'center',
        // Fixed-width ticks spread across the row, rather than flexing to fill
        // it: the gaps absorb the spare width so the ticks stay hairline at any
        // card width.
        justifyContent: 'space-between',
    },
    tick: {
        width: 3,
        height: 18,
        borderRadius: 1.5,
    },
    caption: {
        marginTop: 8,
        color: TEXT_COLORS.tertiary,
    },
});
