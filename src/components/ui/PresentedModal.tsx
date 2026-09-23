import React, { useEffect } from 'react';
import { Modal, type ModalProps } from 'react-native';

import { enterPresentation, leavePresentation } from './modalPresence';

/**
 * A `<Modal>` that says so while it is up.
 *
 * Every sheet the app raises over a screen should be one of these. The count
 * they keep is what lets the app alert hold its tongue until there is a view
 * controller free to present it on; see `modalPresence` for why iOS gives us
 * no second chance if it does not.
 *
 * Nothing else about it differs from the modal it wraps, so a sheet can be
 * converted by changing the tag and nothing else. Callers that keep the modal
 * mounted and toggle `visible` are counted only while it is actually showing.
 */
export function PresentedModal({ visible = true, ...props }: ModalProps) {
    useEffect(() => {
        if (!visible) return undefined;
        enterPresentation();
        return leavePresentation;
    }, [visible]);

    return <Modal visible={ visible } { ...props } />;
}
