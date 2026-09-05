import AsyncStorage from '@react-native-async-storage/async-storage';
import { waitFor } from '@testing-library/react-native';
import { clearRemindersCache, getRemindersCacheRevision, readRemindersCache, writeRemindersCache, type CachedReminders } from '../remindersCache';

const entry: CachedReminders = {
    reminders: [], timeZone: 'Europe/London', morningReminderMinutes: 450,
    eveningReminderMinutes: 1215, deviceTimeZone: 'America/New_York',
    sessionsSignature: '', localDate: '2026-09-05',
};

beforeEach(async () => { jest.clearAllMocks(); await AsyncStorage.clear(); });
afterEach(() => { jest.restoreAllMocks(); });

it('orders a clear after an already-started native write and rejects later stale writes', async () => {
    const originalWrite = jest.mocked(AsyncStorage.setItem).getMockImplementation()!;
    let finishWrite!: () => void;
    const nativeWrite = new Promise<void>(resolve => { finishWrite = resolve; });
    jest.mocked(AsyncStorage.setItem).mockImplementationOnce(async (key, value) => {
        await nativeWrite;
        await originalWrite(key, value);
    });
    const revision = getRemindersCacheRevision('write-race');
    const write = writeRemindersCache(entry, 'write-race', revision);
    await waitFor(() => expect(AsyncStorage.setItem).toHaveBeenCalledTimes(1));
    const clear = clearRemindersCache('write-race');
    finishWrite();
    await Promise.all([write, clear]);
    expect(await readRemindersCache('write-race')).toBeNull();

    await writeRemindersCache(entry, 'write-race', revision);
    expect(await readRemindersCache('write-race')).toBeNull();
    await writeRemindersCache({ ...entry, timeZone: 'America/New_York' }, 'write-race');
    expect((await readRemindersCache('write-race'))?.timeZone).toBe('America/New_York');
});

it('does not reuse stale storage if native cache deletion fails', async () => {
    await writeRemindersCache(entry, 'failed-clear');
    jest.mocked(AsyncStorage.removeItem).mockRejectedValueOnce(new Error('storage unavailable'));
    await clearRemindersCache('failed-clear');
    expect(await readRemindersCache('failed-clear')).toBeNull();
});
