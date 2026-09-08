import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { AnalyticsConsentControl } from '../AnalyticsConsentControl';

let mockHydrated = true;
const mockSetConsent = jest.fn();
jest.mock('../../../features/analytics/useAnalyticsConsent', () => ({
    useAnalyticsConsent: () => ({ hydrated: mockHydrated, consent: false }),
}));
jest.mock('../../../features/analytics/consentSync', () => ({
    analyticsConsentSync: { setConsent: (value: boolean) => mockSetConsent(value) },
}));

beforeEach(() => { mockHydrated = true; mockSetConsent.mockReset(); });

it('starts off and waits for the account preference to load', () => {
    mockHydrated = false;
    const { getByLabelText } = render(<AnalyticsConsentControl />);
    const control = getByLabelText('Share app usage');
    expect(control.props.value).toBe(false);
    expect(control.props.disabled).toBe(true);
    expect(mockSetConsent).not.toHaveBeenCalled();
});

it('allows immediate withdrawal while an earlier opt-in is still syncing', async () => {
    let resolveOptIn!: (value: { synced: boolean }) => void;
    mockSetConsent.mockImplementationOnce(() => new Promise((resolve) => { resolveOptIn = resolve; }));
    mockSetConsent.mockResolvedValueOnce({ synced: true });
    const { getByLabelText, queryByText } = render(<AnalyticsConsentControl />);
    fireEvent(getByLabelText('Share app usage'), 'valueChange', true);
    expect(getByLabelText('Share app usage').props.disabled).toBe(false);
    fireEvent(getByLabelText('Share app usage'), 'valueChange', false);
    await waitFor(() => expect(mockSetConsent).toHaveBeenLastCalledWith(false));
    await act(async () => { resolveOptIn({ synced: false }); });
    expect(queryByText(/Saved on this device/)).toBeNull();
});

it('explains an offline account sync without exposing a server error', async () => {
    mockSetConsent.mockResolvedValueOnce({ synced: false });
    const { getByLabelText, getByText } = render(<AnalyticsConsentControl />);
    fireEvent(getByLabelText('Share app usage'), 'valueChange', false);
    await waitFor(() => expect(getByText(/Saved on this device/)).toBeTruthy());
});
