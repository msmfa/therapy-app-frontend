import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAnalyticsSdkStorage, clearAnalyticsStorage } from '../storage';
import { SDK_STORAGE_KEY } from '../config';

beforeEach(async () => { await AsyncStorage.clear(); });
const sdkKey = '.posthog-rn.json';

test('same-account restart retains SDK outbox payload and original timestamps', async () => {
    const payload = JSON.stringify({ version: 'v1', content: { distinct_id: 'A', queue: [{ message: { event: 'note_saved', timestamp: '2025-01-01T00:00:00Z' } }] } });
    const first = createAnalyticsSdkStorage('A', () => true, () => 'A');
    await first.setItem(sdkKey, payload);
    const restarted = createAnalyticsSdkStorage('A', () => true, () => 'A');
    expect(await restarted.getItem(sdkKey)).toBe(payload);
});

test('stale A outbox and malformed/untagged storage never enter B SDK initialization', async () => {
    const first = createAnalyticsSdkStorage('A', () => true, () => 'A');
    await first.setItem(sdkKey, 'private A queue');
    const next = createAnalyticsSdkStorage('B', () => true, () => 'B');
    expect(await next.getItem(sdkKey)).toBeNull();
    await AsyncStorage.setItem(`${SDK_STORAGE_KEY}${sdkKey}`, '{"queue":["old-unscoped"]}');
    expect(await next.getItem(sdkKey)).toBeNull();
    await AsyncStorage.setItem(`${SDK_STORAGE_KEY}${sdkKey}`, 'broken');
    expect(await next.getItem(sdkKey)).toBeNull();
});

test('identity generation changes while native read awaits discard its result', async () => {
    let current = true;
    const storage = createAnalyticsSdkStorage('A', () => current, () => 'A');
    await storage.setItem(sdkKey, 'A payload');
    const read = storage.getItem(sdkKey);
    current = false;
    expect(await read).toBeNull();
});

test('queue removal is ordered after pending SDK writes and affects only analytics keys', async () => {
    await AsyncStorage.setItem('other-app-data', 'keep');
    const storage = createAnalyticsSdkStorage('A', () => true, () => 'A');
    const write = storage.setItem(sdkKey, 'queued');
    const clear = clearAnalyticsStorage();
    await Promise.all([write, clear]);
    expect(await storage.getItem(sdkKey)).toBeNull();
    expect(await AsyncStorage.getItem('other-app-data')).toBe('keep');
});
