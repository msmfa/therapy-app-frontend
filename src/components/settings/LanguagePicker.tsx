import { useCallback } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import AppText from '../ui/AppText';
import { DottedDivider } from '../ui/DottedDivider';
import { useAppAlert } from '../../context/alert';
import { LANGUAGES } from '../../i18n/languages';
import { SYSTEM_PREFERENCE, type LanguagePreference } from '../../i18n/resolve';
import { t as translate } from '../../i18n/translate';
import { useLanguage } from '../../i18n/useLanguage';
import { ACTION_ORANGE, COLOR_VARIANTS, PALETTE, TEXT_COLORS } from 'designs/designs-colors';

const ROW_INK = COLOR_VARIANTS.black.primary;

type Option = {
    preference: LanguagePreference;
    /** The row's own text. "System", "English", "Français". */
    label: string;
    /** Second line, only on System, naming the language it resolves to. */
    detail?: string;
    /** The language this row actually selects, for the failure message. */
    endonym: string;
};

/**
 * System, English, Français.
 *
 * The language names are endonyms and are not themselves translated: a French
 * speaker on an English UI looks for "Français", so the list has to read the
 * same whatever language the app is currently in.
 */
export function LanguagePicker() {
    const { t } = useTranslation('settings');
    const { showAlert } = useAppAlert();
    const { preference, systemEndonym, setPreference } = useLanguage();

    const choose = useCallback(
        (next: LanguagePreference, endonym: string) => () => {
            void setPreference(next).catch(() => {
                // The language has already changed; only the persistence
                // failed. Say precisely that, rather than implying the switch
                // did not happen.
                //
                // The module-level `t`, not the hook's. The hook's `t` is
                // captured from the render that drew this row, which happened
                // while the *previous* language was showing, so it would
                // announce a French UI in English. This one reads the language
                // that is live at the moment the alert is raised.
                showAlert(
                    translate('settings:language.saveFailedTitle'),
                    translate('settings:language.saveFailedMessage', { language: endonym }),
                );
            });
        },
        [setPreference, showAlert],
    );

    const options: Option[] = [
        {
            preference: SYSTEM_PREFERENCE,
            label: t('language.system'),
            detail: t('language.systemDetail', { language: systemEndonym }),
            // The language the *app* would end up in, which is what the failure
            // message names. "System" is the name of the setting, not of a
            // language, so it would read "The app is now in System".
            endonym: systemEndonym,
        },
        ...LANGUAGES.map((language) => ({
            preference: language.tag,
            label: language.endonym,
            endonym: language.endonym,
        })),
    ];

    return (
        <View>
            <AppText variant="h3" style={ styles.heading }>
                { t('language.title') }
            </AppText>
            <View style={ styles.rows }>
                { options.map((option, index) => {
                    const selected = option.preference === preference;
                    return (
                        <View key={ option.preference }>
                            { index > 0 && <DottedDivider style={ styles.divider } /> }
                            <TouchableOpacity
                                style={ styles.row }
                                onPress={ choose(option.preference, option.endonym) }
                                accessibilityRole="radio"
                                accessibilityState={ { selected, checked: selected } }
                                accessibilityLabel={
                                    option.detail === undefined
                                        ? option.label
                                        : t('language.a11yRow', {
                                            label: option.label,
                                            detail: option.detail,
                                        })
                                }
                                accessibilityHint={ t('language.a11yHint') }
                            >
                                <View style={ styles.copy }>
                                    <AppText variant="body" style={ styles.label }>
                                        { option.label }
                                    </AppText>
                                    { option.detail !== undefined && (
                                        <AppText variant="caption" style={ styles.detail }>
                                            { option.detail }
                                        </AppText>
                                    ) }
                                </View>
                                { selected && (
                                    <Ionicons
                                        name="checkmark"
                                        size={ 22 }
                                        color={ ACTION_ORANGE }
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
        </View>
    );
}

const ROWS_PADDING = 14;

const styles = StyleSheet.create({
    heading: {
        fontSize: 17,
        marginBottom: 10,
        // Logical rather than `marginLeft`, so a future RTL language mirrors
        // this without a styling sweep.
        marginStart: 4,
    },
    rows: {
        paddingHorizontal: ROWS_PADDING,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: PALETTE.overlay.whiteBorderTransparent,
        backgroundColor: COLOR_VARIANTS.white.secondary,
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
        color: ROW_INK,
    },
    detail: {
        color: TEXT_COLORS.secondary,
        marginTop: 2,
    },
});
