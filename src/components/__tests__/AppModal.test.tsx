import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { AppModal } from '../Modal';

const TOP_INSET = 59;
const BOTTOM_INSET = 34;

const METRICS: Metrics = {
    frame: { x: 0, y: 0, width: 390, height: 844 },
    insets: { top: TOP_INSET, left: 0, right: 0, bottom: BOTTOM_INSET },
};

function renderModal(props: { title?: string; onClose?: () => void } = {}) {
    return render(
        <SafeAreaProvider initialMetrics={ METRICS }>
            <ThemeProvider value={ DefaultTheme }>
                <AppModal isVisible title={ props.title } onClose={ props.onClose ?? jest.fn() }>
                    <Text>Body copy</Text>
                </AppModal>
            </ThemeProvider>
        </SafeAreaProvider>,
    );
}

describe('AppModal', () => {
    // A Modal renders in its own native view hierarchy, where a safe-area view
    // measures nothing and reports zero. The insets have to come from the app
    // root's provider and be applied as padding, or the header sits under the
    // status bar.
    it('keeps its content inside the safe area', () => {
        renderModal({ title: 'Early Consolidation' });

        const root = StyleSheet.flatten(screen.getByTestId('app-modal-root').props.style);

        expect(root.paddingTop).toBe(TOP_INSET);
        expect(root.paddingBottom).toBe(BOTTOM_INSET);
    });

    it('shows the title beside the close button', () => {
        renderModal({ title: 'Early Consolidation' });

        expect(screen.getByText('Early Consolidation')).toBeTruthy();
        expect(screen.getByLabelText('Close')).toBeTruthy();
    });

    it('renders the header without a title', () => {
        renderModal();

        expect(screen.getByLabelText('Close')).toBeTruthy();
        expect(screen.getByText('Body copy')).toBeTruthy();
    });

    // Both fades are always mounted; their opacity is what carries them, so the
    // logic under test is when each one is switched off entirely.
    describe('scroll edge fades', () => {
        const opacityOf = (testID: string) =>
            StyleSheet.flatten(screen.getByTestId(testID).props.style).opacity;

        const setHeights = (viewport: number, content: number) => {
            const scroll = screen.getByTestId('app-modal-scroll');

            fireEvent(scroll, 'layout', { nativeEvent: { layout: { height: viewport } } });
            fireEvent(scroll, 'contentSizeChange', 0, content);
        };

        it('renders a fade at each end', () => {
            renderModal({ title: 'Early Consolidation' });

            expect(screen.getByTestId('app-modal-fade-top')).toBeTruthy();
            expect(screen.getByTestId('app-modal-fade-bottom')).toBeTruthy();
        });

        it('hides the top fade until the copy has moved', () => {
            renderModal({ title: 'Early Consolidation' });
            setHeights(400, 1000);

            expect(opacityOf('app-modal-fade-top')).toBe(0);
        });

        it('shows the bottom fade when there is more to read', () => {
            renderModal({ title: 'Early Consolidation' });
            setHeights(400, 1000);

            expect(opacityOf('app-modal-fade-bottom')).toBe(1);
        });

        it('drops the bottom fade when the copy already fits', () => {
            renderModal({ title: 'Early Consolidation' });
            setHeights(800, 400);

            expect(opacityOf('app-modal-fade-bottom')).toBe(0);
        });
    });

    it('closes from the cross', () => {
        const onClose = jest.fn();
        renderModal({ title: 'Spaced Reactivation', onClose });

        fireEvent.press(screen.getByLabelText('Close'));

        expect(onClose).toHaveBeenCalledTimes(1);
    });
});
