import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { Theme } from 'designs/designs-themes';
import { useThemedStyles } from '../../context/theme';

type PaginationDotsProps = {
    count: number;
    activeIndex: number;
};

/**
 * The pill row under a carousel: the current page is a long dark pill, the
 * rest are short pale ones. Purely decorative, so it is hidden from screen
 * readers - the carousel itself already announces which card is in view.
 */
export function PaginationDots({ count, activeIndex }: PaginationDotsProps) {
    const styles = useThemedStyles(makeStyles);
    if (count < 2) {
        return null;
    }

    return (
        <View style={ styles.row } accessibilityElementsHidden importantForAccessibility='no-hide-descendants'>
            { Array.from({ length: count }, (_, index) => (
                <View
                    key={ index }
                    style={ [styles.dot, index === activeIndex ? styles.dotActive : styles.dotInactive] }
                />
            )) }
        </View>
    );
}

const makeStyles = (theme: Theme) => StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingTop: 20,
    },
    dot: {
        height: 7,
        borderRadius: 4,
    },
    dotActive: {
        width: 36,
        backgroundColor: theme.ink.primary,
    },
    dotInactive: {
        width: 16,
        backgroundColor: theme.surface.medium,
    },
});
