import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUserSettings, updateCurrentUser } from '../../api/users';
import { analytics } from './client';
import { ANALYTICS_STORAGE_SUFFIX, isPreconsentedTestflight } from './config';

const PREFIX = `plastic_brains.analytics_pending_consent.v1${ANALYTICS_STORAGE_SUFFIX}.`;
type PendingChoice = { consent: boolean; revision: number };
type ConsentRuntime = Pick<typeof analytics, 'getIdentity' | 'getSnapshot' | 'initialize' | 'setConsent'>;
type Dependencies = {
    runtime: ConsentRuntime;
    storage: Pick<typeof AsyncStorage, 'getItem' | 'setItem' | 'removeItem'>;
    read: () => Promise<{ analyticsConsent?: boolean }>;
    write: (consent: boolean) => Promise<void>;
    syncWithAccount?: boolean;
};

/** A durable preference retry, not an event queue. No notes or activity live here. */
export function createConsentSync({ runtime, storage, read, write, syncWithAccount = true }: Dependencies) {
    let revision = 0;
    let storageQueue = Promise.resolve();
    const inFlight = new Map<string, Promise<boolean>>();
    const deletedOwners = new Set<string>();
    const keyFor = (owner: string) => `${PREFIX}${encodeURIComponent(owner)}`;
    const isOwner = (owner: string) => runtime.getIdentity() === owner && !deletedOwners.has(owner);
    const persist = (work: () => Promise<void>) => {
        const next = storageQueue.then(work);
        storageQueue = next.catch(() => undefined);
        return next;
    };
    const pendingChoice = async (owner: string): Promise<PendingChoice | null> => {
        await storageQueue;
        const raw = await storage.getItem(keyFor(owner));
        if (!raw) return null;
        const value: unknown = JSON.parse(raw);
        if (!value || typeof value !== 'object') return null;
        const candidate = value as Partial<PendingChoice>;
        return typeof candidate.consent === 'boolean' && typeof candidate.revision === 'number'
            ? candidate as PendingChoice : null;
    };
    const savePending = (owner: string, choice: PendingChoice) =>
        persist(() => storage.setItem(keyFor(owner), JSON.stringify(choice)));

    const sync = (): Promise<boolean> => {
        // Prior consent to this beta is local to this build. It must neither
        // overwrite nor be overwritten by the public app's account preference.
        if (!syncWithAccount) return Promise.resolve(true);
        const owner = runtime.getIdentity();
        if (!owner || !runtime.getSnapshot().available) return Promise.resolve(true);
        if (!isOwner(owner)) return Promise.resolve(false);
        const existing = inFlight.get(owner);
        if (existing) return existing;
        const request = (async () => {
            try {
                await runtime.initialize();
                if (!isOwner(owner)) return false;
                let choice = await pendingChoice(owner);
                if (!isOwner(owner)) return false;
                if (!choice) {
                    const beforeRead = revision;
                    const settings = await read();
                    if (!isOwner(owner)) return false;
                    choice = await pendingChoice(owner);
                    if (!isOwner(owner)) return false;
                    if (!choice && beforeRead === revision) {
                        if (typeof settings.analyticsConsent === 'boolean') {
                            const local = runtime.getSnapshot();
                            if (!local.consentKnown || local.consent !== settings.analyticsConsent) {
                                await runtime.setConsent(settings.analyticsConsent);
                            }
                            return true;
                        }
                        const local = runtime.getSnapshot();
                        if (!local.consentKnown) return true;
                        choice = { consent: local.consent, revision: ++revision };
                        await savePending(owner, choice);
                    }
                }
                // A toggle while a request is in flight supersedes it. Send
                // choices serially so an old opt-in cannot win after opt-out.
                while (choice && isOwner(owner)) {
                    await write(choice.consent);
                    if (!isOwner(owner)) return false;
                    const next = await pendingChoice(owner);
                    if (!isOwner(owner)) return false;
                    if (next?.revision === choice.revision && next.consent === choice.consent) {
                        await persist(async () => {
                            const raw = await storage.getItem(keyFor(owner));
                            if (raw === JSON.stringify(choice)) await storage.removeItem(keyFor(owner));
                        });
                    }
                    choice = await pendingChoice(owner);
                }
                return isOwner(owner);
            } catch {
                // Offline/old-backend errors leave the latest pending choice
                // intact. Authentication, note saving and billing continue.
                return false;
            }
        })();
        inFlight.set(owner, request);
        void request.finally(() => { if (inFlight.get(owner) === request) inFlight.delete(owner); });
        return request;
    };

    return {
        sync,
        setConsent: async (value: boolean): Promise<{ synced: boolean }> => {
            const owner = runtime.getIdentity();
            if (owner && !isOwner(owner)) throw new Error('This account is no longer available.');
            const currentRevision = ++revision;
            // Revocation takes effect in memory before any storage/network await.
            await Promise.all([
                runtime.setConsent(value),
                owner && syncWithAccount ? savePending(owner, { consent: value, revision: currentRevision }) : Promise.resolve(),
            ]);
            if (owner !== runtime.getIdentity()) return { synced: false };
            return { synced: await sync() };
        },
        forgetAccount: (owner: string) => {
            // Invalidate a GET/PATCH continuation while auth cleanup still
            // exposes this account. It must not reactivate erased consent.
            deletedOwners.add(owner);
            revision += 1;
            return persist(() => storage.removeItem(keyFor(owner)));
        },
    };
}

export const analyticsConsentSync = createConsentSync({
    runtime: analytics,
    storage: AsyncStorage,
    read: getCurrentUserSettings,
    write: (analyticsConsent) => updateCurrentUser({ analyticsConsent }),
    syncWithAccount: !isPreconsentedTestflight(),
});
