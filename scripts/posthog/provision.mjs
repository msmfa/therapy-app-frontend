#!/usr/bin/env node
import { pathToFileURL } from 'node:url';
import { manifest } from './meaningful-use.manifest.mjs';

const clone = (value) => JSON.parse(JSON.stringify(value));
const numericId = (value) => Number.isSafeInteger(Number(value)) && Number(value) > 0;
const ownKeysMatch = (actual, desired) => {
    if (Array.isArray(desired)) return Array.isArray(actual) && actual.length === desired.length
        && desired.every((value, index) => ownKeysMatch(actual[index], value));
    if (desired && typeof desired === 'object') return actual && typeof actual === 'object'
        && Object.entries(desired).every(([key, value]) => ownKeysMatch(actual[key], value));
    return actual === desired;
};

export function readConfiguration(env = process.env) {
    const apiKey = env.POSTHOG_PERSONAL_API_KEY?.trim();
    if (!apiKey || !/^[A-Za-z0-9_-]{10,512}$/.test(apiKey)) throw new Error('Set POSTHOG_PERSONAL_API_KEY in the environment.');
    const appHost = env.POSTHOG_APP_HOST?.replace(/\/$/, '') || manifest.target.appHost;
    const projectId = env.POSTHOG_PROJECT_ID || manifest.target.projectId;
    if (appHost !== manifest.target.appHost || projectId !== manifest.target.projectId) {
        throw new Error('Target differs from the reviewed manifest; edit and review its target before provisioning another project.');
    }
    const excludedCohortIds = (env.POSTHOG_EXCLUDE_COHORT_IDS || '').split(',').filter(Boolean).map((value) => {
        if (!/^[1-9][0-9]*$/.test(value.trim()) || !numericId(value.trim())) throw new Error('Invalid excluded cohort ID.');
        return Number(value.trim());
    });
    return { apiKey, appHost, projectId, excludedCohortIds: [...new Set(excludedCohortIds)] };
}

export function createApi({ apiKey, appHost, projectId }, fetchImpl = globalThis.fetch) {
    const prefix = `/api/projects/${projectId}/`;
    const checkedUrl = (input) => {
        const url = new URL(input, `${appHost}${prefix}`);
        if (url.origin !== appHost || url.username || url.password || !url.pathname.startsWith(prefix)
            || !/^(?:(?:dashboards|insights|cohorts)\/(?:[1-9][0-9]*\/)?)?$/.test(url.pathname.slice(prefix.length))) {
            throw new Error('Refusing a PostHog URL outside the reviewed project resources.');
        }
        return url;
    };
    const request = async (path, { method = 'GET', body } = {}) => {
        if (!['GET', 'POST', 'PATCH'].includes(method)) throw new Error('Unsupported provisioning method.');
        const url = checkedUrl(path);
        let response;
        try {
            response = await fetchImpl(url.toString(), {
                method, redirect: 'error', signal: AbortSignal.timeout(30_000),
                headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
                ...(body === undefined ? {} : { body: JSON.stringify(body) }),
            });
        } catch {
            // Do not echo tokens, request/response bodies, or remote error text.
            // A timed-out create is ambiguous: stop and let the next run read it.
            throw new Error(`PostHog ${method} ${url.pathname} failed; rerun the read-only plan before retrying.`);
        }
        if (!response.ok) throw new Error(`PostHog ${method} ${url.pathname}: HTTP ${response.status}.`);
        try { return await response.json(); }
        catch { throw new Error(`PostHog ${method} ${url.pathname} returned invalid JSON.`); }
    };
    const list = async (resource) => {
        const rows = [];
        const visited = new Set();
        let next = `${resource}/?limit=100`;
        while (next) {
            const url = checkedUrl(next).toString();
            if (visited.has(url) || visited.size >= 100) throw new Error('Pagination did not terminate safely.');
            visited.add(url);
            const page = await request(url);
            if (!page || !Array.isArray(page.results)) throw new Error(`Invalid ${resource} listing.`);
            rows.push(...page.results);
            next = page.next || null;
            if (next !== null && typeof next !== 'string') throw new Error('Invalid pagination URL.');
        }
        return rows;
    };
    return { request, list };
}

function exactMatch(rows, name) {
    const matches = rows.filter((row) => row.name === name);
    if (matches.some((row) => row.deleted) || matches.length > 1) {
        throw new Error(`Ambiguous or deleted object named "${name}"; resolve it in PostHog before rerunning.`);
    }
    if (matches[0] && !numericId(matches[0].id)) throw new Error(`Invalid object ID for "${name}".`);
    return matches[0] || null;
}

function withoutSingleGroupWrappers(group) {
    if (!group || !['AND', 'OR'].includes(group.type) || !Array.isArray(group.values)) return group;
    const values = group.values.map(withoutSingleGroupWrappers);
    // The cohort UI wraps its one criteria group in another AND/OR group.
    // A single nested group has identical logic and should not cause writes.
    if (values.length === 1 && ['AND', 'OR'].includes(values[0]?.type) && Array.isArray(values[0]?.values)) return values[0];
    return { ...group, values };
}

const normalized = (resource, object) => resource === 'insights'
    ? { ...object, dashboards: [...(object.dashboards || [])].sort((a, b) => a - b) }
    : resource === 'cohorts' && object.filters ? {
        ...object, filters: { ...object.filters, properties: withoutSingleGroupWrappers(object.filters.properties) },
    } : object;

export function buildDefinitions(excludedCohortIds = []) {
    const definitions = clone(manifest);
    const extraIds = [...new Set(excludedCohortIds)];
    for (const insight of definitions.insights) {
        insight.query.source.properties.push(...extraIds.map((id) => ({ type: 'cohort', key: 'id', value: id, operator: 'not_in' })));
    }
    for (const cohort of definitions.cohorts) {
        cohort.filters.properties.values.push(...extraIds.filter((id) => id !== manifest.target.internalTestCohortId)
            .map((id) => ({ type: 'cohort', key: 'id', value: id, negation: true })));
    }
    return definitions;
}

/** No captures, queries against event data, deletions, or unrelated object writes. */
export async function provision({ api, apply = false, excludedCohortIds = [], report = () => {} }) {
    const definitions = buildDefinitions(excludedCohortIds);
    const project = await api.request('');
    if (String(project.id) !== manifest.target.projectId || project.name !== manifest.target.projectName) {
        throw new Error('Project identity does not match the reviewed manifest.');
    }
    const resources = ['dashboards', 'insights', 'cohorts'];
    const pages = await Promise.all(resources.map((resource) => api.list(resource)));
    const lists = Object.fromEntries(resources.map((resource, index) => [resource, pages[index]]));
    for (const id of new Set([manifest.target.internalTestCohortId, ...excludedCohortIds])) {
        if (!lists.cohorts.some((cohort) => Number(cohort.id) === id && !cohort.deleted)) throw new Error(`Excluded cohort ${id} was not found.`);
        if (lists.cohorts.some((cohort) => Number(cohort.id) === id && definitions.cohorts.some((item) => item.name === cohort.name))) {
            throw new Error('A managed engagement cohort cannot be its own internal/test exclusion.');
        }
    }
    const entries = [
        { resource: 'dashboards', definition: definitions.dashboard },
        ...definitions.insights.map((definition) => ({ resource: 'insights', definition })),
        ...definitions.cohorts.map((definition) => ({ resource: 'cohorts', definition })),
    ].map((entry) => ({ ...entry, existing: exactMatch(lists[entry.resource], entry.definition.name) }));
    // Resolve every name before any mutation; duplicate names fail the whole plan.
    await Promise.all(entries.map(async (entry) => {
        if (entry.existing) {
            entry.existing = normalized(entry.resource, await api.request(`${entry.resource}/${entry.existing.id}/`));
            if (entry.existing.name !== entry.definition.name || entry.existing.deleted) throw new Error('Object changed during preflight.');
        }
    }));
    let dashboardId = entries[0].existing?.id ?? null;
    const result = [];
    for (const entry of entries) {
        const { resource, definition, existing } = entry;
        const desired = clone(definition);
        if (resource === 'insights') {
            desired.dashboards = [...new Set([...(existing?.dashboards || []), dashboardId ?? 0])].sort((a, b) => a - b);
        }
        const patch = existing ? Object.fromEntries(Object.entries(desired).filter(([key, value]) => !ownKeysMatch(existing[key], value))) : desired;
        const action = !existing ? 'create' : Object.keys(patch).length ? 'update' : 'unchanged';
        const item = { resource, name: definition.name, action, id: existing?.id ?? null };
        report(item);
        if (apply && action !== 'unchanged') {
            const saved = await api.request(existing ? `${resource}/${existing.id}/` : `${resource}/`, {
                method: existing ? 'PATCH' : 'POST', body: patch,
            });
            if (!numericId(saved?.id)) throw new Error('PostHog write did not return an object ID.');
            const verified = normalized(resource, await api.request(`${resource}/${saved.id}/`));
            if (!ownKeysMatch(verified, desired)) throw new Error(`PostHog did not preserve the definition for "${definition.name}".`);
            item.id = saved.id;
            if (resource === 'dashboards') dashboardId = saved.id;
        }
        result.push(item);
    }
    return { projectId: manifest.target.projectId, dashboardId, applied: apply, objects: result };
}

export async function main(args = process.argv.slice(2), env = process.env) {
    if (args.some((arg) => !['--apply', '--print-manifest', '--help'].includes(arg))) throw new Error('Unknown argument; use --help.');
    if (args.includes('--help')) {
        console.log('Usage: node scripts/posthog/provision.mjs [--apply | --print-manifest]\nDefault: read-only plan. Personal API key comes only from POSTHOG_PERSONAL_API_KEY.');
        return;
    }
    if (args.includes('--print-manifest')) {
        if (args.includes('--apply')) throw new Error('--print-manifest cannot be combined with --apply.');
        console.log(JSON.stringify(manifest, null, 2));
        return;
    }
    const configuration = readConfiguration(env);
    const outcome = await provision({
        api: createApi(configuration), apply: args.includes('--apply'), excludedCohortIds: configuration.excludedCohortIds,
        report: ({ action, resource, name }) => console.log(`${action}: ${resource} / ${name}`),
    });
    console.log(`${outcome.applied ? 'Applied and verified' : 'Read-only plan'} for project ${outcome.projectId}.`);
    if (outcome.dashboardId) console.log(`${configuration.appHost}/project/${outcome.projectId}/dashboard/${outcome.dashboardId}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    main().catch((error) => {
        console.error(error instanceof Error ? error.message : 'Provisioning failed.');
        process.exitCode = 1;
    });
}
