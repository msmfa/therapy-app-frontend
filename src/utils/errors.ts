export const toError = (error: unknown, fallbackMessage = 'Unknown error'): Error => {
    if (error instanceof Error) {
        return error;
    }

    if (typeof error === 'string') {
        return new Error(error);
    }

    try {
        return new Error(JSON.stringify(error));
    } catch {
        return new Error(fallbackMessage);
    }
};

export const handleError = (
    error: unknown,
    fallbackMessage = 'Something went wrong. Please try again.',
): string => {
    const resolved = toError(error, fallbackMessage);
    const message = resolved.message?.trim();

    return message || fallbackMessage;
};
