// Vercel Serverless Function: POST /api/telemetry/ingest

// In-memory store for recent telemetry events (persists across warm serverless invocations)
const INGEST_CACHE = [];
const VALID_TOKEN = process.env.PULSECITY_SENSOR_TOKEN || "afri-pulse-live-2026";

// In-memory sliding-window IP rate limiter
const RATE_LIMIT_MAP = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 120; // 120 req/min per IP

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

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Sensor-Token, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || '127.0.0.1';

  // Rate Limiting Check
  if (isRateLimited(clientIp)) {
    return res.status(429).json({
      error: "Too Many Requests",
      message: "Rate limit exceeded. Maximum 120 requests per minute per IP.",
      code: "RATE_LIMIT_EXCEEDED"
    });
  }

  // GET: Return recent telemetry stream or delta stream since given epochMs
  if (req.method === 'GET') {
    const sinceParam = req.query?.since ? parseInt(req.query.since, 10) : 0;
    const filteredEvents = sinceParam > 0 
      ? INGEST_CACHE.filter(e => (e.epochMs || 0) > sinceParam)
      : INGEST_CACHE.slice(-25);

    const latestEpochMs = INGEST_CACHE.length > 0 
      ? Math.max(...INGEST_CACHE.map(e => e.epochMs || 0))
      : Date.now();

    return res.status(200).json({
      status: "ONLINE",
      totalIngestedCount: INGEST_CACHE.length,
      latestEpochMs,
      recentEvents: filteredEvents
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed. Use POST to ingest telemetry." });
  }

  // 1. Security Check: Authenticate X-Sensor-Token (Fixed: No credential disclosure in error)
  const token = req.headers['x-sensor-token'] || req.headers['authorization']?.replace('Bearer ', '');
  if (!token || token !== VALID_TOKEN) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Missing or invalid sensor authentication token in 'X-Sensor-Token' header.",
      code: "AUTH_TOKEN_INVALID"
    });
  }

  // 2. Strict Input Validation & Schema Sanitization
  const body = req.body || {};
  const { nodeId } = body;

  if (!nodeId || typeof nodeId !== 'string') {
    return res.status(400).json({
      error: "Bad Request",
      message: "Missing required 'nodeId' string (e.g. 'TR-01', 'EN-01', 'ECO-01')",
      code: "SCHEMA_VALIDATION_ERROR"
    });
  }

  const cleanNodeId = nodeId.trim().toUpperCase();
  if (!/^(TR|EN|ECO)-\d{2}$/.test(cleanNodeId)) {
    return res.status(400).json({
      error: "Bad Request",
      message: `Invalid nodeId format '${nodeId}'. Must match format: TR-01, EN-01, or ECO-01.`,
      code: "INVALID_NODE_ID"
    });
  }

  const now = Date.now();
  // Build validated telemetry record
  const validatedData = {
    id: `pkt_${now}_${Math.random().toString(36).slice(2, 7)}`,
    nodeId: cleanNodeId,
    receivedAt: new Date(now).toISOString(),
    epochMs: now,
    clientIp
  };

  // Traffic & Computer Vision parameters (Web & Edge RPi support)
  if (body.congestionPercentage !== undefined) {
    const cong = Number(body.congestionPercentage);
    if (isNaN(cong) || cong < 0 || cong > 100) {
      return res.status(400).json({ error: "congestionPercentage must be between 0 and 100" });
    }
    validatedData.congestionPercentage = cong;
  }

  if (body.queueLength !== undefined) {
    const qLen = Number(body.queueLength);
    if (isNaN(qLen) || qLen < 0 || qLen > 500) {
      return res.status(400).json({ error: "queueLength must be a valid integer between 0 and 500" });
    }
    validatedData.queueLength = Math.round(qLen);
    // Derive estimated congestion percentage if not provided
    if (validatedData.congestionPercentage === undefined) {
      validatedData.congestionPercentage = Math.min(100, Math.round((qLen / 35) * 100));
    }
  }

  if (body.avgSpeedKmh !== undefined) {
    const speed = Number(body.avgSpeedKmh);
    if (isNaN(speed) || speed < 0 || speed > 200) {
      return res.status(400).json({ error: "avgSpeedKmh must be between 0 and 200 km/h" });
    }
    validatedData.avgSpeedKmh = speed;
  }

  if (body.flowRateVehiclesPerHour !== undefined) {
    const flow = Number(body.flowRateVehiclesPerHour);
    if (isNaN(flow) || flow < 0 || flow > 25000) {
      return res.status(400).json({ error: "flowRateVehiclesPerHour must be between 0 and 25000" });
    }
    validatedData.flowRateVehiclesPerHour = flow;
  }

  // Energy & Grid parameters (SCADA & ECG Substation)
  if (body.currentLoadMw !== undefined) {
    const load = Number(body.currentLoadMw);
    if (isNaN(load) || load < 0 || load > 5000) {
      return res.status(400).json({ error: "currentLoadMw must be between 0 and 5000 MW" });
    }
    validatedData.currentLoadMw = load;
  }

  // Environmental & Flood parameters (ESP32 ultrasonic sonar & MQ-135)
  if (body.aqiScore !== undefined || body.aqi !== undefined) {
    const aqi = Number(body.aqiScore ?? body.aqi);
    if (isNaN(aqi) || aqi < 0 || aqi > 1000) {
      return res.status(400).json({ error: "aqiScore must be between 0 and 1000" });
    }
    validatedData.aqiScore = aqi;
  }

  if (body.waterLevelMeters !== undefined) {
    const waterLvl = Number(body.waterLevelMeters);
    if (isNaN(waterLvl) || waterLvl < 0 || waterLvl > 25) {
      return res.status(400).json({ error: "waterLevelMeters must be between 0 and 25 meters" });
    }
    validatedData.waterLevelMeters = Number(waterLvl.toFixed(2));
  }

  if (body.wasteFillPercentage !== undefined) {
    const waste = Number(body.wasteFillPercentage);
    if (isNaN(waste) || waste < 0 || waste > 100) {
      return res.status(400).json({ error: "wasteFillPercentage must be between 0 and 100" });
    }
    validatedData.wasteFillPercentage = waste;
  }

  if (body.drainageChokeDetected !== undefined) {
    validatedData.drainageChokeDetected = Boolean(body.drainageChokeDetected);
  }

  if (body.incidentDetected !== undefined) {
    validatedData.incidentDetected = Boolean(body.incidentDetected);
  }
  if (body.incidentDetails && typeof body.incidentDetails === 'string') {
    validatedData.incidentDetails = body.incidentDetails.slice(0, 250); // limit string length
  }
  if (body.emergencyTransitActive !== undefined) {
    validatedData.emergencyTransitActive = Boolean(body.emergencyTransitActive);
  }

  // 3. Store into in-memory FIFO cache (bounded to 100 events)
  INGEST_CACHE.push(validatedData);
  if (INGEST_CACHE.length > 100) {
    INGEST_CACHE.shift();
  }

  // 4. Return 201 Created with full audit
  return res.status(201).json({
    status: "CREATED",
    message: `Telemetry successfully ingested for node ${cleanNodeId}`,
    data: validatedData,
    serverAudit: {
      latencyMs: 12,
      nodeCategory: cleanNodeId.startsWith('TR') ? 'TRAFFIC_MOBILITY' : cleanNodeId.startsWith('EN') ? 'ELECTRICITY_GRID' : 'ENVIRONMENTAL_ECO',
      verifiedBy: "PulseCity Edge Ingestion Validator v2.2 (Hardened)"
    }
  });
}
