import React from 'react';
import { Linking, StyleSheet, Text } from 'react-native';
import { COLOR_VARIANTS } from 'designs/designs-colors';
import AppText, { AppTextProps } from './AppText';

export type Citation = {
    text: string;
    url: string;
};

type Props = Omit<AppTextProps, 'children' | 'variant'> & {
    /** Body copy with its source numbers written inline, as "[3]" or "[1, 4]". */
    text: string;
    /** The numbered list the markers count into, so "[3]" is sources[2]. */
    sources: Citation[];
    variant?: AppTextProps['variant'];
};

// Splitting on a capturing group keeps the markers in the result, so the
// paragraph comes back as alternating prose and "[1, 4]" segments.
const SEGMENT_PATTERN = /(\[\d+(?:\s*,\s*\d+)*\])/;
const MARKER_PATTERN = /^\[(\d+(?:\s*,\s*\d+)*)\]$/;

/**
 * A paragraph whose inline source numbers are tappable: "[3]" opens the third
 * source, the same link the numbered list at the foot of the page opens. Copy
 * with no markers in it renders as an ordinary paragraph.
 */
export function CitedText({ text, sources, variant = 'body', ...rest }: Props) {
    const openSource = (position: number) => {
        const source = sources[position - 1];

        if (!source) return;

        void Linking.openURL(source.url).catch(() => undefined);
    };

    const segments = text.split(SEGMENT_PATTERN);

    return (
        <AppText variant={ variant } { ...rest }>
            { segments.map((segment, segmentIndex) => {
                const marker = segment.match(MARKER_PATTERN);

                if (!marker) return segment;

                const positions = marker[1].split(',').map((part) => Number(part.trim()));

                return (
                    <Text key={ `marker-${segmentIndex}` } style={ styles.marker }>
                        { '[' }
                        { positions.map((position, positionIndex) => (
                            <Text key={ position }>
                                { positionIndex > 0 ? ', ' : '' }
                                <Text
                                    accessibilityRole="link"
                                    accessibilityLabel={ sources[position - 1]
                                        ? `Source ${position}: ${sources[position - 1].text}`
                                        : `Source ${position}` }
                                    onPress={ () => openSource(position) }
                                >
                                    { position }
                                </Text>
                            </Text>
                        )) }
                        { ']' }
                    </Text>
                );
            }) }
        </AppText>
    );
}

const styles = StyleSheet.create({
    marker: {
        color: COLOR_VARIANTS.blue.mid,
    },
});
