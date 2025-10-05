import { BASE_URL } from '../const';

export type ApiErrorPayload = {
    message: string;
    code?: string | number;
    details?: unknown;
};

export class ApiError extends Error {
    public readonly status: number;
    public readonly code?: string | number;
    public readonly details?: unknown;

    constructor(status: number, payload: ApiErrorPayload) {
        super(payload.message);
        this.name = 'ApiError';
        this.status = status;
        this.code = payload.code;
        this.details = payload.details;
    }
}

export type ApiClientConfig = {
    baseUrl: string;
    defaultTimeoutMs: number;
    getToken?: () => string | null | Promise<string | null>;
    refreshAuth?: () => Promise<boolean>;
    onAuthFailure?: () => Promise<void> | void;
};

const DEFAULT_CONFIG: ApiClientConfig = {
    baseUrl: BASE_URL,
    defaultTimeoutMs: 15000,
};

let config: ApiClientConfig = { ...DEFAULT_CONFIG };
let refreshInFlight: Promise<boolean> | null = null;

export const configureApiClient = (overrides: Partial<ApiClientConfig>) => {
    config = { ...config, ...overrides };
};

const createTimeoutController = (timeoutMs: number) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
        controller.abort();
    }, timeoutMs);

    return { controller, timeoutId };
};

const parseErrorPayload = async (response: Response): Promise<ApiErrorPayload> => {
    try {
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
            const raw: unknown = await response.json();

            if (typeof raw === 'string') {
                return { message: raw };
            }

            if (raw && typeof raw === 'object') {
                const record = raw as Record<string, unknown>;
                const messageCandidate = record.message;
                const errorCandidate = record.error;

                const message = typeof messageCandidate === 'string'
                    ? messageCandidate
                    : typeof errorCandidate === 'string'
                        ? errorCandidate
                        : response.statusText || 'Request failed';

                return {
                    message,
                    code: typeof record.code === 'string' || typeof record.code === 'number' ? record.code : undefined,
                    details: record.details,
                };
            }
        } else {
            const text = await response.text();
            if (text) {
                return { message: text };
            }
        }
    } catch (error) {
        console.warn('[apiClient] failed to parse error payload', error);
    }

    return { message: response.statusText || 'Request failed' };
};

const withAuthHeader = async (headers: HeadersInit | undefined): Promise<Headers> => {
    const baseHeaders = new Headers(headers ?? {});
    if (!config.getToken) {
        return baseHeaders;
    }

    const token = await config.getToken();
    if (!token) {
        return baseHeaders;
    }

    const value = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    baseHeaders.set('Authorization', value);
    return baseHeaders;
};

const ensureRefresh = async (): Promise<boolean> => {
    if (!config.refreshAuth) {
        return false;
    }

    if (!refreshInFlight) {
        refreshInFlight = (async () => {
            try {
                return await config.refreshAuth!();
            } catch (error) {
                console.warn('[apiClient] refreshAuth failed', error);
                return false;
            } finally {
                refreshInFlight = null;
            }
        })();
    }

    return refreshInFlight;
};

export type ApiRequestOptions = {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    headers?: HeadersInit;
    body?: unknown;
    auth?: boolean;
    timeoutMs?: number;
    retryOnAuthFailure?: boolean;
    parseJson?: boolean;
};

const serializeBody = (body: unknown, headers: Headers): BodyInit | undefined => {
    if (body == null) {
        return undefined;
    }

    if (
        body instanceof FormData ||
        body instanceof URLSearchParams ||
        typeof body === 'string' ||
        body instanceof Blob
    ) {
        return body;
    }

    if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    return JSON.stringify(body);
};

export async function apiRequest<T = unknown>(path: string, options: ApiRequestOptions = {}): Promise<T> {
    const {
        method = 'GET',
        headers,
        body,
        auth = true,
        timeoutMs = config.defaultTimeoutMs,
        retryOnAuthFailure = true,
        parseJson = true,
    } = options;

    const url = path.startsWith('http') ? path : `${config.baseUrl}${path}`;
    const initialHeaders = auth
        ? await withAuthHeader(headers)
        : new Headers(headers ?? {});
    const serializedBody = serializeBody(body, initialHeaders);
    const { controller, timeoutId } = createTimeoutController(timeoutMs);

    let response: Response;

    try {
        response = await fetch(url, {
            method,
            headers: initialHeaders,
            body: serializedBody,
            signal: controller.signal,
        });
    } catch (error) {
        clearTimeout(timeoutId);

        if (error instanceof DOMException && error.name === 'AbortError') {
            throw new ApiError(408, { message: 'Request timed out' });
        }

        const message = error instanceof Error ? error.message : 'Network request failed';
        throw new ApiError(0, { message });
    }

    clearTimeout(timeoutId);

    if (response.status === 401 && auth && retryOnAuthFailure) {
        const refreshed = await ensureRefresh();
        if (refreshed) {
            return apiRequest<T>(path, { ...options, retryOnAuthFailure: false });
        }

        await config.onAuthFailure?.();
        throw new ApiError(401, { message: 'Authentication required' });
    }

    if (!response.ok) {
        const payload = await parseErrorPayload(response);
        throw new ApiError(response.status, payload);
    }

    if (response.status === 204 || !parseJson) {
        return undefined as T;
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
        const payload: unknown = await response.json();
        return payload as T;
    }

    const text = await response.text();
    return text as unknown as T;
}

export const apiGet = <T = unknown>(path: string, options?: Omit<ApiRequestOptions, 'method'>) =>
    apiRequest<T>(path, { ...options, method: 'GET' });

export const apiPost = <T = unknown>(path: string, body?: unknown, options?: Omit<ApiRequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'POST', body });

export const apiPut = <T = unknown>(path: string, body?: unknown, options?: Omit<ApiRequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'PUT', body });

export const apiDelete = <T = unknown>(path: string, options?: Omit<ApiRequestOptions, 'method'>) =>
    apiRequest<T>(path, { ...options, method: 'DELETE' });
