// Vercel Serverless Function: POST /api/telemetry/ingest & GET /api/telemetry/ingest
//
// POST  stores one validated traffic telemetry event in Supabase (table telemetry_events).
// GET   returns the 25 most recent events (the dashboard polls this every 3 s).
//
// Required server-side environment variables (never exposed to the browser):
//   PULSECITY_SENSOR_TOKEN     shared secret sent by sensor nodes in X-Sensor-Token
//   SUPABASE_URL               https://<project>.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY  service role key; RLS allows writes only with this key

const RECENT_EVENTS_LIMIT = 25;

// In-memory sliding-window IP rate limiter (per warm instance; best effort only)
const RATE_LIMIT_MAP = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 180; // 180 req/min per IP

function isRateLimited(clientIp) {
  const now = Date.now();
  const record = RATE_LIMIT_MAP.get(clientIp);

  if (!record || (now - record.startTime > RATE_LIMIT_WINDOW_MS)) {
    RATE_LIMIT_MAP.set(clientIp, { count: 1, startTime: now });
    return false;
  }

  record.count += 1;
  return record.count > MAX_REQUESTS_PER_WINDOW;
}

function supabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return {
    endpoint: `${url.replace(/\/$/, '')}/rest/v1/telemetry_events`,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json'
    }
  };
}

// Maps a stored row back to the event shape the dashboard expects
function rowToEvent(row) {
  return {
    ...(row.payload || {}),
    id: `evt_${row.id}`,
    nodeId: row.node_id,
    receivedAt: row.created_at,
    epochMs: Date.parse(row.created_at)
  };
}

/**
 * Validates a POST body. Returns { error } or { record } where record holds the
 * normalised event (stored in full as `payload`).
 */
export function validateTelemetryPayload(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: "Request body must be a JSON object" };
  }

  const { nodeId } = body;
  if (!nodeId || typeof nodeId !== 'string') {
    return { error: "Missing required 'nodeId' string (e.g. 'TR-01' or 'GLOBAL_ACTION')" };
  }

  const cleanNodeId = nodeId.trim().toUpperCase();
  const isGlobalAction = cleanNodeId === 'GLOBAL_ACTION';
  if (!isGlobalAction && !/^TR-\d{2}$/.test(cleanNodeId)) {
    return { error: `Invalid nodeId format '${nodeId}'. Must match TR-01 … TR-99 or GLOBAL_ACTION.` };
  }

  const record = { nodeId: cleanNodeId };

  if (isGlobalAction) {
    record.actionType = typeof body.actionType === 'string' ? body.actionType.slice(0, 64) : 'UNKNOWN_ACTION';
    record.actionPayload = body.actionPayload && typeof body.actionPayload === 'object' ? body.actionPayload : {};
  }

  // Numeric fields: [name, min, max, integer]
  const numericFields = [
    ['congestionPercentage', 0, 100, false],
    ['vehicleCount', 0, 500, true],
    ['queueLength', 0, 500, true], // legacy name: vehicles waiting (used if vehicleCount is absent)
    ['pcuTotal', 0, 2000, false],
    ['queueLengthMeters', 0, 5000, false],
    ['avgSpeedKmh', 0, 200, false],
    ['flowRateVehiclesPerHour', 0, 25000, false]
  ];

  for (const [name, min, max, integer] of numericFields) {
    if (body[name] === undefined) continue;
    const value = Number(body[name]);
    if (Number.isNaN(value) || value < min || value > max) {
      return { error: `${name} must be a number between ${min} and ${max}` };
    }
    record[name] = integer ? Math.round(value) : value;
  }

  if (body.incidentDetected !== undefined) record.incidentDetected = Boolean(body.incidentDetected);
  if (typeof body.incidentDetails === 'string') record.incidentDetails = body.incidentDetails.slice(0, 250);
  if (body.emergencyTransitActive !== undefined) record.emergencyTransitActive = Boolean(body.emergencyTransitActive);

  return { record };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Sensor-Token, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || '127.0.0.1';
  if (isRateLimited(clientIp)) {
    return res.status(429).json({
      error: "Too Many Requests",
      message: "Rate limit exceeded. Maximum 180 requests per minute per IP.",
      code: "RATE_LIMIT_EXCEEDED"
    });
  }

  // GET: latest events for the dashboard
  if (req.method === 'GET') {
    const db = supabaseConfig();
    if (!db) {
      return res.status(503).json({ error: "Telemetry storage is not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).", code: "STORAGE_NOT_CONFIGURED" });
    }
    const dbRes = await fetch(`${db.endpoint}?select=*&order=created_at.desc&limit=${RECENT_EVENTS_LIMIT}`, { headers: db.headers });
    if (!dbRes.ok) {
      return res.status(502).json({ error: `Telemetry storage returned HTTP ${dbRes.status}`, code: "STORAGE_ERROR" });
    }
    const rows = await dbRes.json();
    return res.status(200).json({
      status: "ONLINE",
      recentEvents: rows.map(rowToEvent).reverse() // oldest first
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed. Use POST to ingest telemetry." });
  }

  // POST: 503 if the server has no token configured (never fall back to a built-in one)
  const expectedToken = process.env.PULSECITY_SENSOR_TOKEN;
  if (!expectedToken) {
    return res.status(503).json({
      error: "Sensor ingest is disabled: PULSECITY_SENSOR_TOKEN is not configured on the server.",
      code: "SENSOR_TOKEN_NOT_CONFIGURED"
    });
  }

  const token = req.headers['x-sensor-token'] || req.headers['authorization']?.replace('Bearer ', '');
  if (!token || token !== expectedToken) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Missing or invalid sensor authentication token in 'X-Sensor-Token' header.",
      code: "AUTH_TOKEN_INVALID"
    });
  }

  const { error, record } = validateTelemetryPayload(req.body);
  if (error) {
    return res.status(400).json({ error: "Bad Request", message: error, code: "SCHEMA_VALIDATION_ERROR" });
  }

  const db = supabaseConfig();
  if (!db) {
    return res.status(503).json({ error: "Telemetry storage is not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).", code: "STORAGE_NOT_CONFIGURED" });
  }

  const dbRes = await fetch(db.endpoint, {
    method: 'POST',
    headers: { ...db.headers, Prefer: 'return=representation' },
    body: JSON.stringify({
      node_id: record.nodeId,
      vehicle_count: record.vehicleCount ?? record.queueLength ?? null,
      pcu_total: record.pcuTotal ?? null,
      queue_length_m: record.queueLengthMeters ?? null,
      payload: record
    })
  });

  if (!dbRes.ok) {
    return res.status(502).json({ error: `Telemetry storage returned HTTP ${dbRes.status}`, code: "STORAGE_ERROR" });
  }

  const [row] = await dbRes.json();
  return res.status(201).json({
    status: "CREATED",
    message: `Telemetry stored for node ${record.nodeId}`,
    data: rowToEvent(row)
  });
}
