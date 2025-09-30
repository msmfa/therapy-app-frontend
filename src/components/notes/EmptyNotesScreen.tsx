import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import dayjs from 'dayjs';
import { GradientUpwards } from '../GradientUpwards';
import { useTherapySessions } from '../../context/TherapySessionsContext';

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
    const { nextSession, loading } = useTherapySessions();

    const nextSessionDate = nextSession
        ? dayjs(nextSession.startsAtUtc).format('dddd, MMM D [at] h:mm A')
        : null;

    return (
        <SafeAreaView style={ styles.root } edges={ ['left', 'right', 'bottom', 'top'] }>
            <GradientUpwards />
            <View style={ styles.emptyContainer }>
                <View style={ styles.emptyCard }>
                    <Text style={ styles.emptyTitle }>Nothing logged yet</Text>
                    { nextSessionDate ? (
                        <Text style={ styles.emptySubtext }>
                            Your next session is { nextSessionDate }.
                        </Text>
                    ) : (
                        <Text style={ styles.emptySubtext }>
                            { loading
                                ? 'We are fetching your upcoming sessions…'
                                : 'Your next session will appear here once you add it.' }
                        </Text>
                    ) }
                    <Text style={ styles.emptySubtext }>
                        We'll send you a notification shortly afterwards so you can take down your first note!
                    </Text>

                    <Text style={ styles.emptySubtext }>
                        If you want to get started now, you can create your first note by tapping the + icon in the bottom left
                    </Text>
                </View>
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
        gap: 16,
        // alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    emptyCard: {
        backgroundColor: colors.warningBg,
        padding: 32,
        borderRadius: 12,
        gap: 12,
        // alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.warningBorder,
        marginBottom: 24,
        width: '100%',
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: colors.warningText,
        marginBottom: 8,
        // textAlign: 'center',
    },
    emptySubtext: {
        fontSize: 16,
        color: colors.warningText,
        // textAlign: 'center',
        lineHeight: 20,
        opacity: 0.9,
    },
});
