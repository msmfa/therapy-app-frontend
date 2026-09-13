/**
 * Translation outside React.
 *
 * API error mapping, notification payloads and utility modules all need copy
 * but have no hook to call. They import `t` from here, which is the same
 * i18next instance the components use, so a language change is reflected
 * everywhere at once.
 *
 * `t` must be called at the point the string is needed, never at module load.
 * A `const TITLE = t('…')` at the top of a module is evaluated once, before the
 * stored preference has been applied, and then never again: it would pin that
 * string to the device language for the life of the process. Error maps and
 * copy tables therefore have to be functions, not constants.
 */

import { i18next } from './index';

export const t = i18next.t.bind(i18next);
