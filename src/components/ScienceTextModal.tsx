import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ReminderType } from '../utils/types';
import { REMINDER_SCIENCE_COPY } from '../constants/neuroReminders';
import AppText from './ui/AppText';
import Spacer, { SpacerVariant } from './ui/Spacer';
import { ExternalLink } from './ui/ExternalLink';
import { Fragment } from 'react';

type Props = {
    type: ReminderType;
};

export function ScienceTextModal({ type }: Props) {
    const { title, body, sources } = REMINDER_SCIENCE_COPY[type];

    return (
        <SafeAreaView style={ styles.safeArea } edges={ ['left', 'right', 'bottom', 'top'] }>
            <ScrollView
                contentContainerStyle={ styles.content }
                showsVerticalScrollIndicator={ false }
            >
                <AppText variant="h2">{ title }</AppText>
                <Spacer variant={ SpacerVariant.medium } />

                { body.map((paragraph, index) => (
                    <View key={ `paragraph-${index}` }>
                        <AppText variant="body">{ paragraph }</AppText>
                        { index < body.length - 1 && <Spacer variant={ SpacerVariant.small } /> }
                    </View>
                )) }

                { sources.length > 0 && (
                    <View style={ styles.sourcesSection }>
                        <Spacer variant={ SpacerVariant.large } />
                        <AppText variant="h3">Sources</AppText>
                        <Spacer variant={ SpacerVariant.small } />
                        { sources.map((source) => (
                            <Fragment key={ source.url }>
                                <ExternalLink
                                    text={ source.text }
                                    url={ source.url }
                                />
                                <Spacer variant={ SpacerVariant.small } />
                            </Fragment>
                        )) }
                    </View>
                ) }
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    content: {
        paddingHorizontal: 12,
        paddingVertical: 12,
    },
    sourcesSection: {
        alignSelf: 'stretch',
    },
});
