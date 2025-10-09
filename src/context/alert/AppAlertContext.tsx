import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { AppAlertModal } from '../../components/ui/AppAlert/AppAlertModal';
import type { AppAlertContextValue, AppAlertOptions } from './types';

interface AppAlertSnapshot {
    title: string;
    message: string;
    options?: AppAlertOptions;
}

const AppAlertContext = createContext<AppAlertContextValue | undefined>(undefined);

export function AppAlertProvider({ children }: { children: React.ReactNode }) {
    const [currentAlert, setCurrentAlert] = useState<AppAlertSnapshot | null>(null);
    const optionsRef = useRef<AppAlertOptions | undefined>(undefined);

    const hideAlert = useCallback(() => {
        setCurrentAlert(null);
        const options = optionsRef.current;
        optionsRef.current = undefined;
        options?.onClose?.();
    }, []);

    const showAlert = useCallback<AppAlertContextValue['showAlert']>((title, message, options) => {
        optionsRef.current = options;
        setCurrentAlert({
            title,
            message,
            options,
        });
    }, []);

    const contextValue = useMemo<AppAlertContextValue>(
        () => ({ showAlert, hideAlert }),
        [showAlert, hideAlert],
    );

    return (
        <AppAlertContext.Provider value={ contextValue }>
            { children }
            { currentAlert ? (
                <AppAlertModal
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
