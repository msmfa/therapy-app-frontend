import test from 'node:test';
import assert from 'node:assert/strict';
import { manifest } from './meaningful-use.manifest.mjs';
import { buildDefinitions, createApi, provision, readConfiguration } from './provision.mjs';

const copy = (value) => JSON.parse(JSON.stringify(value));
function fixture() {
    const rows = { dashboards: [], insights: [], cohorts: [{ id: 223892, name: 'Internal / Test users' }] };
    const calls = [];
    let id = 1;
    const api = {
        list: async (resource) => copy(rows[resource]),
        request: async (path, { method = 'GET', body } = {}) => {
            calls.push({ path, method, body: copy(body ?? null) });
            if (!path) return { id: 260159, name: 'Plastic Brains' };
            const [resource, rawId] = path.split('/');
            if (method === 'GET') return copy(rows[resource].find((row) => row.id === Number(rawId)));
            if (method === 'POST') {
                const created = { ...copy(body), id: id++ };
                rows[resource].push(created);
                return copy(created);
            }
            assert.equal(method, 'PATCH');
            const existing = rows[resource].find((row) => row.id === Number(rawId));
            Object.assign(existing, copy(body));
            return copy(existing);
        },
    };
    return { api, rows, calls, writes: () => calls.filter((call) => call.method !== 'GET') };
}

test('read-only is the default, including when every hosted object is absent', async () => {
    const f = fixture();
    const result = await provision({ api: f.api });
    assert.equal(result.applied, false);
    assert.equal(result.objects.length, 10);
    assert.ok(result.objects.every((row) => row.action === 'create'));
    assert.equal(f.writes().length, 0);
});

test('creates exactly one dashboard, seven insights, two cohorts, then reruns without writes', async () => {
    const f = fixture();
    const created = await provision({ api: f.api, apply: true });
    assert.equal(f.writes().length, 10);
    assert.deepEqual(f.rows.insights.map((row) => row.dashboards), Array.from({ length: 7 }, () => [created.dashboardId]));
    // Defaults/derived fields added by the API do not cause endless updates.
    f.rows.insights[0].query.source.response = null;
    f.rows.cohorts.find((row) => row.name === 'Power users — 60 days').filters.properties.values[0].bytecode = ['derived'];
    for (const row of f.rows.cohorts.filter((cohort) => cohort.filters)) {
        row.filters.properties = { type: 'OR', values: [row.filters.properties] };
    }
    f.calls.length = 0;
    const second = await provision({ api: f.api, apply: true });
    assert.ok(second.objects.every((row) => row.action === 'unchanged'));
    assert.equal(f.writes().length, 0);
});

test('updates only managed definition fields and preserves other insights, tiles and memberships', async () => {
    const f = fixture();
    await provision({ api: f.api, apply: true });
    f.rows.dashboards[0].tiles = [{ id: 'unrelated-tile' }];
    f.rows.insights[0].dashboards = [999, 1];
    f.rows.insights[0].favorited = true;
    f.rows.insights[0].query.source.funnelsFilter.funnelWindowInterval = 3;
    f.rows.insights.push({ id: 500, name: 'Unrelated analysis', query: { kind: 'HogQLQuery', query: 'SELECT 1' } });
    f.calls.length = 0;
    await provision({ api: f.api, apply: true });
    assert.equal(f.writes().length, 1);
    assert.deepEqual(Object.keys(f.writes()[0].body), ['query']);
    assert.deepEqual(f.rows.insights[0].dashboards, [999, 1]);
    assert.equal(f.rows.insights[0].favorited, true);
    assert.deepEqual(f.rows.dashboards[0].tiles, [{ id: 'unrelated-tile' }]);
    assert.equal(f.rows.insights.at(-1).name, 'Unrelated analysis');
});

test('preflights duplicate names, project identity and excluded cohorts before any write', async () => {
    const f = fixture();
    f.rows.insights.push({ id: 50, name: 'First meaningful return' }, { id: 51, name: 'First meaningful return' });
    await assert.rejects(provision({ api: f.api, apply: true }), /Ambiguous/);
    assert.equal(f.writes().length, 0);
    await assert.rejects(provision({ api: f.api, apply: true, excludedCohortIds: [999] }), /was not found/);
    const otherProject = { ...f.api, request: async () => ({ id: 999, name: 'Other project' }) };
    await assert.rejects(provision({ api: otherProject, apply: true }), /identity/);
    assert.equal(f.writes().length, 0);
});

test('stops on an ambiguous create and recovers by reading its result on the next run', async () => {
    const f = fixture();
    const request = f.api.request;
    let fail = true;
    f.api.request = async (path, options) => {
        const result = await request(path, options);
        if (fail && options?.method === 'POST') { fail = false; throw new Error('transport failed after create'); }
        return result;
    };
    await assert.rejects(provision({ api: f.api, apply: true }), /transport/);
    assert.equal(f.rows.dashboards.length, 1);
    await provision({ api: f.api, apply: true });
    assert.equal(f.rows.dashboards.length, 1);
    assert.equal(f.rows.insights.length, 7);
});

test('requires read-back verification rather than assuming a successful HTTP write kept the definition', async () => {
    const f = fixture();
    const request = f.api.request;
    f.api.request = async (path, options) => {
        const result = await request(path, options);
        if (options?.method === 'POST' && path === 'insights/') f.rows.insights.at(-1).query = null;
        return result;
    };
    await assert.rejects(provision({ api: f.api, apply: true }), /did not preserve/);
});

test('production, people aggregation, OR grouping, windows and cohort thresholds match the plan', () => {
    const definitions = buildDefinitions([77]);
    assert.equal(definitions.insights.length, 7);
    assert.equal(definitions.cohorts.length, 2);
    for (const insight of definitions.insights) {
        assert.equal(insight.query.source.filterTestAccounts, true);
        assert.equal(insight.query.source.aggregation_group_type_index, null);
        assert.ok(insight.query.source.properties.some((p) => p.key === 'environment' && p.value[0] === 'production'));
        assert.ok(insight.query.source.properties.some((p) => p.type === 'cohort' && p.value === 77 && p.operator === 'not_in'));
    }
    assert.deepEqual(definitions.insights.filter((i) => i.query.source.kind === 'FunnelsQuery')
        .map((i) => [i.query.source.funnelsFilter.funnelWindowInterval, i.query.source.funnelsFilter.funnelWindowIntervalUnit]),
    [[14, 'day'], [1, 'hour'], [60, 'day'], [30, 'minute']]);
    const repeat = definitions.insights.find((i) => i.name === 'Repeat meaningful use').query.source;
    assert.equal(repeat.series[0].kind, 'GroupNode');
    assert.equal(repeat.series[0].math, 'dau');
    assert.equal(repeat.series[0].operator, 'OR');
    assert.equal(repeat.interval, 'week');
    assert.deepEqual(definitions.cohorts[0].filters.properties.values.filter((p) => p.type === 'behavioral')
        .map((p) => [p.key, p.operator, p.operator_value, p.time_value]),
    [['note_saved', 'gte', 2, 60], ['review_completed', 'gte', 4, 60]]);
    for (const cohort of definitions.cohorts) {
        assert.equal(cohort.is_static, false);
        assert.equal(cohort.filters.filterTestAccounts, false);
        assert.ok(cohort.filters.properties.values.some((p) => p.type === 'cohort' && p.value === 223892 && p.negation));
        assert.ok(cohort.filters.properties.values.some((p) => p.type === 'cohort' && p.value === 77 && p.negation));
        for (const row of cohort.filters.properties.values.filter((p) => p.type === 'behavioral')) {
            assert.ok(row.event_filters.some((p) => p.key === 'environment' && p.value[0] === 'production'));
        }
    }
    assert.equal(manifest.insights[0].query.source.properties.length, 1, 'building overrides cannot mutate the source manifest');
});

test('required hosted internal cohort survives default and additive provisioning without duplicates', async () => {
    const definitions = buildDefinitions([223892, 77, 223892, 77]);
    for (const cohort of definitions.cohorts) {
        assert.deepEqual(cohort.filters.properties.values.filter((p) => p.type === 'cohort').map((p) => p.value), [223892, 77]);
    }
    const f = fixture();
    f.rows.cohorts = [];
    await assert.rejects(provision({ api: f.api, apply: true }), /Excluded cohort 223892 was not found/);
    assert.equal(f.writes().length, 0);
    f.rows.cohorts.push({ id: 223892, name: 'Internal / Test users', deleted: true });
    await assert.rejects(provision({ api: f.api, apply: true }), /Excluded cohort 223892 was not found/);
    assert.equal(f.writes().length, 0);
});

const config = { apiKey: 'phx_test_private_secret', appHost: manifest.target.appHost, projectId: manifest.target.projectId };
test('follows safe pagination without exposing credentials to another host or resource', async () => {
    const calls = [];
    const api = createApi(config, async (url, options) => {
        calls.push({ url, options });
        return new Response(JSON.stringify({ results: [{ id: calls.length }], next: calls.length === 1 ? '/api/projects/260159/insights/?offset=1' : null }));
    });
    assert.equal((await api.list('insights')).length, 2);
    assert.equal(calls[0].options.redirect, 'error');
    assert.equal(calls[0].options.headers.Authorization, `Bearer ${config.apiKey}`);
    let count = 0;
    const hostile = createApi(config, async () => { count++; return new Response(JSON.stringify({ results: [], next: 'https://untrusted.example/api/projects/260159/insights/' })); });
    await assert.rejects(hostile.list('insights'), /outside/);
    assert.equal(count, 1);
    await assert.rejects(api.request('/capture/', { method: 'POST' }), /outside/);
    await assert.rejects(api.request('insights/1/', { method: 'DELETE' }), /Unsupported/);
});

test('redacts transport/server failures and accepts credentials only from the named environment variable', async () => {
    const throwing = createApi(config, async () => { throw new Error(`failed with ${config.apiKey}`); });
    await assert.rejects(throwing.request('insights/'), (error) => !error.message.includes(config.apiKey));
    const errorResponse = createApi(config, async () => new Response(config.apiKey, { status: 403 }));
    await assert.rejects(errorResponse.request('insights/'), (error) => error.message.includes('403') && !error.message.includes(config.apiKey));
    assert.throws(() => readConfiguration({ EXPO_PUBLIC_POSTHOG_KEY: 'phc_public_key' }), /PERSONAL/);
    assert.throws(() => readConfiguration({ POSTHOG_PERSONAL_API_KEY: config.apiKey, POSTHOG_PROJECT_ID: '999' }), /Target differs/);
    assert.deepEqual(readConfiguration({ POSTHOG_PERSONAL_API_KEY: config.apiKey, POSTHOG_EXCLUDE_COHORT_IDS: '2,3,2' }).excludedCohortIds, [2, 3]);
});
