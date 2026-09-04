import React, { createContext, useContext } from 'react';
import { useEntitlement } from './useEntitlement';
import type { EntitlementState } from './types';

type EntitlementContextValue = {
    state: EntitlementState;
    refresh: () => void;
};

const EntitlementContext = createContext<EntitlementContextValue | undefined>(undefined);

/**
 * One store read, shared.
 *
 * Both the root Gate (which decides whether the subscription flow needs to be
 * reachable) and the paid area's guard need the same answer. Asking StoreKit
 * twice would be two round trips that can disagree with each other.
 */
export function EntitlementProvider({ children }: { children: React.ReactNode }) {
    const value = useEntitlement();

    return <EntitlementContext.Provider value={ value }>{ children }</EntitlementContext.Provider>;
}

export function useEntitlementState(): EntitlementContextValue {
    const context = useContext(EntitlementContext);

    if (!context) {
        throw new Error('useEntitlementState must be used inside EntitlementProvider');
    }

    return context;
}
