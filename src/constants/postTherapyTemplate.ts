export type TemplateQuestion = {
    question: string;
    hint: string;
};

export const POST_THERAPY_TEMPLATE_TITLE = '5 Minute Post Therapy Template';

export const POST_THERAPY_TEMPLATE_SUBTITLE = 'Answer these 5 questions after your session';

export const POST_THERAPY_TEMPLATE_INTRO =
    'Write as much or as little as feels useful. This is your private note, not a record you need to make perfect.';

export const POST_THERAPY_QUESTIONS: TemplateQuestion[] = [
    {
        question: 'What stayed with you from today’s session?',
        hint: 'An idea, phrase, realisation or moment you do not want to lose.',
    },
    {
        question: 'What situation, thought or feeling do you want to notice this week?',
        hint: 'Something connected to what you discussed, if there is one.',
    },
    {
        question: 'What did you understand differently?',
        hint: 'Keep this in your own words.',
    },
    {
        question: 'Is there anything you want to try or remember?',
        hint: 'Leave this blank if nothing was agreed or suggested.',
    },
    {
        question: 'What do you want to return to in your next session?',
        hint: 'One subject is enough.',
    },
];
