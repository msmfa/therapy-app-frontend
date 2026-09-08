export type AppAlertAction = {
    label: string;
    onPress: () => void | Promise<void>;
    tone?: 'default' | 'danger';
    disabled?: boolean;
    loading?: boolean;
};

export type AppAlertVariant = 'info' | 'success' | 'error';

export type AppAlertOptions = {
    onClose?: () => void;
    primaryAction?: AppAlertAction;
    secondaryAction?: AppAlertAction;
    variant?: AppAlertVariant;
};

export interface AppAlertContextValue {
    showAlert: (title: string, message: string, options?: AppAlertOptions) => void;
    hideAlert: () => void;
}
