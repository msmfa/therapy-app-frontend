import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { PRODUCT_IDS } from '../productIds';

type IntroductoryOffer = {
    numberOfPeriods?: number;
    paymentMode?: string;
    subscriptionPeriod?: string;
};

type StoreKitSubscription = {
    displayPrice: string;
    introductoryOffer: IntroductoryOffer | null;
    productID: string;
};

type StoreKitConfiguration = {
    subscriptionGroups: Array<{
        subscriptions: StoreKitSubscription[];
    }>;
};

const configuration = JSON.parse(
    readFileSync(join(process.cwd(), 'storekit', 'Products.storekit'), 'utf8'),
) as StoreKitConfiguration;

const subscriptions = configuration.subscriptionGroups.flatMap(
    (group) => group.subscriptions,
);

const subscription = (productID: string): StoreKitSubscription => {
    const result = subscriptions.find((item) => item.productID === productID);
    if (!result) throw new Error(`Missing local StoreKit product: ${productID}`);
    return result;
};

describe('local StoreKit configuration', () => {
    it('offers exactly the current frontend products with valid test prices', () => {
        expect(subscriptions.map((item) => item.productID).sort()).toEqual(
            Object.values(PRODUCT_IDS).sort(),
        );
        expect(
            subscriptions.every((item) => Number.parseFloat(item.displayPrice) > 0),
        ).toBe(true);
    });

    it('mirrors the annual one-month and monthly one-week free trials', () => {
        expect(subscription(PRODUCT_IDS.annual).introductoryOffer).toMatchObject({
            numberOfPeriods: 1,
            paymentMode: 'free',
            subscriptionPeriod: 'P1M',
        });
        expect(subscription(PRODUCT_IDS.monthly).introductoryOffer).toMatchObject({
            numberOfPeriods: 1,
            paymentMode: 'free',
            subscriptionPeriod: 'P1W',
        });
    });
});
