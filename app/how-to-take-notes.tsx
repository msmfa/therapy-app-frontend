import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Linking, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import AppText from '../src/components/ui/AppText';
import { GlassCircleButton } from '../src/components/ui/GlassCircleButton';
import { NoteSheetBackdrop } from '../src/components/notes/NoteSheetBackdrop';
import { DottedGrid } from '../src/components/ui/DottedGrid';
import { useTranslation } from 'react-i18next';
import type { Theme } from 'designs/designs-themes';
import { useTheme, useThemedStyles } from '../src/context/theme';
const RESEARCH_URL = 'https://www.plastic-brains.com/after-therapy-note-template/';

export default function HowToTakeNotesScreen() {
    const { t } = useTranslation('common');
    const { t: tScience } = useTranslation('science');
    const router = useRouter();
    const { theme } = useTheme();
    const styles = useThemedStyles(makeStyles);

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
                    iconColor={ theme.ink.primary }
                    size={ 48 }
                    onPress={ handleBack }
                />
                <AppText variant="h3" style={ styles.headerTitle }>
                    { tScience('template.title') }
                </AppText>
            </View>

            { /* The sheet below carries the questions and the guidance about
                 how much to write, so this page says one thing only, and that
                 one thing is a way through to the research. */ }
            <View style={ styles.intro }>
                <AppText
                    variant="body"
                    onPress={ handleOpenResearch }
                    accessibilityRole="link"
                    style={ [styles.link, styles.introText] }
                >
                    { tScience('template.research') }
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
        </SafeAreaView>
    );
}

const makeStyles = (theme: Theme) => StyleSheet.create({
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
    // The app's own link ink, the one citations and external links use,
    // rather than the danger red this page had reached for.
    link: {
        color: theme.link.bright,
        fontWeight: '600',
    },
    sheetArea: {
        flex: 1,
        marginTop: 12,
    },
    cheatsheetLayer: {
        ...StyleSheet.absoluteFillObject,
        // Under its siblings, so the button below lays over it.
        zIndex: -1,
    },
    cheatsheet: {
        // The page is one line of prose now, so the sheet takes the room that
        // freed up. The tilt still has to fit: at 4 degrees a tall sheet gains
        // about 30pt of width, so it stops short of the full width and the
        // nudge left below keeps that growth off the screen edge.
        width: '92%',
        alignSelf: 'center',
        borderRadius: 18,
        // Nudged left before the tilt is applied, so the offset is in plain
        // page space rather than the rotated one.
        // Tilted a few degrees left, so it reads as a picture of the sheet
        // rather than part of this page's layout.
        transform: [{ translateX: -8 }, { rotate: '-4deg' }],
    },
});
