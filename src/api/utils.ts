export async function readApiError(response: Response): Promise<string> {
    const fallback = response.statusText || 'Request failed';

    let raw = '';
    try {
        raw = await response.text();
    } catch {
        return fallback;
    }

    if (!raw) return fallback;

    try {
        const parsed = JSON.parse(raw);
        if (typeof parsed === 'string') return parsed;
        if (parsed && typeof parsed === 'object') {
            const record = parsed as Record<string, unknown>;
            const message = typeof record.message === 'string' ? record.message : undefined;
            const errorMessage = typeof record.error === 'string' ? record.error : undefined;
            return message ?? errorMessage ?? raw;
        }
        return raw;
    } catch {
        return raw;
    }
}

