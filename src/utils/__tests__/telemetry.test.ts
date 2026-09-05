import { sanitizeTelemetry } from '../telemetry';

it('removes HTTP credentials, bodies, query strings and account context', () => {
    const event = sanitizeTelemetry({ type: undefined, request: {
        url: 'https://api.example.com/api/therapy-sessions?access_token=secret', method: 'POST',
        headers: { Authorization: 'Bearer secret' }, data: { signedTransaction: 'secret' },
    }, user: { email: 'private@example.com' }, breadcrumbs: [{ category: 'http', data: { token: 'secret' } }] });
    expect(event.request).toEqual({ url: 'https://api.example.com/api/therapy-sessions', method: 'POST' });
    expect(event.user).toBeUndefined();
    expect(JSON.stringify(event)).not.toContain('secret');
});
