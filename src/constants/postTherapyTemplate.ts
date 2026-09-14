import { t } from '../i18n/translate';

export type TemplateQuestion = {
    question: string;
    hint: string;
};

/**
 * The cheatsheet's five questions.
 *
 * Functions rather than the constants they used to be. A module-level array
 * would be built at import time, before the stored language preference has been
 * read, so the template would have been fixed in the device's language for the
 * life of the process.
 */
export const postTherapyTemplateTitle = (): string => t('notes:template.title');

export const postTherapyTemplateSubtitle = (): string => t('notes:template.subtitle');

export const postTherapyTemplateIntro = (): string => t('notes:template.intro');

const QUESTION_INDEXES = [1, 2, 3, 4, 5] as const;

export const postTherapyQuestions = (): TemplateQuestion[] =>
    QUESTION_INDEXES.map((index) => ({
        question: t(`notes:template.q${index}`),
        hint: t(`notes:template.h${index}`),
    }));
