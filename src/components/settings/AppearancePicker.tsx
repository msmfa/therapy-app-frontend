import { useCallback } from 'react';
import { StyleSheet, TouchableOpacity, View, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import AppText from '../ui/AppText';
import { DottedDivider } from '../ui/DottedDivider';
import { useAppAlert } from '../../context/alert';
import { t as translate } from '../../i18n/translate';
import type { Theme } from 'designs/designs-themes';
import { SYSTEM_THEME, useTheme, useThemedStyles, type ThemePreference } from '../../context/theme';

/**
 * System, Light, Dark.
 *
 * Three rows rather than a switch: System is a rule ("follow the phone"), the
 * other two are a specific look, and a two-state control cannot say which of
 * the three is in force. System carries the look it currently resolves to on
 * its second line, so the row is readable at a glance the way the language
 * page's System row is.
 *
 * The heading is the page's, not the picker's: this is the whole content of
 * the appearance page.
 */
export function AppearancePicker() {
    const { t } = useTranslation('settings');
    const { showAlert } = useAppAlert();
    const { theme, preference, setPreference } = useTheme();
    const styles = useThemedStyles(makeStyles);
    // What System resolves to right now: the device's own scheme, not the
    // one in force, which may be an override. The row has to stay honest
    // about what choosing it would do.
    const deviceScheme = useColorScheme();

    const choose = useCallback(
        (next: ThemePreference) => () => {
            void setPreference(next).catch(() => {
                // The appearance has already changed; only the persistence
                // failed. Say precisely that, rather than implying the switch
                // did not happen. The module-level `t` reads the language
                // live at the moment the alert is raised.
                showAlert(
                    translate('settings:appearance.saveFailedTitle'),
                    translate('settings:appearance.saveFailedMessage'),
                );
            });
        },
        [setPreference, showAlert],
    );

    const schemeLabel = deviceScheme === 'dark' ? t('appearance.dark') : t('appearance.light');
    const rows: { value: ThemePreference; label: string; detail?: string }[] = [
        { value: SYSTEM_THEME, label: t('appearance.system'), detail: t('appearance.systemDetail', { scheme: schemeLabel }) },
        { value: 'light', label: t('appearance.light') },
        { value: 'dark', label: t('appearance.dark') },
    ];

    return (
        <View style={ styles.rows }>
            { rows.map((row, index) => {
                const selected = preference === row.value;
                return (
                    <View key={ row.value }>
                        { index > 0 && <DottedDivider style={ styles.divider } /> }
                        <TouchableOpacity
                            style={ styles.row }
                            onPress={ choose(row.value) }
                            accessibilityRole="radio"
                            accessibilityState={ { selected, checked: selected } }
                            accessibilityLabel={ row.detail === undefined
                                ? row.label
                                : t('appearance.a11yRow', { label: row.label, detail: row.detail }) }
                            accessibilityHint={ t('appearance.a11yHint') }
                        >
                            <View style={ styles.copy }>
                                <AppText variant="body" style={ styles.label }>
                                    { row.label }
                                </AppText>
                                { row.detail !== undefined && (
                                    <AppText variant="caption" style={ styles.detail }>
                                        { row.detail }
                                    </AppText>
                                ) }
                            </View>
                            { selected && (
                                <Ionicons
                                    name="checkmark"
                                    size={ 22 }
                                    color={ theme.accent.mark }
                                    // The row already announces its selected
                                    // state, so the glyph must not repeat it.
                                    accessibilityElementsHidden
                                    importantForAccessibility="no-hide-descendants"
                                />
                            ) }
                        </TouchableOpacity>
                    </View>
                );
            }) }
        </View>
    );
}

const ROWS_PADDING = 14;

const makeStyles = (theme: Theme) => StyleSheet.create({
    rows: {
        paddingHorizontal: ROWS_PADDING,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.surface.rowGroupBorder,
        backgroundColor: theme.surface.rowGroup,
    },
    divider: {
        marginHorizontal: -ROWS_PADDING,
    },
    row: {
        minHeight: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        paddingVertical: 12,
    },
    copy: {
        flex: 1,
    },
    label: {
        color: theme.ink.primary,
    },
    detail: {
        color: theme.ink.secondary,
        marginTop: 2,
    },
});
