import React from 'react';
import { Appearance, Text, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, render, renderHook, waitFor } from '@testing-library/react-native';

import { ThemeProvider, useTheme } from '../theme';
import { darkTheme, lightTheme } from 'designs/designs-themes';

jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
    __esModule: true,
    default: jest.fn(() => 'light'),
}));

const mockUseColorScheme = useColorScheme as jest.MockedFunction<typeof useColorScheme>;
const setColorScheme = jest.spyOn(Appearance, 'setColorScheme').mockImplementation(() => undefined);

const wrapper = ({ children }: { children: React.ReactNode }) => <ThemeProvider>{ children }</ThemeProvider>;

beforeEach(async () => {
    await AsyncStorage.clear();
    mockUseColorScheme.mockReturnValue('light');
    setColorScheme.mockClear();
});

describe('ThemeProvider', () => {
    it('follows the device when nothing is stored', async () => {
        mockUseColorScheme.mockReturnValue('dark');
        const { result } = renderHook(() => useTheme(), { wrapper });

        await waitFor(() => expect(result.current.scheme).toBe('dark'));
        expect(result.current.preference).toBe('system');
        expect(result.current.theme).toBe(darkTheme);
        // System is expressed to the OS as "no opinion".
        expect(setColorScheme).toHaveBeenLastCalledWith(null);
    });

    it('applies a stored override over the device scheme', async () => {
        await AsyncStorage.setItem('settings:theme', 'dark');
        mockUseColorScheme.mockReturnValue('light');
        const { result } = renderHook(() => useTheme(), { wrapper });

        await waitFor(() => expect(result.current.scheme).toBe('dark'));
        expect(result.current.preference).toBe('dark');
        expect(setColorScheme).toHaveBeenLastCalledWith('dark');
    });

    it('holds children back until the stored choice has been read', async () => {
        await AsyncStorage.setItem('settings:theme', 'dark');
        const { queryByText, getByText } = render(
            <ThemeProvider>
                <Text>mounted</Text>
            </ThemeProvider>,
        );

        // The tree must not mount in the device's scheme and then flip.
        expect(queryByText('mounted')).toBeNull();
        await waitFor(() => expect(getByText('mounted')).toBeTruthy());
    });

    it('switches at runtime and persists the choice', async () => {
        const { result } = renderHook(() => useTheme(), { wrapper });
        await waitFor(() => expect(result.current.scheme).toBe('light'));

        await act(async () => {
            await result.current.setPreference('dark');
        });
        expect(result.current.scheme).toBe('dark');
        expect(result.current.theme).toBe(darkTheme);
        expect(await AsyncStorage.getItem('settings:theme')).toBe('dark');

        await act(async () => {
            await result.current.setPreference('system');
        });
        expect(result.current.scheme).toBe('light');
        expect(await AsyncStorage.getItem('settings:theme')).toBe('system');
    });

    it('ignores a corrupt stored value', async () => {
        await AsyncStorage.setItem('settings:theme', 'sepia');
        const { result } = renderHook(() => useTheme(), { wrapper });

        await waitFor(() => expect(result.current.preference).toBe('system'));
        expect(result.current.theme).toBe(lightTheme);
    });

    it('renders light without a provider', () => {
        const { result } = renderHook(() => useTheme());
        expect(result.current.theme).toBe(lightTheme);
        expect(result.current.scheme).toBe('light');
    });
});
