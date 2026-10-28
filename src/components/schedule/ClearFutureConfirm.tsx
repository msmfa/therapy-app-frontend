import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import AppText from '../ui/AppText';
import { GlassPillButton } from '../ui/GlassPillButton';
import { PresentedModal } from '../ui/PresentedModal';
import { SheetGlow } from '../therapy-calendar/SheetGlow';
import type { Theme } from 'designs/designs-themes';
import { useTheme, useThemedStyles } from '../../context/theme';

type Props = {
    visible: boolean;
    busy?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
};

/** The calendar's end-series confirm, worded for clearing every future session. */
export function ClearFutureConfirm({ visible, busy = false, onConfirm, onCancel }: Props) {
    const { theme } = useTheme();
    const styles = useThemedStyles(makeStyles);
    const { t } = useTranslation('calendar');

    return (
        <PresentedModal visible={ visible } transparent animationType="slide" onRequestClose={ onCancel }>
            <View style={ styles.overlay }>
                <TouchableOpacity
                    style={ StyleSheet.absoluteFill }
                    activeOpacity={ 1 }
                    onPress={ onCancel }
                    accessibilityRole="button"
                    accessibilityLabel={ t('schedule.keepSeries') }
                />
                <View style={ styles.sheet } testID="session-schedule.clear-confirm">
                    <SheetGlow />
                    <AppText variant="h2" style={ styles.title }>
                        { t('schedule.clearFutureTitle') }
                    </AppText>
                    <AppText variant="body" style={ styles.message }>
                        { t('schedule.clearFutureMessage') }
                    </AppText>
                    <GlassPillButton
                        label={ t('schedule.clearFutureConfirm') }
                        height={ 60 }
                        labelSize={ 16 }
                        fillColor={ theme.status.danger }
                        disabled={ busy }
                        disabledLabelColor={ theme.glass.disabledLabel }
                        onPress={ onConfirm }
                        testID="session-schedule.clear-confirm.confirm"
                    />
                    <GlassPillButton
                        label={ t('schedule.keepSeries') }
                        height={ 60 }
                        labelSize={ 16 }
                        labelColor={ theme.accent.mark }
                        onPress={ onCancel }
                        testID="session-schedule.clear-confirm.keep"
                    />
                </View>
            </View>
        </PresentedModal>
    );
}

const makeStyles = (theme: Theme) => StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: theme.calendar.sheet.overlay,
    },
    sheet: {
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
