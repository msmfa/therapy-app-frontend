import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { TEXT_COLORS } from 'designs/designs-colors';

type Props = {
    color?: string;
    /** Scales from the artwork's own 30x24, so the pair never distorts. */
    width?: number;
};

/** The artwork's own proportions. */
const ASPECT = 30 / 24;

/**
 * The opening quote mark from the Plastic Brains website, glyph for glyph.
 *
 * The same solid pair of marks the site sets above each testimonial, rather
 * than a typed curly quote: the site's is a drawn mark with square-cut stems
 * that no font in the app carries, and a quote should look the same wherever a
 * reader meets it.
 */
export function QuoteMark({ color = TEXT_COLORS.primary, width = 30 }: Props) {
    return (
        <Svg width={ width } height={ width / ASPECT } viewBox="0 0 30 24">
            <Path
                d="M1 13.2C1 6.8 4.1 2.7 9.4 1L11 4.1C7.8 5.3 6.1 7.5 5.8 10.1H11v9.4H1v-6.3Zm15.5 0c0-6.4 3.1-10.5 8.4-12.2l1.6 3.1c-3.2 1.2-4.9 3.4-5.2 6h5.2v9.4h-10v-6.3Z"
                fill={ color }
            />
        </Svg>
    );
}
