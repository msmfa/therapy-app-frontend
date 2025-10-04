import { View, StyleSheet } from 'react-native';
import AppText from '../ui/typography';

interface Props {
	timestamp: string;
	sessionInterval: string;
}

export function NextSessionCard({ timestamp, sessionInterval }: Props) {
    return (
        <View style={ styles.sessionInfoCard }>
            <View style={ styles.sessionInfoRow }>
                <AppText style={ styles.sessionInfoLabel } color="#666666" weight="medium">
                    Next session
                </AppText>
                <AppText style={ styles.sessionInfoValue } color="#111111" weight="semibold">
                    { timestamp }
                </AppText>
            </View>
            <AppText style={ styles.sessionInterval } color="#28A745" weight="semibold">
                { sessionInterval }
            </AppText>
        </View>
    );
}

const styles = StyleSheet.create({
    sessionInfoCard: {
        backgroundColor: '#F8F9FA',
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#E9ECEF',
    },
    sessionInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    sessionInfoLabel: {
        fontSize: 14,
        fontWeight: '500',
    },
    sessionInfoValue: {
        fontSize: 14,
        fontWeight: '600',
    },
    sessionInterval: {
        fontSize: 12,
        marginTop: 8,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
});
