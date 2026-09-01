import { StyleSheet, View } from 'react-native';
import { ReminderType } from '../utils/types';
import { REMINDER_SCIENCE_COPY } from '../constants/neuroReminders';
import AppText from './ui/AppText';
import Spacer, { SpacerVariant } from './ui/Spacer';
import { CitedText } from './ui/CitedText';
import { ExternalLink } from './ui/ExternalLink';
import { GradientCard } from './ui/GradientCard';

type Props = {
    type: ReminderType;
};

/**
 * The science write-up behind one reminder interval. It has no scroll view or
 * safe area of its own: AppModal supplies both, so the page scrolls as one
 * column rather than as a scroll view nested inside another.
 */
export function ScienceTextModal({ type }: Props) {
    const { body, sources } = REMINDER_SCIENCE_COPY[type];

    return (
        <>
            <GradientCard addedStyles={ styles.gradientContainer }>
                <Spacer />

                { body.map((paragraph, index) => (
                    <View key={ `paragraph-${index}` }>
                        <CitedText variant="body" text={ paragraph } sources={ sources } />
                        { index < body.length - 1 && <Spacer variant={ SpacerVariant.small } /> }
                    </View>
                )) }
                <Spacer variant={ SpacerVariant.large } />
            </GradientCard>

            { sources.length > 0 && (
                <View style={ styles.sourcesSection }>
                    <Spacer variant={ SpacerVariant.large } />
                    <AppText variant="h3">Sources</AppText>
                    <Spacer variant={ SpacerVariant.small } />
                    { sources.map((source, index) => (
                        <View key={ source.url } style={ styles.source }>
                            <AppText variant="caption" style={ styles.sourceMarker }>
                                { index + 1 }.
                            </AppText>
                            <ExternalLink
                                variant="caption"
                                text={ source.text }
                                url={ source.url }
                                containerStyle={ styles.sourceLink }
                            />
                        </View>
                    )) }
                </View>
            ) }
        </>
    );
}

const styles = StyleSheet.create({
    gradientContainer: {
        backgroundColor: '#dbdbdb91',
    },
    sourcesSection: {
        alignSelf: 'stretch',
        paddingHorizontal: 12,
    },
    // The numbered list the inline markers count into, laid out like the one
    // on the references page: the number in its own gutter, the link beside it.
    source: {
        flexDirection: 'row',
        gap: 8,
    },
    sourceMarker: {
        width: 20,
        paddingTop: 6,
    },
    sourceLink: {
        flex: 1,
    },
});
