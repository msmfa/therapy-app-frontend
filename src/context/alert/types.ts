export type AppAlertOptions = {
    onClose?: () => void;
};

export interface AppAlertContextValue {
    showAlert: (title: string, message: string, options?: AppAlertOptions) => void;
    hideAlert: () => void;
}
