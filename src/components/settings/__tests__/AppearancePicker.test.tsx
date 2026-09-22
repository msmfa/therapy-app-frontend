import React from 'react';
import { Appearance, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

import { AppearancePicker } from '../AppearancePicker';
import { ThemeProvider, useTheme } from '../../../context/theme';
import AppText from '../../ui/AppText';

jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
    __esModule: true,
    default: jest.fn(() => 'light'),
}));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
const mockShowAlert = jest.fn();
jest.mock('../../../context/alert', () => ({ useAppAlert: () => ({ showAlert: mockShowAlert }) }));

const mockUseColorScheme = useColorScheme as jest.MockedFunction<typeof useColorScheme>;
jest.spyOn(Appearance, 'setColorScheme').mockImplementation(() => undefined);

/** Something on the same page that repaints with the theme, as every screen does. */
function Probe() {
    const { scheme } = useTheme();
    return <AppText variant="body">{ `scheme:${scheme}` }</AppText>;
}

const renderPicker = () => render(
    <ThemeProvider>
        <AppearancePicker />
        <Probe />
    </ThemeProvider>,
);

beforeEach(async () => {
    await AsyncStorage.clear();
    mockUseColorScheme.mockReturnValue('light');
    mockShowAlert.mockClear();
});

describe('AppearancePicker', () => {
    it('offers System with the look it resolves to, then Light and Dark', async () => {
        const view = renderPicker();
        await waitFor(() => view.getByText('System'));

        expect(view.getByText('Currently Light')).toBeTruthy();
        expect(view.getByRole('radio', { name: 'System, Currently Light' }).props.accessibilityState.selected).toBe(true);
        expect(view.getByRole('radio', { name: 'Light' }).props.accessibilityState.selected).toBe(false);
        expect(view.getByRole('radio', { name: 'Dark' }).props.accessibilityState.selected).toBe(false);
    });

    it('switches the app to dark on tap, without a reload, and remembers it', async () => {
        const view = renderPicker();
        await waitFor(() => view.getByText('scheme:light'));

        await act(async () => { fireEvent.press(view.getByRole('radio', { name: 'Dark' })); });

        await waitFor(() => view.getByText('scheme:dark'));
        expect(view.getByRole('radio', { name: 'Dark' }).props.accessibilityState.selected).toBe(true);
        // System now reports the device's look, which is still light.
        expect(view.getByText('Currently Light')).toBeTruthy();
        expect(await AsyncStorage.getItem('settings:theme')).toBe('dark');
    });

    it('goes back to following the device', async () => {
        await AsyncStorage.setItem('settings:theme', 'dark');
        const view = renderPicker();
        await waitFor(() => view.getByText('scheme:dark'));

        await act(async () => { fireEvent.press(view.getByRole('radio', { name: 'System, Currently Light' })); });

        await waitFor(() => view.getByText('scheme:light'));
        expect(await AsyncStorage.getItem('settings:theme')).toBe('system');
    });

    it('tells the user when the choice could not be remembered', async () => {
        const view = renderPicker();
        await waitFor(() => view.getByText('System'));
        jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('disk full'));

        await act(async () => { fireEvent.press(view.getByRole('radio', { name: 'Dark' })); });

        // The switch itself still happened; only the memory of it did not.
        await waitFor(() => view.getByText('scheme:dark'));
        expect(mockShowAlert).toHaveBeenCalledWith(
            'Appearance not saved',
            expect.stringContaining('could not remember'),
        );
    });
});
