import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { Linking, Platform } from 'react-native';

import SettingsScreen from '../(tabs)/settings';
import { STORE_URLS } from '../../src/constants/env';

const mockShowAlert = jest.fn();

jest.mock('expo-router', () => ({
    useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('../../src/context/auth/AuthContext', () => ({
    useAuth: () => ({
        user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
        signOut: jest.fn(),
    }),
}));

jest.mock('../../src/context/alert', () => ({
    useAppAlert: () => ({ showAlert: mockShowAlert }),
}));

jest.mock('../../src/constants/env', () => ({
    STORE_URLS: {
        ios: 'https://apps.apple.com/app/id123456789',
        android: '',
        web: '',
    },
}));

jest.mock('../../src/components/settings/SettingsPageShell', () => ({
    SettingsPageShell: ({ children }: { children: React.ReactNode }) => children,
}));

describe('SettingsScreen app rating', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(Platform, 'select').mockImplementation((options) => options.ios);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('opens the App Store with the Linking receiver intact', async () => {
        // React Native calls this._validateURL inside openURL. A plain resolved
        // promise mock would hide the crash caused by passing it unbound.
        const openURL = jest.spyOn(Linking, 'openURL').mockImplementation(function (this: typeof Linking) {
            expect(this === Linking).toBe(true);
            return Promise.resolve();
        });
        const { getByText } = render(<SettingsScreen />);

        await act(async () => { fireEvent.press(getByText('Rate this App')); });

        expect(openURL).toHaveBeenCalledWith(STORE_URLS.ios);
        expect(mockShowAlert).not.toHaveBeenCalled();
    });

    it('shows an error when the store link cannot be opened', async () => {
        jest.spyOn(Linking, 'openURL').mockRejectedValueOnce(new Error('unavailable'));
        const { getByText } = render(<SettingsScreen />);

        await act(async () => { fireEvent.press(getByText('Rate this App')); });

        expect(mockShowAlert).toHaveBeenCalledWith('Error', 'Unable to open the store right now.');
    });

    it('shows the unavailable message when the platform has no store listing', () => {
        jest.spyOn(Platform, 'select').mockImplementation((options) => options.android);
        const openURL = jest.spyOn(Linking, 'openURL');
        const { getByText } = render(<SettingsScreen />);

        fireEvent.press(getByText('Rate this App'));

        expect(openURL).not.toHaveBeenCalled();
        expect(mockShowAlert).toHaveBeenCalledWith('Unavailable', 'Rating is not supported on this platform yet.');
    });
});
