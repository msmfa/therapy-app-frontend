export type AppAlertAction = {
    label: string;
    onPress: () => void | Promise<void>;
    tone?: 'default' | 'danger';
    disabled?: boolean;
    loading?: boolean;
};

export type AppAlertOptions = {
    onClose?: () => void;
    primaryAction?: AppAlertAction;
};

export interface AppAlertContextValue {
    showAlert: (title: string, message: string, options?: AppAlertOptions) => void;
    hideAlert: () => void;
}
