import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import AppText from '../ui/AppText';
import { GlassPillButton } from '../ui/GlassPillButton';
import { PresentedModal } from '../ui/PresentedModal';
import type { Theme } from 'designs/designs-themes';
import { useTheme, useThemedStyles } from '../../context/theme';
import { SheetGlow } from './SheetGlow';

interface CalendarHintSheetProps {
    visible: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    onClose: () => void;
}

/**
 * A short note about how the screen works, in the screen's own voice.
 *
 * The app-wide alert is built for things that went wrong: it draws the error
 * gradient and announces itself to VoiceOver as an alert, whatever it is
 * asked to say. Telling someone where to tap is not a warning, so it gets the
 * calendar's own sheet instead, the same surface its reminders and its
 * scheduler arrive on, and it sits at the bottom of the screen so the month
 * it is pointing at stays in view behind it.
 */
export default function CalendarHintSheet({ visible, title, message, confirmLabel, onClose }: CalendarHintSheetProps) {
    const { t } = useTranslation('calendar');
    const { theme } = useTheme();
    const styles = useThemedStyles(makeStyles);

    if (!visible) return null;

    return (
        <PresentedModal visible transparent animationType="slide" onRequestClose={ onClose }>
            <View style={ styles.overlay }>
                <TouchableOpacity
                    style={ styles.backdrop }
                    activeOpacity={ 1 }
                    onPress={ onClose }
                    accessibilityRole="button"
                    accessibilityLabel={ t('a11y.dismissHint') }
                />
                <View style={ styles.content } testID="calendar-hint">
                    <SheetGlow />
                    <AppText variant="h2" style={ styles.title }>{ title }</AppText>
                    <AppText variant="body" style={ styles.message }>{ message }</AppText>
                    <GlassPillButton
                        label={ confirmLabel }
                        height={ 60 }
                        labelSize={ 16 }
                        labelColor={ theme.accent.mark }
                        onPress={ onClose }
                    />
                </View>
            </View>
        </PresentedModal>
    );
}

const makeStyles = (theme: Theme) => StyleSheet.create({
    overlay: {
        backgroundColor: theme.calendar.sheet.overlay,
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    content: {
        backgroundColor: theme.calendar.sheet.surface,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        gap: 14,
        padding: 20,
        paddingBottom: 40,
    },
    title: {
        color: theme.ink.primary,
        fontSize: 20,
        fontWeight: '500',
    },
    message: {
        color: theme.ink.secondary,
    },
});
