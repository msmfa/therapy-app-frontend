import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { ChoiceRow, Dropdown } from '../ui/Dropdown';
import { useAppAlert } from '../../context/alert';
import { LANGUAGES } from '../../i18n/languages';
import { SYSTEM_PREFERENCE, type LanguagePreference } from '../../i18n/resolve';
import { t as translate } from '../../i18n/translate';
import { useLanguage } from '../../i18n/useLanguage';

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

    const onSystem = preference === SYSTEM_PREFERENCE;
    const options = LANGUAGES.map((language) => ({ id: language.tag, label: language.endonym }));

    // On System there is no explicit choice to name, so the trigger invites one
    // rather than displaying a language the user did not pick.
    return (
        <Dropdown
            options={ options }
            value={ preference }
            placeholder={ t('language.choose') }
            onChange={ (tag) => choose(tag, LANGUAGES.find((language) => language.tag === tag)?.endonym ?? tag)() }
            triggerHint={ t('language.a11yDropdownHint') }
            optionHint={ t('language.a11yHint') }
            leading={
                <ChoiceRow
                    label={ t('language.system') }
                    detail={ t('language.systemDetail', { language: systemEndonym }) }
                    selected={ onSystem }
                    onPress={ choose(SYSTEM_PREFERENCE, systemEndonym) }
                    accessibilityLabel={ t('language.a11yRow', {
                        label: t('language.system'),
                        detail: t('language.systemDetail', { language: systemEndonym }),
                    }) }
                    accessibilityHint={ t('language.a11yHint') }
                />
            }
        />
    );
}
