import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { AppAlertModal } from '../AppAlertModal';

it('opens subscription management without invoking the destructive action', () => {
    const close = jest.fn();
    const manage = jest.fn();
    const remove = jest.fn();
    const view = render(<AppAlertModal title="Delete account" message="Billing continues until cancelled."
        onRequestClose={close}
        options={{
            secondaryAction: { label: 'Manage subscription', onPress: manage },
            primaryAction: { label: 'Delete account', tone: 'danger', onPress: remove },
        }}
    />);
    fireEvent.press(view.getByText('Manage subscription'));
    expect(manage).toHaveBeenCalledTimes(1);
    expect(remove).not.toHaveBeenCalled();
    expect(close.mock.invocationCallOrder[0]).toBeLessThan(manage.mock.invocationCallOrder[0]);
});

it('still allows immediate account deletion', () => {
    const remove = jest.fn();
    const manage = jest.fn();
    const view = render(<AppAlertModal title="Confirm deletion" message="Billing continues until cancelled."
        onRequestClose={jest.fn()}
        options={{
            secondaryAction: { label: 'Manage subscription', onPress: manage },
            primaryAction: { label: 'Delete account', tone: 'danger', onPress: remove },
        }}
    />);
    fireEvent.press(view.getByText('Delete account'));
    expect(remove).toHaveBeenCalledTimes(1);
    expect(manage).not.toHaveBeenCalled();
});
