import { useCallback, useState } from 'react';
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

/**
 * System, then a dropdown of the shipped languages.
 *
 * The two are different kinds of choice, which is why they are not one flat
 * list: System is a rule ("follow the phone"), the dropdown is a specific
 * language. Keeping System as its own row means it stays readable at a glance,
 * with the language it currently resolves to on its second line, while the
 * list of languages stays collapsed until someone actually wants to change it.
 *
 * The heading is the page's, not the picker's: this is the whole content of
 * the language page, and a second "Language" above the rows only repeated it.
 *
 * The language names are endonyms and are not themselves translated: a French
 * speaker on an English UI looks for "Français", so the list has to read the
 * same whatever language the app is currently in.
 */
export function LanguagePicker() {
    const { t } = useTranslation('settings');
    const { showAlert } = useAppAlert();
    const { preference, systemEndonym, setPreference } = useLanguage();
    const [open, setOpen] = useState(false);

    const choose = useCallback(
        (next: LanguagePreference, endonym: string) => () => {
            setOpen(false);
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

    const onSystem = preference === SYSTEM_PREFERENCE;
    // On System there is no explicit choice to name, so the trigger invites one
    // rather than displaying a language the user did not pick.
    const chosen = LANGUAGES.find((language) => language.tag === preference);
    const triggerLabel = chosen?.endonym ?? t('language.choose');

    return (
        <View>
            <View style={ styles.rows }>
                <TouchableOpacity
                    style={ styles.row }
                    onPress={ choose(SYSTEM_PREFERENCE, systemEndonym) }
                    accessibilityRole="radio"
                    accessibilityState={ { selected: onSystem, checked: onSystem } }
                    accessibilityLabel={ t('language.a11yRow', {
                        label: t('language.system'),
                        detail: t('language.systemDetail', { language: systemEndonym }),
                    }) }
                    accessibilityHint={ t('language.a11yHint') }
                >
                    <View style={ styles.copy }>
                        <AppText variant="body" style={ styles.label }>
                            { t('language.system') }
                        </AppText>
                        <AppText variant="caption" style={ styles.detail }>
                            { t('language.systemDetail', { language: systemEndonym }) }
                        </AppText>
                    </View>
                    { onSystem && <SelectedMark /> }
                </TouchableOpacity>

                <DottedDivider style={ styles.divider } />

                <TouchableOpacity
                    style={ styles.row }
                    onPress={ () => setOpen((wasOpen) => !wasOpen) }
                    accessibilityRole="button"
                    accessibilityState={ { expanded: open } }
                    accessibilityLabel={ triggerLabel }
                    accessibilityHint={ t('language.a11yDropdownHint') }
                >
                    <View style={ styles.copy }>
                        <AppText
                            variant="body"
                            style={ [styles.label, chosen === undefined && styles.placeholder] }
                        >
                            { triggerLabel }
                        </AppText>
                    </View>
                    <Ionicons
                        name={ open ? 'chevron-up' : 'chevron-down' }
                        size={ 20 }
                        color={ ROW_INK }
                        // The trigger already announces its expanded state, so
                        // the glyph must not repeat it.
                        accessibilityElementsHidden
                        importantForAccessibility="no-hide-descendants"
                    />
                </TouchableOpacity>

                { open && LANGUAGES.map((language) => {
                    const selected = language.tag === preference;
                    return (
                        <View key={ language.tag }>
                            <DottedDivider style={ styles.divider } />
                            <TouchableOpacity
                                style={ [styles.row, styles.option] }
                                onPress={ choose(language.tag, language.endonym) }
                                accessibilityRole="radio"
                                accessibilityState={ { selected, checked: selected } }
                                accessibilityLabel={ language.endonym }
                                accessibilityHint={ t('language.a11yHint') }
                            >
                                <View style={ styles.copy }>
                                    <AppText variant="body" style={ styles.label }>
                                        { language.endonym }
                                    </AppText>
                                </View>
                                { selected && <SelectedMark /> }
                            </TouchableOpacity>
                        </View>
                    );
                }) }
            </View>
        </View>
    );
}

function SelectedMark() {
    return (
        <Ionicons
            name="checkmark"
            size={ 22 }
            color={ ACTION_ORANGE }
            // The row already announces its selected state, so the glyph must
            // not repeat it.
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
        />
    );
}

const ROWS_PADDING = 14;

const styles = StyleSheet.create({
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
    // Indented so an expanded language reads as sitting under the dropdown
    // rather than as a third peer of System.
    option: {
        paddingStart: 12,
    },
    copy: {
        flex: 1,
    },
    label: {
        color: ROW_INK,
    },
    placeholder: {
        color: TEXT_COLORS.secondary,
    },
    detail: {
        color: TEXT_COLORS.secondary,
        marginTop: 2,
    },
});
