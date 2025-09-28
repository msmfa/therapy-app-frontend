import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

interface ReminderOptionCardProps {
	isSelected: boolean;
	onPress: () => void;
	icon: string;
	title: string;
	description: string;
	options: string[];
	badge?: string;
	recommendedStyle?: boolean;
}

export default function ReminderOptionCard({
    isSelected,
    onPress,
    icon,
    title,
    description,
    options,
    badge,
}: ReminderOptionCardProps) {
    return (
        <Pressable onPress={ onPress } style={ [styles.card, isSelected && styles.cardRecommended] }>
            <View style={ styles.header }>
                <Text style={ styles.icon }>{ icon }</Text>
                <View style={ styles.info }>
                    <View style={ styles.titleRow }>
                        <Text style={ [styles.label, isSelected && styles.labelActive] }>
                            { title }
                        </Text>
                        { badge && <Text style={ styles.badge }>{ badge }</Text> }
                    </View>
                    <Text style={ [styles.description, isSelected && styles.descriptionActive] }>
                        { description }
                    </Text>
                </View>
            </View>

            <View style={ styles.optionsList }>
                { options.map((option, index) => (
                    <Text
                        key={ index }
                        style={ [styles.optionText, isSelected && styles.optionTextActive] }
                    >
                        • { option }
                    </Text>
                )) }
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#e9ecef',
        marginBottom: 12,
    },
    cardRecommended: {
        borderColor: '#0066cc',
        backgroundColor: '#f8fbff',
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
        color: '#111',
        marginRight: 8,
    },
    labelActive: {
        color: '#111',
    },
    badge: {
        fontSize: 10,
        color: '#0066cc',
        backgroundColor: '#e8f4fd',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    description: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    descriptionActive: {
        color: '#495057',
    },
    optionsList: {
        marginTop: 8,
    },
    optionText: {
        fontSize: 12,
        color: '#495057',
        fontWeight: '500',
        marginBottom: 4,
    },
    optionTextActive: {
        color: '#111',
        fontWeight: '600',
    },
});
