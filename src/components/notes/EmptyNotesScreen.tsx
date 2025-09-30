import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Button } from '../ui/button';
import { InfoBlock } from '../infoBlock';

// Color palette
const colors = {
    warningBg: '#fff3cd',
    warningBorder: '#ffeeba',
    warningText: '#856404',
    scienceBg: '#e8f4fd',
    blueText: '#0066cc',
    darkBlueText: '#004085',
    primaryBtn: '#111',
};

export default function EmptyNotesScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={ styles.root } edges={ ['left', 'right', 'bottom'] }>
            <View style={ styles.emptyContainer }>
                <View style={ styles.emptyCard }>
                    <Text style={ styles.emptyEmoji }>📝</Text>
                    <Text style={ styles.emptyTitle }>No therapy notes yet</Text>
                    <Text style={ styles.emptySubtext }>
                        Start capturing insights from your sessions to track your journey
                    </Text>
                </View>
                <View>
                    <InfoBlock text={ 'Add notes right after your therapy session while insights are fresh' } icon={ '💡' } />
                </View>
                <Button label="Create your first note" onPress={ () => router.push('/(tabs)/note') } />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    emptyCard: {
        backgroundColor: colors.warningBg,
        padding: 32,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.warningBorder,
        marginBottom: 24,
        width: '100%',
    },
    emptyEmoji: {
        fontSize: 48,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.warningText,
        marginBottom: 8,
        textAlign: 'center',
    },
    emptySubtext: {
        fontSize: 14,
        color: colors.warningText,
        textAlign: 'center',
        lineHeight: 20,
        opacity: 0.9,
    },
});
