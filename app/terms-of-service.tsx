/**
 * The agreement is rendered from the `legal.terms` resource rather than
 * written inline, for the same reason as the privacy policy: eleven sections
 * of identical structure, and inline copy per language drifts.
 *
 * The French text is a translation of the English agreement, not an agreement
 * drafted for a French jurisdiction. Section 10 still names England and Wales
 * as the governing law. It needs review by a lawyer in the target
 * jurisdiction before release.
 */
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet, View } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import AppText from '../src/components/ui/AppText';
import Spacer, { SpacerVariant } from 'src/components/ui/Spacer';
import { GlassCircleButton } from '../src/components/ui/GlassCircleButton';
import { COLOR_VARIANTS } from 'designs/designs-colors';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

/** The sections, in reading order. See the note in app/privacy-policy.tsx. */
const SECTION_KEYS = ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9', 's10', 's11'] as const;

type SectionKey = (typeof SECTION_KEYS)[number];

const bodiesFor = (translate: TFunction<'legal'>, key: SectionKey): string[] =>
    translate(`terms.${key}.bodies`, { returnObjects: true }) as unknown as string[];

export default function TermsOfServiceScreen() {
    const { t } = useTranslation('common');
    const { t: tLegal } = useTranslation('legal');
    const router = useRouter();

    const handleBack = () => {
        router.back();
    };

    return (
        <SafeAreaView style={ styles.container } edges={ ['top', 'left', 'right'] }>
            <View style={ styles.pageHeader }>
                <GlassCircleButton
                    accessibilityLabel={ t('action.back') }
                    icon="back"
                    iconColor={ COLOR_VARIANTS.black.primary }
                    size={ 48 }
                    onPress={ handleBack }
                />
            </View>
            <MaskedView
                style={ styles.scroll }
                maskElement={
                    <LinearGradient
                        colors={ ['transparent', '#000000', '#000000'] }
                        locations={ [0, 0.05, 1] }
                        style={ StyleSheet.absoluteFillObject }
                    />
                }
            >
                <ScrollView
                    style={ styles.scroll }
                    contentContainerStyle={ styles.scrollContent }
                    showsVerticalScrollIndicator={ false }
                >
                    <AppText variant='h1'>{ t('screen.termsOfService') }</AppText>

                    { SECTION_KEYS.map((key) => (
                        <React.Fragment key={ key }>
                            <Spacer variant={ SpacerVariant.large } />
                            <View style={ styles.section }>
                                <AppText variant='h2'>{ tLegal(`terms.${key}.heading`) }</AppText>
                                { bodiesFor(tLegal, key).map((paragraph, index) => (
                                    <React.Fragment key={ index }>
                                        <Spacer variant={ SpacerVariant.small } />
                                        <AppText variant='body'>{ paragraph }</AppText>
                                    </React.Fragment>
                                )) }
                            </View>
                        </React.Fragment>
                    )) }

                    <Spacer variant={ SpacerVariant.large } />
                </ScrollView>
            </MaskedView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    pageHeader: {
        alignItems: 'center',
        flexDirection: 'row',
        paddingBottom: 8,
        paddingHorizontal: 24,
        paddingTop: 8,
    },
    container: {
        flex: 1,
        backgroundColor: COLOR_VARIANTS.white.primary,
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 72,
        gap: 0,
    },
    section: {
        gap: 8,
    },
});
