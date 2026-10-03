// Vercel Serverless Function: GET /api/health

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Sensor-Token');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const uptime = process.uptime ? Math.round(process.uptime()) : 1240;

  return res.status(200).json({
    status: "HEALTHY_AND_ONLINE",
    service: "PulseCity AI Urban Nervous System API",
    region: "Greater Accra Metropolitan Area (Ghana)",
    challenge: "Tech Hub Africa Hackathon 2026 ($1,000 Challenge)",
    uptimeSeconds: uptime,
    environment: process.env.NODE_ENV || "production",
    timestamp: new Date().toISOString(),
    supportedEndpoints: [
      "POST /api/telemetry/ingest",
      "GET /api/telemetry",
      "POST /api/gemini-proxy",
      "GET /api/health"
    ]
  });
}
