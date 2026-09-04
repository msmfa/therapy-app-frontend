import React from 'react';
import { StyleSheet, View } from 'react-native';
import AppText from '../ui/AppText';
import FrostedCard from '../ui/FrostedCard';
import { TEXT_COLORS } from 'designs/designs-colors';

type Props = {
    quote: string;
    name: string;
    role: string;
};

/** One tester's words. No stars, no counts, no carousel. */
export function QuoteCard({ quote, name, role }: Props) {
    return (
        <FrostedCard contentStyle={ styles.card }>
            <AppText variant="body" style={ styles.quote }>
                { `“${quote}”` }
            </AppText>
            <View style={ styles.attribution }>
                <AppText variant="h3" style={ styles.name }>
                    { name }
                </AppText>
                <AppText variant="caption" style={ styles.role }>
                    { role }
                </AppText>
            </View>
        </FrostedCard>
    );
}

const styles = StyleSheet.create({
    card: {
        paddingVertical: 18,
    },
    // Body face, not the serif accent: this is a paragraph, and the brand serif
    // is reserved for short accents.
    quote: {
        fontSize: 18,
        lineHeight: 27,
        color: TEXT_COLORS.primary,
    },
    attribution: {
        marginTop: 14,
    },
    name: {
        fontSize: 15,
    },
    role: {
        color: TEXT_COLORS.tertiary,
    },
});
