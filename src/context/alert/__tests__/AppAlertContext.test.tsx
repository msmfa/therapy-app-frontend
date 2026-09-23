import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { AppAlertProvider, useAppAlert } from '../AppAlertContext';
import { PresentedModal } from '../../../components/ui/PresentedModal';
import { resetPresentation } from '../../../components/ui/modalPresence';

jest.mock('../../../components/ui/AppAlert/AppAlertModal', () => {
    const ReactForMock = require('react');
    const { Text: MockText, View: MockView } = require('react-native');
    return {
        AppAlertModal: ({ title }: { title: string }) => ReactForMock.createElement(
            MockView,
            { testID: 'app-alert' },
            ReactForMock.createElement(MockText, null, title),
        ),
    };
});

function Raiser({ title }: { title: string }) {
    const { showAlert } = useAppAlert();
    return (
        <TouchableOpacity onPress={ () => showAlert(title, 'body') }>
            <Text>{ `raise-${title}` }</Text>
        </TouchableOpacity>
    );
}

/** A sheet of the kind the calendar puts up, which an alert cannot present over. */
function Sheet({ open }: { open: boolean }) {
    if (!open) return null;
    return (
        <PresentedModal visible transparent>
            <Text>sheet</Text>
        </PresentedModal>
    );
}

function Harness({ sheetOpen }: { sheetOpen: boolean }) {
    return (
        <AppAlertProvider>
            <Raiser title="first" />
            <Raiser title="second" />
            <Sheet open={ sheetOpen } />
        </AppAlertProvider>
    );
}

describe('the app alert waits for a clear screen', () => {
    beforeEach(() => {
        resetPresentation();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('shows an alert straight away when nothing is presented', () => {
        render(<Harness sheetOpen={ false } />);

        fireEvent.press(screen.getByText('raise-first'));

        expect(screen.getByTestId('app-alert')).toBeTruthy();
        expect(screen.getByText('first')).toBeTruthy();
    });

    // iOS refuses to present a modal onto a controller that is already
    // presenting one, silently and with no retry. Shown here, the alert
    // would be lost, and the host would stay mounted believing it was up.
    it('holds an alert raised from inside a sheet until the sheet has gone', () => {
        const view = render(<Harness sheetOpen />);

        fireEvent.press(screen.getByText('raise-first'));
        expect(screen.queryByTestId('app-alert')).toBeNull();

        view.rerender(<Harness sheetOpen={ false } />);
        act(() => { jest.runOnlyPendingTimers(); });

        expect(screen.getByTestId('app-alert')).toBeTruthy();
        expect(screen.getByText('first')).toBeTruthy();
    });

    // The bug this replaced: one alert lost inside a sheet took every later
    // alert in the session with it, so anything that only speaks through a
    // dialog silently did nothing for the rest of the run.
    it('still shows later alerts after one was raised from inside a sheet', () => {
        const view = render(<Harness sheetOpen />);

        fireEvent.press(screen.getByText('raise-first'));
        view.rerender(<Harness sheetOpen={ false } />);
        act(() => { jest.runOnlyPendingTimers(); });
        expect(screen.getByText('first')).toBeTruthy();

        fireEvent.press(screen.getByText('raise-second'));

        expect(screen.getByText('second')).toBeTruthy();
    });
    it('keeps waiting if another sheet opens during dismissal', () => {
        const view = render(<Harness sheetOpen />);
        fireEvent.press(screen.getByText('raise-first'));
        view.rerender(<Harness sheetOpen={ false } />);
        view.rerender(<Harness sheetOpen />);
        act(() => { jest.runOnlyPendingTimers(); });
        expect(screen.queryByTestId('app-alert')).toBeNull();
        view.rerender(<Harness sheetOpen={ false } />);
        act(() => { jest.runOnlyPendingTimers(); });
        expect(screen.getByText('first')).toBeTruthy();
    });

});
