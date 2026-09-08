import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUserSettings, updateCurrentUser } from '../../api/users';
import { analytics } from './client';
import { ANALYTICS_STORAGE_SUFFIX } from './config';

// Remove pending choices left by earlier versions; they must not be replayed.
const LEGACY_PREFIX = `plastic_brains.analytics_pending_consent.v1${ANALYTICS_STORAGE_SUFFIX}.`;
type Dependencies = {
    runtime: Pick<typeof analytics, 'getIdentity' | 'getSnapshot' | 'initialize'>;
    storage: Pick<typeof AsyncStorage, 'removeItem'>;
    read: () => Promise<{ analyticsConsent?: boolean }>;
    write: (consent: true) => Promise<void>;
};

/** Keep the account record aligned with the app's automatic analytics policy. */
export function createConsentSync({ runtime, storage, read, write }: Dependencies) {
    const inFlight = new Map<string, Promise<boolean>>();
    const deletedOwners = new Set<string>();
    const keyFor = (owner: string) => `${LEGACY_PREFIX}${encodeURIComponent(owner)}`;
    const isOwner = (owner: string) => runtime.getIdentity() === owner && !deletedOwners.has(owner);
    const maySync = (owner: string) => {
        const snapshot = runtime.getSnapshot();
        return isOwner(owner) && snapshot.available && snapshot.hydrated && snapshot.consent;
    };

    const sync = (): Promise<boolean> => {
        const owner = runtime.getIdentity();
        if (!owner || !runtime.getSnapshot().available) return Promise.resolve(true);
        if (!isOwner(owner)) return Promise.resolve(false);
        const existing = inFlight.get(owner);
        if (existing) return existing;
        const request = (async () => {
            try {
                await runtime.initialize();
                if (!maySync(owner)) return false;
                await storage.removeItem(keyFor(owner));
                if (!maySync(owner)) return false;
                const settings = await read();
                if (!maySync(owner)) return false;
                if (settings.analyticsConsent !== true) await write(true);
                return maySync(owner);
            } catch {
                // Login/foreground will retry the same true value. Analytics
                // synchronization never blocks authentication, notes or billing.
                return false;
            }
        })();
        inFlight.set(owner, request);
        void request.finally(() => { if (inFlight.get(owner) === request) inFlight.delete(owner); });
        return request;
    };

    return {
        sync,
        forgetAccount: (owner: string) => {
            // Invalidate an older response while auth cleanup still exposes
            // the deleted account. It must not restart account synchronization.
            deletedOwners.add(owner);
            return storage.removeItem(keyFor(owner));
        },
    };
}

export const analyticsConsentSync = createConsentSync({
    runtime: analytics,
    storage: AsyncStorage,
    read: getCurrentUserSettings,
    write: (analyticsConsent) => updateCurrentUser({ analyticsConsent }),
});
