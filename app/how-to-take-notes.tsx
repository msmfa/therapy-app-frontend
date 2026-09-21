import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Linking, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import AppText from '../src/components/ui/AppText';
import Spacer, { SpacerVariant } from 'src/components/ui/Spacer';
import { GlassCircleButton } from '../src/components/ui/GlassCircleButton';
import { TemplateHelpModal } from '../src/components/notes/TemplateHelpModal';
import { NoteSheetBackdrop } from '../src/components/notes/NoteSheetBackdrop';
import { COLOR_VARIANTS } from 'designs/designs-colors';
import { DottedGrid } from '../src/components/ui/DottedGrid';
import { useTranslation } from 'react-i18next';
const RESEARCH_URL = 'https://www.plastic-brains.com/after-therapy-note-template/';

export default function HowToTakeNotesScreen() {
    const { t } = useTranslation('common');
    const { t: tScience } = useTranslation('science');
    const router = useRouter();
    const [helpVisible, setHelpVisible] = React.useState(false);

    const handleBack = () => router.back();
    // Linking rather than expo-web-browser, matching how settings.tsx opens
    // external pages.
    const handleOpenResearch = () => {
        Linking.openURL(RESEARCH_URL).catch(() => {});
    };

    return (
        // No bottom edge: the sheet below is meant to run off the screen rather
        // than stop short above the home indicator.
        <SafeAreaView style={ styles.container } edges={ ['top', 'left', 'right'] }>
            { /* Graph-paper ruling behind the page, so the template reads as
                 something you write on. */ }
            <DottedGrid />

            <View style={ styles.header }>
                <GlassCircleButton
                    accessibilityLabel={ t('action.back') }
                    icon="back"
                    iconColor={ COLOR_VARIANTS.black.primary }
                    size={ 48 }
                    onPress={ handleBack }
                />
                <AppText variant="h3" style={ styles.headerTitle }>
                    { tScience('template.title') }
                </AppText>
            </View>

            { /* The sheet below already carries the questions and the guidance
                 about how much to write, so this page does not repeat them. */ }
            <View style={ styles.intro }>
                <AppText variant="body" style={ styles.introText }>
                    { tScience('template.recommendBefore') }{ ' ' }
                    <AppText
                        variant="body"
                        onPress={ () => setHelpVisible(true) }
                        accessibilityRole="link"
                        style={ [styles.link, styles.introText] }
                    >
                        { tScience('template.cheatsheetLink') }
                    </AppText>
                    .
                </AppText>
                <Spacer variant={ SpacerVariant.medium } />
                <AppText variant="body" style={ styles.introText }>
                    { tScience('template.researchBefore') }{ ' ' }
                    <AppText
                        variant="body"
                        onPress={ handleOpenResearch }
                        accessibilityRole="link"
                        style={ [styles.link, styles.introText] }
                    >
                        { tScience('template.researchLink') }
                    </AppText>
                    .
                </AppText>
            </View>

            { /* Fills what is left of the screen and runs off the bottom, so
                 the questions read as a sheet tucked behind the page. */ }
            <View style={ styles.sheetArea }>
                <View style={ styles.cheatsheetLayer } pointerEvents="none">
                    <NoteSheetBackdrop
                        style={ styles.cheatsheet }
                        accessibilityLabel={ tScience('template.cheatsheetImage') }
                    />
                </View>
            </View>

            <TemplateHelpModal
                visible={ helpVisible }
                onClose={ () => setHelpVisible(false) }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingHorizontal: 24,
        paddingTop: 8,
        paddingBottom: 28,
    },
    headerTitle: {
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    intro: { paddingHorizontal: 24 },
    // A step up from body: this is the page's only prose, and it sits above a
    // sheet set in larger type.
    introText: {
        fontSize: 18,
        lineHeight: 26,
    },
    link: {
        color: COLOR_VARIANTS.red.primary,
        fontWeight: '600',
    },
    sheetArea: {
        flex: 1,
        marginTop: 20,
    },
    cheatsheetLayer: {
        ...StyleSheet.absoluteFillObject,
        // Under its siblings, so the button below lays over it.
        zIndex: -1,
    },
    cheatsheet: {
        // Narrow enough that the tilt's wider bounding box still fits the
        // screen: at 4 degrees a tall sheet gains about 30pt of width, which
        // was clipping its left edge at 90%. The height is the drawn sheet's
        // own, so the paper ends where the last question does.
        width: '80%',
        alignSelf: 'center',
        borderRadius: 18,
        // Nudged left before the tilt is applied, so the offset is in plain
        // page space rather than the rotated one.
        // Tilted a few degrees left, so it reads as a picture of the sheet
        // rather than part of this page's layout.
        transform: [{ translateX: -18 }, { rotate: '-4deg' }],
    },
});
