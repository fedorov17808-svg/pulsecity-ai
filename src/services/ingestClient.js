// Browser-side helper for POST /api/v1/telemetry/ingest.
//
// The sensor token is a server secret, so it is never bundled into the app.
// An operator can paste it in the Ingest Gateway tab; it is kept in this
// browser's localStorage only. Without it the server answers 401 (or 503 if
// the server itself has no token configured), and callers show that status.

const TOKEN_KEY = 'pulsecity_sensor_token';

export function getSensorToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

export function setSensorToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // storage unavailable (private mode); token just isn't remembered
  }
}

export async function postTelemetry(payload) {
  const startedAt = performance.now();
  const res = await fetch('/api/v1/telemetry/ingest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Sensor-Token': getSensorToken() },
    body: typeof payload === 'string' ? payload : JSON.stringify(payload)
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data, roundTripMs: Math.round(performance.now() - startedAt) };
}
