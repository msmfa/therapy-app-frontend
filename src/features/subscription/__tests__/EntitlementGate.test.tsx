import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { EntitlementGate } from '../EntitlementGate';
import type { EntitlementState } from '../types';

let mockState: EntitlementState = { status: 'loading' };

jest.mock('../EntitlementContext', () => ({
    useEntitlementState: () => ({ state: mockState, refresh: jest.fn() }),
}));

jest.mock('expo-router', () => {
    const { Text: RNText } = require('react-native');
    return {
        Redirect: ({ href }: { href: string }) => <RNText>{ `redirect:${href}` }</RNText>,
    };
});

jest.mock('../../../components/ui/Loading', () => {
    const { Text: RNText } = require('react-native');
    return { __esModule: true, default: () => <RNText>loading</RNText> };
});

const paidArea = () => (
    <EntitlementGate>
        <Text>paid area</Text>
    </EntitlementGate>
);

describe('EntitlementGate', () => {
    it('waits while the store is still answering', () => {
        mockState = { status: 'loading' };

        const { queryByText } = render(paidArea());

        expect(queryByText('loading')).not.toBeNull();
        expect(queryByText('paid area')).toBeNull();
    });

    it('allows an active subscriber in', () => {
        mockState = {
            status: 'active',
            plan: 'annual',
            productId: 'com.plasticbrains.app.subscription.annual',
            expiresAt: null,
        };

        const { queryByText } = render(paidArea());

        expect(queryByText('paid area')).not.toBeNull();
    });

    it('sends a lapsed subscriber to the subscription flow', () => {
        mockState = { status: 'inactive' };

        const { queryByText } = render(paidArea());

        expect(queryByText('paid area')).toBeNull();
        expect(queryByText('redirect:/(onboarding)/subscription-preview')).not.toBeNull();
    });

    it('does not lock anyone out when the store cannot be reached', () => {
        // Deliberately permissive: a network failure is our problem, not the
        // paying subscriber's. Backend verification will replace this.
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
        mockState = { status: 'unknown', reason: 'network' };

        const { queryByText } = render(paidArea());

        expect(queryByText('paid area')).not.toBeNull();
        expect(warn).toHaveBeenCalled();
        warn.mockRestore();
    });

    it('logs why it let an unverified user through', () => {
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
        mockState = { status: 'unknown', reason: 'store_error' };

        render(paidArea());

        expect(warn.mock.calls[0][0]).toContain('store_error');
        warn.mockRestore();
    });
});
