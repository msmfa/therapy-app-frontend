import React, { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { LayoutChangeEvent, StyleSheet, View, useWindowDimensions } from 'react-native';
import { AppModal } from 'src/components/Modal';
import { ScienceTextModal } from 'src/components/ScienceTextModal';
import { REMINDER_SCIENCE_COPY } from 'src/constants/neuroReminders';
import AppText from 'src/components/ui/AppText';
import Spacer, { SpacerVariant } from 'src/components/ui/Spacer';
import { AuraPanel } from 'src/components/ui/AuraPanel';
import { GlassButtonOutline } from 'src/components/ui/GlassButtonOutline';
import { GlassCircleButton } from 'src/components/ui/GlassCircleButton';
import { GlassPillButton } from 'src/components/ui/GlassPillButton';
import { COLOR_VARIANTS, PALETTE } from 'designs/designs-colors';
import { BRAND_FONTS } from 'designs/designs-typography';
import { ReminderType } from '../../utils/types';

const CARD_RADIUS = 28;
// The photo is inset from the card by a hair on three sides, and its corners
// are rounded by the card radius less that inset so the two curves are
// concentric.
const PHOTO_INSET = 2;
const PHOTO_RADIUS = CARD_RADIUS - PHOTO_INSET;
/** However tall the frame's proportions make it, the photo takes no more of a
 * short screen than this, so the card still fits a page that does not scroll. */
const PHOTO_MAX_SCREEN_SHARE = 0.38;

/** The glow's core, brighter than the panel's own default. */
const AURA_CORE = '#F3782C';

/**
 * The footer's tone at its deepest, at the bottom of the card: SURFACE_BLUE's
 * hue lifted most of the way to white. The band starts from the card's own
 * white and settles into this, so it has no top edge, and by the time it
 * reaches the buttons there is enough of it for their white outline tray to
 * read against.
 */
const FOOTER_TINT = 'hsl(206.67, 17.65%, 93.5%)';

/** The copy is clamped so every card is the same height whatever its length. */
const DESCRIPTION_LINES = 3;

// The app's footer row, as built on the home and calendar tabs: buttons pushed
// to the ends of the row with the outline tray drawn between them, and a 16pt
// label. 72pt is the size the app uses; a narrower card takes a share of its
// own width instead, and the pill sizes to its label either way.
const ACTION_MAX_SIZE = 72;
const ACTION_SIZE_SHARE = 0.21;
const ACTION_LABEL_SIZE = 16;
// The copy and the footer row start a little further in than the photo does.
const COPY_INSET = 20;

type Props = {
    date: string;
    description: string;
    link: ReminderType;
    /** Spelled out on the aura panel, on its 5x7 dot lattice. */
    time: string;
    /** The line under it, in the panel's own caption style. */
    caption: string;
};

/**
 * The carousel card: a photo under a small margin, the copy beneath it, and
 * the home screen's glass buttons on the bottom row. The photo fades into the
 * card rather than ending on a hard edge.
 */
export function ReminderCard({ date, description, link, time, caption }: Props) {
    const { height: screenHeight } = useWindowDimensions();
    const [isModalOpen, setModalOpen] = useState(false);
    // The aura panel is drawn at an explicit size, so the frame is measured
    // rather than letting the artwork size itself.
    const [panel, setPanel] = useState({ width: 0, height: 0 });
    const openModal = () => setModalOpen(true);

    const actionSize = panel.width > 0
        ? Math.round(Math.min(ACTION_MAX_SIZE, panel.width * ACTION_SIZE_SHARE))
        : ACTION_MAX_SIZE;

    const handlePanelLayout = (event: LayoutChangeEvent) => {
        const { width, height } = event.nativeEvent.layout;
        setPanel({ width, height });
    };

    return (
        <>
            <View style={ styles.card }>
                <View
                    style={ [styles.photoFrame, { maxHeight: screenHeight * PHOTO_MAX_SCREEN_SHARE }] }
                    onLayout={ handlePanelLayout }
                >
                    { panel.width > 0 && (
                        <AuraPanel
                            text={ time }
                            caption={ caption }
                            coreColor={ AURA_CORE }
                            width={ panel.width }
                            height={ panel.height }
                        />
                    ) }
                </View>

                <View style={ styles.copy }>
                    <AppText variant="h2" style={ styles.title }>
                        { date }
                    </AppText>
                    <Spacer variant={ SpacerVariant.small } />
                    <AppText
                        variant="bodySecondary"
                        align="left"
                        style={ styles.description }
                        numberOfLines={ DESCRIPTION_LINES }
                        ellipsizeMode="tail"
                    >
                        { description }
                    </AppText>
                </View>

                <View style={ styles.footer }>
                    <LinearGradient
                        pointerEvents="none"
                        colors={ [COLOR_VARIANTS.white.primary, FOOTER_TINT] }
                        style={ StyleSheet.absoluteFill }
                    />
                    <View style={ styles.actions }>
                        <GlassButtonOutline buttonSize={ actionSize } opacity={ 0.9 } />
                        <GlassPillButton
                            accessibilityLabel={ `Learn more about ${date}` }
                            label="Learn more"
                            height={ actionSize }
                            labelSize={ ACTION_LABEL_SIZE }
                            labelColor={ COLOR_VARIANTS.black.primary }
                            onPress={ openModal }
                        />
                        <GlassCircleButton
                            accessibilityLabel={ `The science behind ${date}` }
                            icon="forward"
                            iconColor={ COLOR_VARIANTS.black.tertiary }
                            size={ actionSize }
                            onPress={ openModal }
                        />
                    </View>
                </View>
            </View>
            { isModalOpen && (
                <AppModal
                    isVisible={ true }
                    title={ REMINDER_SCIENCE_COPY[link].title }
                    onClose={ () => setModalOpen(false) }
                >
                    <ScienceTextModal type={ link } />
                </AppModal>
            ) }
        </>
    );
}

const styles = StyleSheet.create({
    card: {
        // flexGrow rather than flex: a zero flex-basis would report the card as
        // having no height of its own, and the deck sizes its row from the
        // tallest card's natural height before stretching the rest to match.
        flexGrow: 1,
        borderRadius: CARD_RADIUS,
        backgroundColor: COLOR_VARIANTS.white.primary,
        padding: PHOTO_INSET,
        shadowColor: PALETTE.neutral.black,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 10,
    },
    photoFrame: {
        borderRadius: PHOTO_RADIUS,
        overflow: 'hidden',
        aspectRatio: 1,
    },
    // General Sans is the carousel's face; the rest of the app keeps the
    // system font, so the family is named here rather than in TYPOGRAPHY.
    title: {
        fontFamily: BRAND_FONTS.medium,
        fontWeight: undefined,
    },
    description: {
        fontFamily: BRAND_FONTS.regular,
        fontWeight: undefined,
        lineHeight: 24,
    },
    copy: {
        flexGrow: 1,
        paddingHorizontal: COPY_INSET,
        paddingTop: 16,
    },
    // The buttons are the app's glass ones, which need something behind them
    // to read against: on white the tray outline disappears. The footer takes
    // the same tint and radius as the photo panel, so the card is a pale band
    // at each end with the copy on white between them.
    footer: {
        marginTop: 16,
        borderRadius: PHOTO_RADIUS,
        overflow: 'hidden',
        paddingHorizontal: COPY_INSET - 2,
        paddingVertical: 16,
    },
    // The home screen's footer row: an outline tray drawn around a row whose
    // first and last children are the two buttons.
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
});
