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
    /** Jump to an in-page reference instead of opening its URL. Positions are one-based. */
    onCitationPress?: (position: number) => void;
    variant?: AppTextProps['variant'];
};

// Splitting on a capturing group keeps the markers in the result, so the
// paragraph comes back as alternating prose and "[1, 4]" segments.
const SEGMENT_PATTERN = /(\[\d+(?:\s*,\s*\d+)*\])/;
const MARKER_PATTERN = /^\[(\d+(?:\s*,\s*\d+)*)\]$/;

/**
 * A paragraph whose inline source numbers are tappable: "[3]" opens the third
 * source by default. A page can handle the marker itself to jump to its source
 * list. Copy with no markers in it renders as an ordinary paragraph.
 */
export function CitedText({ text, sources, onCitationPress, variant = 'body', ...rest }: Props) {
    const getSource = (position: number) => {
        if (!Number.isSafeInteger(position) || position < 1) return undefined;

        const source = sources[position - 1];
        return source?.text.trim() && source.url.trim() ? source : undefined;
    };

    const openSource = (position: number) => {
        const source = getSource(position);

        if (!source) return;

        if (onCitationPress) {
            onCitationPress(position);
            return;
        }

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
                        { positions.map((position, positionIndex) => {
                            const source = getSource(position);

                            return (
                                <Text key={ `${position}-${positionIndex}` }>
                                    { positionIndex > 0 ? ', ' : '' }
                                    { source ? (
                                        <Text
                                            accessibilityRole="link"
                                            accessibilityLabel={ `Source ${position}: ${source.text}` }
                                            accessibilityHint={ onCitationPress
                                                ? 'Jump to this source in the references below.'
                                                : 'Open this source in your browser.' }
                                            onPress={ () => openSource(position) }
                                        >
                                            { position }
                                        </Text>
                                    ) : position }
                                </Text>
                            );
                        }) }
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
