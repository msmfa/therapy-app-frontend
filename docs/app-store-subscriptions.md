# App Store subscriptions

The app reads prices, currencies and introductory-offer eligibility from Apple.
Product identifiers are configured in the frontend catalogue at
`src/features/subscription/productIds.ts` and the backend allow-list at
`therapy-app-backend/src/subscription/catalog.ts`.

## App Store Connect setup

Under the app with bundle id `com.plastic-brains.app`:

1. Complete the Paid Applications Agreement, banking and tax setup.
2. Create one auto-renewable subscription group named `Plastic Brains`.
3. Create these products in that group:
   - `com.plasticbrains.app.subscription.annual`
   - `com.plasticbrains.app.subscription.monthly`
4. Set the price and localised name/description for each product.
5. Add a one-month free introductory offer to the annual product and a one-week
   free introductory offer to the monthly product. The app displays each offer
   only when StoreKit reports that the Apple ID is eligible. Both products are
   in the same subscription group, so each person can redeem only one of those
   introductory offers.
6. Create a sandbox Apple account and test purchase, cancellation, restore,
   renewal, expiry and billing retry on a physical device or TestFlight build.
7. Set the App Store Server Notifications V2 production and sandbox URLs to
   `https://www.plastic-brains.com/api/subscriptions/apple-notifications`.

Do not set the notification URLs until that endpoint is deployed and a public
POST to it returns something other than `404`. A `400` for a deliberately bad
signed payload is a healthy preflight result; it proves the route exists without
creating an entitlement.

Until both products exist and are available to StoreKit, the paywall shows its
unavailable state rather than inventing a price.

## Local testing

Open `ios/PlasticBrains.xcworkspace` in Xcode and run the shared
`PlasticBrains-LocalStoreKit` scheme. It uses
`storekit/Products.storekit` and never reaches the real App Store. If the
generated `ios` directory is recreated, duplicate the normal scheme, name it
`PlasticBrains-LocalStoreKit`, and select that StoreKit configuration under
Run > Options.

The normal `PlasticBrains` scheme does not reference the local StoreKit file.
Use that scheme for App Store sandbox, TestFlight and release builds.

The local product prices are test data only. The fixture mirrors the annual
one-month and monthly one-week free trials; edit it with Xcode's StoreKit
configuration editor if the App Store Connect offers change.

Once Xcode has launched the app with that scheme, the local purchase path can
be driven to Apple's confirmation sheet with:

```bash
maestro test \
  -e APP_TEST_EMAIL='your-test-app-account' \
  -e APP_TEST_PASSWORD='your-test-app-password' \
  .maestro/local-storekit-purchase.yaml
```

Do not add `launchApp` to that flow. Relaunching the process through Maestro
detaches it from Xcode's Run action and makes StoreKit fall back to the sandbox.

## Changing products later

- Change a price or introductory offer in App Store Connect. The app reads the
  updated values from StoreKit; no display-price code change is needed.
- To replace a product, create a new App Store product id, set it as
  `currentProductId` in the frontend catalogue, and move the old id into that
  plan's `legacyProductIds`. Add both the new and old ids to the same plan in
  the backend catalogue. This keeps existing subscribers entitled while new
  customers see the replacement.
- Update `storekit/Products.storekit` to mirror the products you want to test
  locally. It is a development fixture only and does not change App Store
  pricing.
- Do not delete an old id from `legacyProductIds` while subscribers may still
  hold that product, or from the backend catalogue while it can still renew.

## Server verification

The purchase request includes the account's stable `appAccountToken`. Apple’s
signed transaction is verified by the backend before it is stored, and App
Store Server Notifications keep renewal, expiry and refund state current while
the app is closed. The app uses the stored entitlement if StoreKit is
temporarily unavailable.

Local Xcode StoreKit transactions remain device-only unless an Xcode StoreKit
test certificate is exported and its path is configured on the backend. This
does not affect App Store sandbox or production transactions.

For local verification, select `Products.storekit` in Xcode, choose
Editor > Save Public Certificate, and set `APPLE_XCODE_ROOT_CA_PATH` in the
backend `.env` to the saved `.cer` file. Xcode also ships its current test root
at `/Applications/Xcode.app/Contents/PlugIns/IDEStoreKitEditor.ideplugin/Contents/Resources/StoreKitTestCertificate.cer`.

To prepare a real App Store sandbox purchase on the iOS simulator while the
local API and Metro are running:

```bash
maestro test \
  -e APP_TEST_EMAIL='your-test-app-account' \
  -e APP_TEST_PASSWORD='your-test-app-password' \
  .maestro/sandbox-purchase-prep.yaml
```

The flow stops at Apple's sign-in sheet. Enter the sandbox Apple Account there
manually; never place its password in the repository or command history.
