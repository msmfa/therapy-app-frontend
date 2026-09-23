import React, { type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import type { Theme } from 'designs/designs-themes';
import { useTheme, useThemedStyles } from '../../context/theme';

type PassCardProps = {
    /** The reading: what the card is about, in the upper half. */
    children: ReactNode;
    /** The band along the foot, below the hard break; omitted, the card is one piece. */
    footer?: ReactNode;
    /** Thins the wash so the sheet under the card shows through it. */
    translucent?: boolean;
    style?: StyleProp<ViewStyle>;
    testID?: string;
};

export const PASS_CARD_RADIUS = 24;

/**
 * The calendar's card, cut like a boarding pass: a pale wash lit from the
 * top-left, and a lighter band along the foot behind a hard break, the way a
 * pass keeps its fine print below the tear.
 *
 * The shadow sits on the outer view and the clipping on the inner one, since
 * a view that clips its children on iOS also clips its own shadow.
 */
export function PassCard({ children, footer, translucent = false, style, testID }: PassCardProps) {
    const { theme } = useTheme();
    const styles = useThemedStyles(makeStyles);

    return (
        <View style={ [styles.card, style] } testID={ testID }>
            <View style={ styles.clip }>
                <LinearGradient
                    colors={ translucent ? theme.calendar.eventCard.fillTranslucent : theme.calendar.eventCard.fill }
                    start={ { x: 0, y: 0 } }
                    end={ { x: 1, y: 1 } }
                    pointerEvents="none"
                    style={ StyleSheet.absoluteFill }
                />
                <View style={ styles.body }>{ children }</View>
                { footer ? <View style={ styles.footer }>{ footer }</View> : null }
            </View>
        </View>
    );
}

const makeStyles = (theme: Theme) => StyleSheet.create({
    card: {
        borderRadius: PASS_CARD_RADIUS,
        elevation: 12,
        shadowColor: theme.surface.gradientCardShadow,
        shadowOffset: theme.scheme === 'dark' ? theme.surface.shadowOffset : { height: 8, width: 0 },
        shadowOpacity: theme.scheme === 'dark' ? theme.surface.cardShadowOpacity : 0.08,
        shadowRadius: theme.scheme === 'dark' ? theme.surface.shadowRadius : 24,
        width: '100%',
    },
    clip: {
        borderColor: theme.calendar.eventCard.border,
        borderRadius: PASS_CARD_RADIUS,
        borderWidth: 1,
        overflow: 'hidden',
    },
    body: {
        paddingHorizontal: 20,
        paddingVertical: 18,
    },
    footer: {
        backgroundColor: theme.calendar.eventCard.footer,
        borderTopColor: theme.calendar.eventCard.footerRule,
        borderTopWidth: StyleSheet.hairlineWidth,
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
});
