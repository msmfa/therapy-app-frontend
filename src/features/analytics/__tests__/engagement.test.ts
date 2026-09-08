import { waitFor } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import { allowedEventProperties } from '../events';
import { analytics } from '../client';
import { beginEngagement, captureNoteOpened } from '../engagement';

const mockStore = new Map<string, string>();
let mockEnabled = true;
let mockGeneration = 0;
let mockVisit = 'private-visit-one';
const mockEvents: { event: string; properties: unknown }[] = [];
const mockCapture = jest.fn((event: string, properties: unknown) => {
    if (!mockEnabled) return false;
    const sanitized = allowedEventProperties(event, properties);
    if (!sanitized) return false;
    mockEvents.push({ event, properties: sanitized });
    return true;
});

jest.mock('../client', () => ({ analytics: {
    capture: (...args: Parameters<typeof mockCapture>) => mockCapture(...args),
    getVisitId: () => mockVisit,
    registerCleanup: jest.fn(() => jest.fn()),
    beginOperation: jest.fn(() => {
        const enabled = mockEnabled;
        const generation = mockGeneration;
        const isCurrent = () => enabled && mockEnabled && generation === mockGeneration;
        return { enabled, isCurrent, capture: (...args: Parameters<typeof mockCapture>) => isCurrent() && mockCapture(...args) };
    }),
} }));
jest.mock('expo-secure-store', () => ({
    getItemAsync: jest.fn(async (key: string) => mockStore.get(key) ?? null),
    setItemAsync: jest.fn(async (key: string, value: string) => { mockStore.set(key, value); }),
    deleteItemAsync: jest.fn(async (key: string) => { mockStore.delete(key); }),
}));

const cleanup = jest.mocked(analytics.registerCleanup).mock.calls[0][0];
const stored = () => JSON.parse(mockStore.get('analytics.engagement.v1')!);
const first = async () => true;
const firstReview = async () => ({ overall: true, forNote: true });

beforeEach(async () => {
    mockGeneration += 1;
    await cleanup('opt_out', null);
    jest.clearAllMocks();
    mockStore.clear();
    mockEvents.length = 0;
    mockEnabled = true;
    mockVisit = 'private-visit-one';
});

it('does not read or persist sidecar data without consent', async () => {
    mockEnabled = false;
    beginEngagement('private-user').noteSaved('private-note', 'new', first);
    beginEngagement('private-user').reviewCompleted('private-note', 1, 'post_sleep', firstReview);
    await Promise.resolve();
    expect(SecureStore.getItemAsync).not.toHaveBeenCalled();
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
    expect(mockEvents).toEqual([]);
});

it('reports a successful save once and sends no local identifiers or visit values', async () => {
    const operation = beginEngagement('private-user');
    operation.noteSaved('private-note', 'new', first);
    operation.noteSaved('private-note', 'new', first);
    await waitFor(() => expect(SecureStore.setItemAsync).toHaveBeenCalledTimes(1));

    expect(mockEvents).toEqual([{ event: 'note_saved', properties: {
        operation: 'new', is_first_note: true, entry_point: 'note_editor',
    } }]);
    expect(JSON.stringify(mockEvents)).not.toMatch(/private-user|private-note|private-visit/);
});

it('derives same-note later-visit activation locally, without giving another note that credit', async () => {
    beginEngagement('private-user').noteSaved('saved-note', 'new', first);
    await waitFor(() => expect(SecureStore.setItemAsync).toHaveBeenCalledTimes(1));
    mockVisit = 'private-visit-two';
    beginEngagement('private-user').reviewCompleted('saved-note', 1, 'post_sleep', firstReview);
    beginEngagement('private-user').reviewCompleted('other-note', 2, 'unprompted', async () => ({ overall: false, forNote: true }));
    await waitFor(() => expect(SecureStore.setItemAsync).toHaveBeenCalledTimes(3));

    expect(mockEvents[1].properties).toMatchObject({ first_review: true, is_first_review_for_note: true, note_saved_on_previous_visit: true });
    expect(mockEvents[2].properties).toMatchObject({ first_review: false, is_first_review_for_note: true, note_saved_on_previous_visit: false });
    expect(JSON.stringify(mockEvents)).not.toMatch(/saved-note|other-note|private-visit/);
});

it('does not call a same-visit review activation or reset first-review flags on later edits', async () => {
    beginEngagement('private-user').noteSaved('note', 'new', first);
    beginEngagement('private-user').reviewCompleted('note', 1, 'post_session', firstReview);
    await waitFor(() => expect(SecureStore.setItemAsync).toHaveBeenCalledTimes(2));
    expect(mockEvents[1].properties).toMatchObject({ note_saved_on_previous_visit: false });

    mockVisit = 'private-visit-two';
    beginEngagement('private-user').noteSaved('note', 'edit', first);
    beginEngagement('private-user').reviewCompleted('note', 2, 'post_sleep', firstReview);
    await waitFor(() => expect(SecureStore.setItemAsync).toHaveBeenCalledTimes(4));
    expect(mockEvents[2].properties).toMatchObject({ operation: 'edit', is_first_note: false });
    expect(mockEvents[3].properties).toMatchObject({ first_review: false, is_first_review_for_note: false, note_saved_on_previous_visit: true });
});

it('retains local correlation and deduplication when the helper reloads', async () => {
    beginEngagement('private-user').noteSaved('saved-note', 'new', first);
    await waitFor(() => expect(SecureStore.setItemAsync).toHaveBeenCalledTimes(1));
    let restarted!: typeof import('../engagement');
    jest.isolateModules(() => { restarted = require('../engagement'); });
    mockVisit = 'restarted-visit';
    restarted.beginEngagement('private-user').noteSaved('saved-note', 'new', first);
    restarted.beginEngagement('private-user').reviewCompleted('saved-note', 1, 'post_sleep', firstReview);
    await waitFor(() => expect(mockEvents).toHaveLength(2));
    expect(mockEvents[1].properties).toMatchObject({ note_saved_on_previous_visit: true });
});

it('drops work whose consent/account epoch changed before or during metadata lookup', async () => {
    const earlier = beginEngagement('account-a');
    mockGeneration += 1;
    earlier.noteSaved('a-note', 'new', first);
    expect(SecureStore.getItemAsync).not.toHaveBeenCalled();

    let finishCount!: (value: boolean) => void;
    const count = jest.fn(() => new Promise<boolean>((resolve) => { finishCount = resolve; }));
    beginEngagement('account-a').noteSaved('a-note', 'new', count);
    await waitFor(() => expect(count).toHaveBeenCalled());
    mockGeneration += 1;
    finishCount(true);
    await Promise.resolve();
    expect(mockEvents).toEqual([]);
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
});

it('does not reuse account A activation metadata for account B', async () => {
    beginEngagement('account-a').noteSaved('same-local-note', 'new', first);
    await waitFor(() => expect(SecureStore.setItemAsync).toHaveBeenCalledTimes(1));
    mockGeneration += 1;
    mockVisit = 'other-account-visit';
    beginEngagement('account-b').reviewCompleted('same-local-note', 1, 'post_sleep', firstReview);
    await waitFor(() => expect(SecureStore.setItemAsync).toHaveBeenCalledTimes(2));
    expect(mockEvents[1].properties).toMatchObject({ note_saved_on_previous_visit: false });
    expect(stored().owner).toBe('account-b');
});

it('cleans up after an already-started native write when analytics is withdrawn', async () => {
    const nativeWrite = jest.mocked(SecureStore.setItemAsync).getMockImplementation()!;
    let finishWrite!: () => void;
    jest.mocked(SecureStore.setItemAsync).mockImplementationOnce(async (...args) => {
        await new Promise<void>((resolve) => { finishWrite = resolve; });
        await nativeWrite(...args);
    });
    beginEngagement('private-user').noteSaved('note', 'new', first);
    await waitFor(() => expect(SecureStore.setItemAsync).toHaveBeenCalledTimes(1));
    mockEnabled = false;
    mockGeneration += 1;
    const cleared = cleanup('opt_out', null);
    finishWrite();
    await cleared;
    expect(mockStore.size).toBe(0);
});

it('bounds local metadata and deletes only the requested account on account deletion', async () => {
    for (let index = 0; index < 40; index += 1) beginEngagement('private-user').noteSaved(`note-${index}`, 'new', first);
    await waitFor(() => expect(SecureStore.setItemAsync).toHaveBeenCalledTimes(40));
    expect(stored().notes).toHaveLength(32);
    expect(stored().keys.length).toBeLessThanOrEqual(64);
    await cleanup('account_deleted', 'someone-else');
    expect(mockStore.size).toBe(1);
    await cleanup('account_deleted', 'private-user');
    expect(mockStore.size).toBe(0);
});

it('keeps analytics failures and malformed metadata away from the save result', async () => {
    mockStore.set('analytics.engagement.v1', '{ malformed');
    expect(() => beginEngagement('private-user').noteSaved('note', 'new', first)).not.toThrow();
    await waitFor(() => expect(mockEvents).toHaveLength(1));
    jest.mocked(analytics.beginOperation).mockImplementationOnce(() => { throw new Error('SDK unavailable'); });
    expect(() => beginEngagement('private-user').noteSaved('other-note', 'new', first)).not.toThrow();
});

it('captures only a coarse age bucket when a note is intentionally opened', () => {
    captureNoteOpened(Date.now());
    expect(mockEvents).toEqual([{ event: 'note_opened', properties: { entry_point: 'notes', note_age_bucket: 'same_day' } }]);
});
