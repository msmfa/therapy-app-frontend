import React from 'react';
import { View, StyleSheet, Pressable, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppText from '../ui/AppText';
import { COMPLETE_RAMP, rampColor, ReviewProgressBar } from './ReviewProgressBar';
import { REVIEW_PROGRESS_PREVIEWS } from './reviewProgressPreview';
import { COLOR_VARIANTS, PALETTE, TEXT_COLORS } from 'designs/designs-colors';

// Android needs this switched on explicitly; on iOS it is already available.
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

/**
 * Explains what the bar on each note means.
 *
 * A card shows one bar and no caption, so on its own the bar is a colour with
 * no key. This is the key: the same bars, in order, with plain wording for what
 * each one is telling you. Collapsible, because it earns its space the first
 * few times and then stops.
 */
type Props = {
    /**
     * Controlled when supplied. The list renders this twice - once pinned and
     * once as an invisible spacer that reserves its height - and the two copies
     * have to agree, or collapsing the visible one leaves the list padded for a
     * box that is no longer there.
     */
    expanded?: boolean;
    onToggle?: () => void;
};

/**
 * A miniature of the finished bar, shown in the header only while the box is
 * closed. Collapsed, the title alone gives no clue what is inside; this shows
 * it. Open, the real bars are right below and it would just be noise.
 */
const TEASER_TICKS = 14;

function CollapsedTeaser() {
    return (
        <View style={ styles.teaser } pointerEvents='none'>
            { Array.from({ length: TEASER_TICKS }, (_, index) => (
                <View
                    key={ index }
                    style={ [
                        styles.teaserTick,
                        {
                            backgroundColor: rampColor(
                                COMPLETE_RAMP,
                                index / (TEASER_TICKS - 1),
                            ),
                        },
                    ] }
                />
            )) }
        </View>
    );
}

export function ReviewProgressGallery({ expanded: controlled, onToggle }: Props) {
    const [ownExpanded, setOwnExpanded] = React.useState(false);
    const expanded = controlled ?? ownExpanded;

    const toggle = React.useCallback(() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        if (onToggle) {
            onToggle();
            return;
        }
        setOwnExpanded((previous) => !previous);
    }, [onToggle]);

    return (
        <View style={ styles.root }>
            <Pressable
                onPress={ toggle }
                accessibilityRole='button'
                accessibilityState={ { expanded } }
                style={ styles.header }
            >
                <AppText variant='body' style={ styles.title }>
                    The bars
                </AppText>
                { !expanded && <CollapsedTeaser /> }
                <Ionicons
                    name={ expanded ? 'chevron-up' : 'chevron-down' }
                    size={ 18 }
                    color={ COLOR_VARIANTS.black.tertiary }
                />
            </Pressable>

            { expanded && (
                <View>
                    <AppText variant='caption' style={ styles.intro }>
                        After you&apos;ve reviewed a note click review and these bars
                        will update.
                    </AppText>
                    { REVIEW_PROGRESS_PREVIEWS.map((preview) => (
                        <ReviewProgressBar
                            key={ preview.label }
                            progress={ preview.progress }
                            label={ preview.label }
                        />
                    )) }
                </View>
            ) }
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        borderRadius: 15,
        backgroundColor: PALETTE.overlay.whiteSurfaceTransparent,
        // A hairline of the bars' own green, faint enough to bound the box
        // without competing with the bars inside it.
        borderWidth: 1,
        borderColor: 'rgba(34, 150, 83, 0.18)',
        paddingHorizontal: 22,
        paddingVertical: 22,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
    },
    title: {
        fontSize: 18,
        lineHeight: 26,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    intro: {
        marginTop: 6,
        color: TEXT_COLORS.tertiary,
    },
    teaser: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 4,
    },
    teaserTick: {
        width: 3,
        height: 14,
        borderRadius: 1.5,
    },
});
