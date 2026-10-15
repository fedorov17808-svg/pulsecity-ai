// Vercel Serverless Function: POST /api/gemini-proxy

// Default model can be overridden with GEMINI_MODEL; only gemini-* ids are accepted.
const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const MODEL_ID_PATTERN = /^gemini-[a-z0-9.-]+$/;

// Sliding-window IP rate limiter
const PROXY_RATE_LIMIT = new Map();
const RATE_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 30; // 30 req/min for AI endpoints

function isRateLimited(clientIp) {
  const now = Date.now();
  const record = PROXY_RATE_LIMIT.get(clientIp);

  if (!record || (now - record.startTime > RATE_WINDOW_MS)) {
    PROXY_RATE_LIMIT.set(clientIp, { count: 1, startTime: now });
    return false;
  }

  record.count += 1;
  return record.count > MAX_REQUESTS_PER_WINDOW;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Gemini-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || '127.0.0.1';

  if (isRateLimited(clientIp)) {
    return res.status(429).json({
      error: "Too Many Requests",
      message: "AI Proxy rate limit exceeded. Max 30 queries per minute per client.",
      code: "AI_RATE_LIMIT_EXCEEDED"
    });
  }

  // Determine API Key from environment or client header
  const envKey = process.env.GEMINI_API_KEY;
  const headerKey = req.headers['authorization']?.replace('Bearer ', '') || req.headers['x-gemini-key'];
  const apiKey = (envKey && envKey.trim()) || (headerKey && headerKey.trim());

  const { prompt, imageBase64, model = DEFAULT_MODEL } = req.body || {};

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: "Missing required 'prompt' string." });
  }

  if (prompt.length > 10000) {
    return res.status(400).json({ error: "Prompt exceeds maximum allowed length of 10,000 characters." });
  }

  if (imageBase64 && typeof imageBase64 === 'string' && imageBase64.length > 3500000) {
    return res.status(400).json({ error: "Image base64 payload exceeds 2.5MB size ceiling." });
  }

  // Validate model whitelist to prevent SSRF or path manipulation
  const targetModel = MODEL_ID_PATTERN.test(model) ? model : DEFAULT_MODEL;

  // If we have an API key, call Google AI Studio securely from the server
  if (apiKey && apiKey.length > 10) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`;

      const parts = [{ text: prompt }];

      if (imageBase64 && typeof imageBase64 === 'string') {
        const cleanBase64 = imageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
        parts.push({
          inlineData: {
            mimeType: "image/jpeg",
            data: cleanBase64
          }
        });
      }

      const googleResponse = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts }]
        })
      });

      if (!googleResponse.ok) {
        const errJson = await googleResponse.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `Google API returned ${googleResponse.status}`);
      }

      const googleData = await googleResponse.json();
      const rawText = googleData.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
      const cleanJson = rawText.replace(/```json\n?|\n?```/g, '').trim();

      return res.status(200).json({
        success: true,
        source: "GOOGLE_GEMINI_LIVE_API",
        model: targetModel,
        result: cleanJson
      });
    } catch (err) {
      console.warn("Server proxy failed to reach Google:", err.message);
      // Fall through to structured resilient fallback
    }
  }

  // No key configured or upstream failed: say so instead of returning made-up results
  return res.status(503).json({
    success: false,
    code: "AI_OFFLINE",
    error: apiKey
      ? "Gemini API request failed; AI features are offline."
      : "No GEMINI_API_KEY configured on the server; AI features are offline."
  });
}
