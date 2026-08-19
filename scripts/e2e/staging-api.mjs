/**
 * Shared helpers for the end-to-end support scripts.
 *
 * Plain ESM rather than TypeScript on purpose: these run from CI and from a
 * developer shell with bare `node`, and the repo has no TypeScript runner in
 * its dependencies. Keeping them dependency-free means there is nothing to
 * install before the guard below can refuse to talk to production.
 */

/**
 * Hosts that serve real user data. Any script that reaches one of these is a
 * bug, so this is a hard stop rather than a warning.
 */
const PRODUCTION_HOSTS = new Set([
    'plastic-brains.com',
    'www.plastic-brains.com',
]);

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '0.0.0.0']);

const isLocalHost = (hostname) =>
    LOCAL_HOSTS.has(hostname) || /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname) || /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname);

/**
 * Refuses to continue unless `baseUrl` clearly points somewhere safe.
 *
 * Two layers, because the requirement is "never touch production" and a typo
 * in a CI secret is the likeliest way that happens:
 *   1. Known production hostnames are rejected outright, with no override.
 *   2. Anything that is neither recognisably staging nor a local backend is
 *      rejected too, unless the caller opts in with E2E_ALLOW_UNKNOWN_HOST=1.
 */
export function assertNotProduction(baseUrl) {
    let url;
    try {
        url = new URL(baseUrl);
    } catch {
        throw new Error(`E2E_API_URL is not a valid URL: ${JSON.stringify(baseUrl)}`);
    }

    const hostname = url.hostname.toLowerCase();

    if (PRODUCTION_HOSTS.has(hostname)) {
        throw new Error(
            `Refusing to run against production (${hostname}). `
            + 'These scripts create and delete data and must only ever point at staging.',
        );
    }

    const looksLikeStaging = hostname.includes('staging');
    if (!looksLikeStaging && !isLocalHost(hostname)) {
        if (process.env.E2E_ALLOW_UNKNOWN_HOST !== '1') {
            throw new Error(
                `Refusing to run against an unrecognised host (${hostname}). `
                + 'Expected a staging hostname or a local backend. '
                + 'Set E2E_ALLOW_UNKNOWN_HOST=1 only if you are certain this is not production.',
            );
        }
        process.stderr.write(`[e2e] warning: proceeding against unrecognised host ${hostname}\n`);
    }

    return url;
}

/** Reads a required environment variable or exits with a usable message. */
export function requireEnv(name) {
    const value = process.env[name];
    if (!value || value.trim().length === 0) {
        throw new Error(`Missing required environment variable ${name}.`);
    }
    return value.trim();
}

export function resolveConfig() {
    const baseUrl = requireEnv('E2E_API_URL').replace(/\/+$/, '');
    assertNotProduction(baseUrl);

    return {
        baseUrl,
        email: requireEnv('E2E_EMAIL'),
        password: requireEnv('E2E_PASSWORD'),
        name: process.env.E2E_NAME?.trim() || 'Maestro E2E',
    };
}

/**
 * Minimal JSON fetch. Returns `{ status, body }` rather than throwing on a
 * non-2xx, because several callers treat specific failures (a 400 "User
 * already exists", a 401 on a missing account) as expected outcomes.
 */
export async function apiRequest(baseUrl, path, { method = 'GET', token, body, timeoutMs = 30000 } = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(`${baseUrl}${path}`, {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: body === undefined ? undefined : JSON.stringify(body),
            signal: controller.signal,
        });

        const text = await response.text();
        let parsed = null;
        if (text.length > 0) {
            try {
                parsed = JSON.parse(text);
            } catch {
                parsed = { raw: text };
            }
        }

        return { status: response.status, ok: response.ok, body: parsed };
    } finally {
        clearTimeout(timer);
    }
}

export async function login(baseUrl, email, password) {
    const { status, ok, body } = await apiRequest(baseUrl, '/api/auth/login', {
        method: 'POST',
        body: { email, password },
    });

    if (!ok || !body?.token) {
        const detail = body?.error ?? body?.message ?? `HTTP ${status}`;
        throw new Error(`Login failed for ${email}: ${detail}`);
    }

    return { token: body.token, user: body.user };
}

/** Start of the UTC day, `offsetDays` from today. */
export function utcDayBoundary(offsetDays, endOfDay = false) {
    const now = new Date();
    const date = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + offsetDays,
        endOfDay ? 23 : 0,
        endOfDay ? 59 : 0,
        endOfDay ? 59 : 0,
        endOfDay ? 999 : 0,
    ));
    return date;
}
