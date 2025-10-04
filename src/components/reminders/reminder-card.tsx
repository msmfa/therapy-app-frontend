import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import AppText from '../ui/typography';

interface ReminderOptionCardProps {
	isSelected: boolean;
	onPress: () => void;
	icon: string;
	title: string;
	description: string;
	options: string[];
	recommendedStyle?: boolean;
}

export default function ReminderOptionCard({
    isSelected,
    onPress,
    icon,
    title,
    description,
    options,
}: ReminderOptionCardProps) {
    return (
        <Pressable onPress={ onPress } style={ [styles.card, isSelected && styles.cardRecommended] }>
            <View style={ styles.header }>
                <AppText style={ styles.icon }>{ icon }</AppText>
                <View style={ styles.info }>
                    <View style={ styles.titleRow }>
                        <AppText
                            style={ styles.label }
                            color="#111111"
                            weight="semibold"
                        >
                            { title }
                        </AppText>
                    </View>
                    <AppText
                        style={ styles.description }
                        color={ isSelected ? '#495057' : '#666666' }
                    >
                        { description }
                    </AppText>
                </View>
            </View>

            <View style={ styles.optionsList }>
                { options.map((option, index) => (
                    <AppText
                        key={ index }
                        style={ [styles.optionText, isSelected && styles.optionTextActive] }
                        color={ isSelected ? '#111111' : '#495057' }
                    >
                        • { option }
                    </AppText>
                )) }
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#E9ECEF',
        marginBottom: 12,
    },
    cardRecommended: {
        borderColor: '#0066CC',
        backgroundColor: '#F8FBFF',
    },
    header: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    icon: {
        fontSize: 24,
        marginRight: 12,
    },
    info: {
        flex: 1,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginRight: 8,
    },
    description: {
        fontSize: 14,
        marginTop: 2,
    },
    optionsList: {
        marginTop: 8,
    },
    optionText: {
        fontSize: 12,
        fontWeight: '500',
        marginBottom: 4,
    },
    optionTextActive: {
        fontWeight: '600',
    },
});
