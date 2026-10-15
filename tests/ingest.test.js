import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import handler from '../api/telemetry/ingest.js';

function mockRes() {
  return {
    statusCode: 200,
    body: undefined,
    setHeader() {},
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
    end() { return this; }
  };
}

let ipCounter = 0;
async function post(body, token) {
  const res = mockRes();
  const headers = { 'x-forwarded-for': `10.0.0.${++ipCounter}` }; // fresh IP: avoid the rate limiter
  if (token !== undefined) headers['x-sensor-token'] = token;
  await handler({ method: 'POST', headers, body, socket: {} }, res);
  return res;
}

describe('POST /api/telemetry/ingest', () => {
  let fetchMock;

  beforeEach(() => {
    fetchMock = vi.fn(async (_url, opts) => ({
      ok: true,
      status: 201,
      json: async () => [{ id: 1, created_at: '2026-10-15T12:00:00Z', ...JSON.parse(opts.body) }]
    }));
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-role-key');
    vi.stubEnv('PULSECITY_SENSOR_TOKEN', 'test-token');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('returns 503 when the server has no sensor token configured', async () => {
    vi.stubEnv('PULSECITY_SENSOR_TOKEN', '');
    const res = await post({ nodeId: 'TR-01' }, 'anything');
    expect(res.statusCode).toBe(503);
    expect(res.body.code).toBe('SENSOR_TOKEN_NOT_CONFIGURED');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns 401 for a missing or wrong token', async () => {
    expect((await post({ nodeId: 'TR-01' })).statusCode).toBe(401);
    expect((await post({ nodeId: 'TR-01' }, 'wrong')).statusCode).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    ['no body', undefined],
    ['missing nodeId', { vehicleCount: 3 }],
    ['non-traffic node', { nodeId: 'ECO-01' }],
    ['out-of-range value', { nodeId: 'TR-01', congestionPercentage: 150 }],
    ['non-numeric value', { nodeId: 'TR-01', vehicleCount: 'many' }]
  ])('returns 400 for a bad payload (%s)', async (_label, body) => {
    const res = await post(body, 'test-token');
    expect(res.statusCode).toBe(400);
    expect(res.body.code).toBe('SCHEMA_VALIDATION_ERROR');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('stores a valid event in Supabase with the service role key', async () => {
    const res = await post({ nodeId: 'tr-01', vehicleCount: 12, pcuTotal: 18.4, queueLengthMeters: 60 }, 'test-token');

    expect(res.statusCode).toBe(201);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toBe('https://example.supabase.co/rest/v1/telemetry_events');
    expect(opts.headers.Authorization).toBe('Bearer service-role-key');
    expect(JSON.parse(opts.body)).toMatchObject({
      node_id: 'TR-01',
      vehicle_count: 12,
      pcu_total: 18.4,
      queue_length_m: 60
    });
  });

  it('returns 502 when Supabase rejects the insert', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) });
    const res = await post({ nodeId: 'TR-01' }, 'test-token');
    expect(res.statusCode).toBe(502);
  });
});
