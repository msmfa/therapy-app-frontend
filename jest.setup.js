class ReactNativeLikeFormData {
    constructor() {
        this._parts = [];
    }

    append(name, value) {
        this._parts.push([String(name), value]);
    }

    getAll(name) {
        return this._parts.filter((entry) => entry[0] === name).map((entry) => entry[1]);
    }

    getParts() {
        return this._parts.map(([key, value]) => ({
            headers: { 'content-disposition': `form-data; name="${key}"` },
            string: typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value),
        }));
    }
}

if (typeof global.FormData === 'undefined') {
    global.FormData = ReactNativeLikeFormData;
}

jest.mock('@sentry/react-native', () => {
    const createScope = () => ({
        setTag: jest.fn(),
        setContext: jest.fn(),
        setFingerprint: jest.fn(),
    });

    return {
        init: jest.fn(),
        wrap: (component) => component,
        withScope: (callback) => callback(createScope()),
        configureScope: (callback) => callback(createScope()),
        captureException: jest.fn(),
        captureMessage: jest.fn(),
        mobileReplayIntegration: jest.fn(() => ({})),
        feedbackIntegration: jest.fn(() => ({})),
    };
});

if (!process.env.EXPO_PUBLIC_APP_STORE_URL) {
    process.env.EXPO_PUBLIC_APP_STORE_URL = 'https://example.com/app-store';
}

if (!process.env.EXPO_PUBLIC_PLAY_STORE_URL) {
    process.env.EXPO_PUBLIC_PLAY_STORE_URL = 'https://example.com/play-store';
}
