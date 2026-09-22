import React from 'react';
import { Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import AppText from '../AppText';
import type { Theme } from 'designs/designs-themes';
import { useThemedStyles } from '../../../context/theme';
import Spacer, { SpacerVariant } from '../Spacer';
import ErrorGradients from '../ErrorGradients';
import { Button } from '../Button';
import { AppAlertOptions } from 'src/context/alert/types';
import { useTranslation } from 'react-i18next';

type Props = {
    title: string;
    message: string;
    options?: AppAlertOptions;
    onRequestClose: () => void;
};

export function AppAlertModal({ title, message, options, onRequestClose }: Props) {
    const { t } = useTranslation('common');
    const styles = useThemedStyles(makeStyles);
    const primaryAction = options?.primaryAction;
    const secondaryAction = options?.secondaryAction;

    const handlePrimaryPress = React.useCallback(() => {
        if (!primaryAction) {
            return;
        }

        const { onPress } = primaryAction;
        onRequestClose();
        onPress();
    }, [onRequestClose, primaryAction]);

    const handleSecondaryPress = React.useCallback(() => {
        if (!secondaryAction) return;
        onRequestClose();
        secondaryAction.onPress();
    }, [onRequestClose, secondaryAction]);

    return (
        <Modal
            animationType='fade'
            transparent
            visible
            onRequestClose={ onRequestClose }
            statusBarTranslucent
        >
            <View style={ styles.overlay }>
                <TouchableOpacity
                    style={ styles.backdrop }
                    activeOpacity={ 1 }
                    onPress={ onRequestClose }
                    accessibilityRole='button'
                    accessibilityLabel={ t('a11y.dismissAlert') }
                />

                <View
                    style={ styles.container }
                    accessibilityRole='alert'
                    accessibilityViewIsModal
                >
                    <ScrollView style={ styles.scroll } contentContainerStyle={ styles.content }>
                        <Spacer variant={ SpacerVariant.large } />
                        <ErrorGradients />
                        <Spacer variant={ SpacerVariant.large } />
                        <AppText variant='h1' >
                            { title }
                        </AppText>
                        <Spacer variant={ SpacerVariant.small } />
                        <AppText variant='caption' align='center'>
                            { message }
                        </AppText>
                        <Spacer variant={ SpacerVariant.large } />
                        <Spacer variant={ SpacerVariant.medium } />
                        { secondaryAction ? (
                            <>
                                <Button
                                    label={ secondaryAction.label }
                                    onPress={ handleSecondaryPress }
                                    disabled={ secondaryAction.disabled }
                                    loading={ secondaryAction.loading }
                                    transparent
                                />
                                <Spacer variant={ SpacerVariant.small } />
                            </>
                        ) : null }
                        { primaryAction ? (
                            <>
                                <Button
                                    label={ primaryAction.label }
                                    onPress={ handlePrimaryPress }
                                    disabled={ primaryAction.disabled }
                                    loading={ primaryAction.loading }
                                    addedStyles={ primaryAction.tone === 'danger' ? styles.primaryActionDanger : undefined }
                                />
                                <Spacer variant={ SpacerVariant.small } />
                            </>
                        ) : null }
                        <Button
                            label={ t('a11y.close') }
                            onPress={ onRequestClose }
                            transparent={ Boolean(primaryAction) }
                        />
                        <Spacer variant={ SpacerVariant.medium } />
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const makeStyles = (theme: Theme) => StyleSheet.create({
    container: {
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        width: '100%',
        maxWidth: 360,
        maxHeight: '100%',
        backgroundColor: theme.surface.modal,
        borderRadius: 24,
        shadowColor: theme.shadow,
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 12 },
        shadowRadius: 24,
        elevation: 6,
    },
    scroll: {
        width: '100%',
        flexGrow: 0,
        flexShrink: 1,
    },
    content: {
        alignItems: 'center',
    },
    overlay: {
        flex: 1,
        backgroundColor: theme.surface.scrim,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 30,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    primaryActionDanger: {
        backgroundColor: theme.status.danger,
        borderColor: theme.status.danger,
    },
});
