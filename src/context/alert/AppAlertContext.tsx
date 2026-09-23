import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppAlertModal } from '../../components/ui/AppAlert/AppAlertModal';
import { isPresenting, subscribePresentation } from '../../components/ui/modalPresence';
import type { AppAlertContextValue, AppAlertOptions } from './types';

interface AppAlertSnapshot {
    /** Distinguishes one alert from the next, so each gets its own host. */
    id: number;
    title: string;
    message: string;
    options?: AppAlertOptions;
}

/**
 * Long enough for a sheet's dismissal to finish before the alert asks to
 * present. iOS will not present onto a controller that is still animating
 * a dismissal, and it fails the same silent way it fails a double present.
 */
const SETTLE_MS = 400;

const AppAlertContext = createContext<AppAlertContextValue | undefined>(undefined);

export function AppAlertProvider({ children }: { children: React.ReactNode }) {
    const [currentAlert, setCurrentAlert] = useState<AppAlertSnapshot | null>(null);
    const optionsRef = useRef<AppAlertOptions | undefined>(undefined);
    // An alert asked for while a sheet was up, waiting for the sheet to go.
    const pendingRef = useRef<AppAlertSnapshot | null>(null);
    const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const nextIdRef = useRef(0);

    const present = useCallback((snapshot: AppAlertSnapshot) => {
        optionsRef.current = snapshot.options;
        setCurrentAlert(snapshot);
    }, []);

    const hideAlert = useCallback(() => {
        setCurrentAlert(null);
        const options = optionsRef.current;
        optionsRef.current = undefined;
        options?.onClose?.();
    }, []);

    const showAlert = useCallback<AppAlertContextValue['showAlert']>((title, message, options) => {
        nextIdRef.current += 1;
        const snapshot: AppAlertSnapshot = { id: nextIdRef.current, title, message, options };
        // Raised from inside a sheet: iOS would refuse to present it and
        // never ask again, so it waits for the sheet to close instead of
        // being thrown away.
        if (isPresenting()) {
            pendingRef.current = snapshot;
            return;
        }
        present(snapshot);
    }, [present]);

    useEffect(() => subscribePresentation(() => {
        if (isPresenting() || !pendingRef.current) return;
        const snapshot = pendingRef.current;
        pendingRef.current = null;
        if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
        settleTimerRef.current = setTimeout(() => {
            settleTimerRef.current = null;
            if (isPresenting()) {
                pendingRef.current = pendingRef.current ?? snapshot;
                return;
            }
            present(pendingRef.current ?? snapshot);
            pendingRef.current = null;
        }, SETTLE_MS);
    }), [present]);

    useEffect(() => () => {
        if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    }, []);

    const contextValue = useMemo<AppAlertContextValue>(
        () => ({ showAlert, hideAlert }),
        [showAlert, hideAlert],
    );

    return (
        <AppAlertContext.Provider value={ contextValue }>
            { children }
            { currentAlert ? (
                // Keyed per alert so each one mounts its own host. A host
                // that is reused carries over a presentation that iOS may
                // have refused, and nothing would ever ask it to try again.
                <AppAlertModal
                    key={ currentAlert.id }
                    title={ currentAlert.title }
                    message={ currentAlert.message }
                    options={ currentAlert.options }
                    onRequestClose={ hideAlert }
                />
            ) : null }
        </AppAlertContext.Provider>
    );
}

export function useAppAlert(): AppAlertContextValue {
    const context = useContext(AppAlertContext);

    if (!context) {
        throw new Error('useAppAlert must be used within an AppAlertProvider');
    }

    return context;
}
