// A local invalidation signal; carries no note text or account data.
const listeners = new Set<() => void>();
export function notifyProgressChanged() { listeners.forEach((listener) => listener()); }
export function subscribeProgressChanges(listener: () => void) {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
}
