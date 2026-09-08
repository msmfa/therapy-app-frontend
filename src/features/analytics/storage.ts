import AsyncStorage from '@react-native-async-storage/async-storage';
import { SDK_STORAGE_KEY } from './config';

let writes = Promise.resolve();
const persist = (operation: () => Promise<void>) => {
    const next = writes.then(operation);
    writes = next.catch(() => undefined);
    return next;
};
/** Validate ownership before the SDK can hydrate or flush its durable queue. */
export const createAnalyticsSdkStorage = (
    initialOwner: string | null,
    isCurrent: () => boolean,
    getOwner: () => string | null,
) => ({
    getItem: async (key: string) => {
        await writes;
        const raw = await AsyncStorage.getItem(`${SDK_STORAGE_KEY}${key}`);
        if (!isCurrent() || !raw) return null;
        try {
            const stored: unknown = JSON.parse(raw);
            if (!stored || typeof stored !== 'object') return null;
            const record = stored as Record<string, unknown>;
            return record.owner === initialOwner && typeof record.payload === 'string' ? record.payload : null;
        } catch { return null; }
    },
    setItem: (key: string, value: string) => {
        const envelope = JSON.stringify({ owner: getOwner(), payload: value });
        return persist(() => AsyncStorage.setItem(`${SDK_STORAGE_KEY}${key}`, envelope));
    },
});
export const clearAnalyticsStorage = () => persist(async () => {
    await Promise.all(['.posthog-rn.json', '.posthog-rn-logs.json'].map((key) => AsyncStorage.removeItem(`${SDK_STORAGE_KEY}${key}`)));
});
