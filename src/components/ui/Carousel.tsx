import React, { useState } from 'react';
import {
    LayoutChangeEvent,
    NativeScrollEvent,
    NativeSyntheticEvent,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import { PaginationDots } from './PaginationDots';

type CarouselProps<T> = {
    data: readonly T[];
    keyExtractor: (item: T, index: number) => string;
    renderItem: (item: T, index: number) => React.ReactNode;
    /** Gutter on both sides of the card that is in view. Derived from the
     * track when not given. */
    edgePadding?: number;
    /** Space between cards. Derived from the track when not given. */
    gap?: number;
    /** How much of the next card stays visible, so the swipe is discoverable.
     * Derived from the track when not given. */
    peek?: number;
};

// The deck's metrics are a share of the track rather than fixed points, so a
// narrower screen gives up gutter and peek instead of squeezing the card. On a
// large phone these work out to the 24 / 16 / 32 the deck was drawn at.
const EDGE_PADDING_SHARE = 0.056;
const GAP_SHARE = 0.037;
const PEEK_SHARE = 0.075;
const EDGE_PADDING_MAX = 24;
const GAP_MAX = 16;
const PEEK_MAX = 32;

/**
 * A horizontal, one-card-at-a-time carousel with a pill indicator underneath.
 *
 * The card width is derived from the measured track rather than the window so
 * the component works inside a padded parent. Cards are laid out with the
 * default cross-axis stretch, which means every card takes the height of the
 * tallest one - a card whose content is short keeps its footer pinned to the
 * same line as its neighbours.
 */
export function Carousel<T>({
    data,
    keyExtractor,
    renderItem,
    edgePadding,
    gap,
    peek,
}: CarouselProps<T>) {
    const [trackWidth, setTrackWidth] = useState(0);
    const [activeIndex, setActiveIndex] = useState(0);

    const gutter = edgePadding ?? Math.round(Math.min(EDGE_PADDING_MAX, trackWidth * EDGE_PADDING_SHARE));
    const cardGap = gap ?? Math.round(Math.min(GAP_MAX, trackWidth * GAP_SHARE));
    const cardPeek = peek ?? Math.round(Math.min(PEEK_MAX, trackWidth * PEEK_SHARE));

    const cardWidth = Math.max(trackWidth - gutter * 2 - cardPeek, 0);
    const snapInterval = cardWidth + cardGap;

    const handleLayout = (event: LayoutChangeEvent) => {
        setTrackWidth(event.nativeEvent.layout.width);
    };

    const handleSettle = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        if (snapInterval <= 0) {
            return;
        }
        const nearest = Math.round(event.nativeEvent.contentOffset.x / snapInterval);
        setActiveIndex(Math.min(Math.max(nearest, 0), data.length - 1));
    };

    return (
        <View onLayout={ handleLayout }>
            { cardWidth > 0 && (
                <ScrollView
                    horizontal
                    style={ styles.scroller }
                    showsHorizontalScrollIndicator={ false }
                    decelerationRate='fast'
                    snapToInterval={ snapInterval }
                    snapToAlignment='start'
                    disableIntervalMomentum
                    onMomentumScrollEnd={ handleSettle }
                    onScrollEndDrag={ handleSettle }
                    contentContainerStyle={ [styles.track, { paddingHorizontal: gutter, gap: cardGap }] }
                >
                    { data.map((item, index) => (
                        <View key={ keyExtractor(item, index) } style={ { width: cardWidth } }>
                            { renderItem(item, index) }
                        </View>
                    )) }
                </ScrollView>
            ) }
            <PaginationDots count={ data.length } activeIndex={ activeIndex } />
        </View>
    );
}

const styles = StyleSheet.create({
    // ScrollView grows to fill its parent by default; the deck should hug the
    // tallest card instead so the cards keep their own proportions.
    scroller: {
        flexGrow: 0,
    },
    track: {
        alignItems: 'stretch',
        // The scroller clips to its bounds, so the cards need more room here
        // than their shadow reaches (offset + radius) or its lower edge is cut
        // off in a straight line across the deck.
        paddingVertical: 32,
    },
});
