import { apiGet, apiPost } from './client';
import type { EntitlementResult } from '../features/subscription/types';

type ServerEntitlement =
    | {
        status: 'active';
        plan: 'annual' | 'monthly';
        productId: string;
        expiresAt: string;
    }
    | { status: 'inactive' };

const toEntitlementResult = (entitlement: ServerEntitlement): EntitlementResult => {
    if (entitlement.status === 'inactive') return entitlement;
    return {
        ...entitlement,
        expiresAt: new Date(entitlement.expiresAt),
    };
};

export async function getAppAccountToken(): Promise<string> {
    const response = await apiGet<{ appAccountToken: string }>(
        '/api/subscriptions/app-account-token',
    );
    return response.appAccountToken;
}

export async function verifySubscriptionTransaction(
    signedTransaction: string,
): Promise<EntitlementResult> {
    const response = await apiPost<{ entitlement: ServerEntitlement }>(
        '/api/subscriptions/verify',
        { signedTransaction },
    );
    return toEntitlementResult(response.entitlement);
}

export async function getServerEntitlement(): Promise<EntitlementResult> {
    const response = await apiGet<{ entitlement: ServerEntitlement }>(
        '/api/subscriptions/entitlement',
    );
    return toEntitlementResult(response.entitlement);
}
