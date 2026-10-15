import { calculateWebsterSignalTiming, compareFixedVsWebster } from '../utils/websterAlgorithm';

// Delay comparison (fixed 120 s cycle vs Webster optimum) for the same approach flows
function delayComparisonFor(webster) {
  return compareFixedVsWebster({ phases: webster.phases });
}

export const GEMINI_CONFIG = {
  defaultModel: "gemini-2.5-flash",
  systemPrompt: `You are PulseCity AI Traffic Sentinel for Greater Accra. 
Analyze the image or road junction for traffic congestion, vehicles, Trotros, hazards, and emergency vehicles.
Detect all visible vehicles and return structured bounding boxes in normalized coordinates [0-1000].`
};

/**
 * Real Multi-Modal Computer Vision analysis with Gemini API
 * Attempts serverless proxy first (/api/gemini-proxy) to avoid exposing keys,
 * then falls back to direct client call or neural simulation.
 */
export async function analyzeTrafficVision(apiKey, cameraName, imageBase64, situationNotes = "") {
  const promptText = `Analyze this traffic camera frame from ${cameraName}. 
Situation notes: ${situationNotes || 'Live CCTV intersection surveillance'}.
Detect vehicles, hazards, and congestion.
Return ONLY valid JSON matching this schema:
{
  "congestionScore": number (0-100),
  "vehicleCount": number,
  "hazardDetected": boolean,
  "hazardDescription": string,
  "ambulanceDetected": boolean,
  "recommendedAction": string,
  "detectedObjects": [
    {
      "box_2d": [ymin, xmin, ymax, xmax],
      "label": string,
      "confidence": number
    }
  ],
  "confidenceScore": number
}`;

  // 1. Attempt Serverless Proxy (/api/gemini-proxy)
  try {
    const proxyHeaders = { "Content-Type": "application/json" };
    if (apiKey && apiKey.trim().length > 10) {
      proxyHeaders["X-Gemini-Key"] = apiKey.trim();
    }

    const proxyRes = await fetch("/api/gemini-proxy", {
      method: "POST",
      headers: proxyHeaders,
      body: JSON.stringify({
        prompt: promptText,
        imageBase64
      })
    });

    if (proxyRes.ok) {
      const proxyData = await proxyRes.json();
      if (proxyData.result) {
        const parsed = typeof proxyData.result === 'string' ? JSON.parse(proxyData.result) : proxyData.result;
        
        // Compute real Webster timing
        const flowEstimate = Math.max(600, (parsed.vehicleCount || 20) * 80);
        const webster = calculateWebsterSignalTiming({
          phases: [
            { name: "Main Arterial", flowRate: flowEstimate, saturationFlow: 1900 },
            { name: "Crossflow / Feeder", flowRate: Math.round(flowEstimate * 0.45), saturationFlow: 1800 }
          ]
        });

        parsed.websterOptimization = webster;
        parsed.greenLightDurationSeconds = webster.phases[0]?.effectiveGreenSeconds || 45;
        parsed.delayComparison = delayComparisonFor(webster);
        return parsed;
      }
    }
  } catch (proxyErr) {
    console.warn("Server proxy unreachable, falling back to direct/local pipeline:", proxyErr.message);
  }

  // 2. Direct client call if user provided manual API Key
  if (apiKey && apiKey.trim().length > 10) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`;
      const parts = [{ text: promptText }];

      if (imageBase64) {
        const cleanBase64 = imageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
        parts.push({
          inlineData: {
            mimeType: "image/jpeg",
            data: cleanBase64
          }
        });
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts }] })
      });

      if (response.ok) {
        const data = await response.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
        const cleanJson = rawText.replace(/```json\n?|\n?```/g, '').trim();
        const parsed = JSON.parse(cleanJson);

        const flowEstimate = Math.max(600, (parsed.vehicleCount || 20) * 80);
        const webster = calculateWebsterSignalTiming({
          phases: [
            { name: "Main Arterial", flowRate: flowEstimate, saturationFlow: 1900 },
            { name: "Crossflow / Feeder", flowRate: Math.round(flowEstimate * 0.45), saturationFlow: 1800 }
          ]
        });

        parsed.websterOptimization = webster;
        parsed.greenLightDurationSeconds = webster.phases[0]?.effectiveGreenSeconds || 45;
        parsed.delayComparison = delayComparisonFor(webster);
        return parsed;
      }
    } catch (err) {
      console.warn("Direct Gemini call failed:", err.message);
    }
  }

  // 3. Local Computer Vision backend (only in local HTTP development to prevent Mixed Content security block)
  const isLocalHttp = typeof window !== 'undefined' && window.location.protocol === 'http:';
  if (isLocalHttp && imageBase64) {
    try {
      const cvRes = await fetch("http://127.0.0.1:8000/vision/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_base64: imageBase64, camera_name: cameraName })
      });
      if (cvRes.ok) {
        const cvData = await cvRes.json();
        cvData.source = "LOCAL_REAL_CV_SOBEL_ENGINE";
        cvData.greenLightDurationSeconds = cvData.websterOptimization?.effectiveGreenSeconds || 45;
        return cvData;
      }
    } catch (cvErr) {
      // Local server offline
    }
  }

  // 4. No AI available: return a fixed sample scene, explicitly marked simulated
  return getLocalEdgeVisionAnalysis(cameraName, situationNotes);
}

/**
 * Algorithmic Edge Vision Engine with Webster signal optimization
 */
function getLocalEdgeVisionAnalysis(cameraName, situationNotes) {
  const isCircle = cameraName.includes("Circle") || cameraName.includes("01");
  const isMotorway = cameraName.includes("Motorway") || cameraName.includes("02");

  if (isMotorway) {
    const webster = calculateWebsterSignalTiming({
      phases: [
        { name: "Motorway Eastbound (Bottleneck)", flowRate: 2400, saturationFlow: 2200 },
        { name: "Spintex Bypass Feeder", flowRate: 850, saturationFlow: 1800 }
      ],
      maxCycleLength: 120
    });

    return {
      congestionScore: 88,
      vehicleCount: 64,
      hazardDetected: true,
      hazardDescription: "Broken-down heavy articulated container truck occupying Lane 2 with safety warning triangles.",
      ambulanceDetected: false,
      recommendedAction: "Activate Webster Phase Split: allocate 78s green wave for bypass corridor.",
      greenLightDurationSeconds: webster.phases[0]?.effectiveGreenSeconds || 65,
      delayComparison: delayComparisonFor(webster),
      confidenceScore: 0.96,
      websterOptimization: webster,
      detectedObjects: [
        { box_2d: [410, 175, 770, 350], label: "HAZARD: Stalled Articulated Haulage Truck", confidence: 0.99, isHazard: true },
        { box_2d: [840, 145, 920, 320], label: "Reflective Hazard Warning Cones", confidence: 0.97, isHazard: true },
        { box_2d: [590, 570, 825, 695], label: "Trotro Minibus [TEMA-ACCRA] (PCU: 2.2)", confidence: 0.98 },
        { box_2d: [615, 720, 860, 875], label: "Sprinter Minibus [TEMA-ACCRA] (PCU: 2.2)", confidence: 0.97 },
        { box_2d: [310, 475, 505, 560], label: "Haulage Rig (PCU: 3.0)", confidence: 0.96 }
      ],
      backend: "EDGE_OPTICAL_ANALYSIS",
      // fixed sample scene, not computed from the image
      simulated: true
    };
  }

  if (isCircle) {
    const webster = calculateWebsterSignalTiming({
      phases: [
        { name: "Ring Road Central Inflow", flowRate: 1750, saturationFlow: 1900 },
        { name: "Nkrumah Avenue Slip Road", flowRate: 980, saturationFlow: 1800 }
      ]
    });

    return {
      congestionScore: 76,
      vehicleCount: 48,
      hazardDetected: false,
      hazardDescription: "Trotro minibus loading bay queue extending into roundabout slip road.",
      ambulanceDetected: false,
      recommendedAction: "Split phase cycle: allocate 58s green for slip-road clearance. Sync with circle marshals.",
      greenLightDurationSeconds: webster.phases[0]?.effectiveGreenSeconds || 50,
      delayComparison: delayComparisonFor(webster),
      confidenceScore: 0.95,
      websterOptimization: webster,
      detectedObjects: [
        { box_2d: [670, 630, 885, 765], label: "Trotro Minibus #14 (PCU: 2.2)", confidence: 0.98 },
        { box_2d: [340, 558, 485, 635], label: "Freight Container Truck (PCU: 3.0)", confidence: 0.99 },
        { box_2d: [685, 340, 835, 430], label: "Trotro Minibus #21 (PCU: 2.2)", confidence: 0.96 },
        { box_2d: [590, 220, 660, 285], label: "Accra Yellow Cab (PCU: 1.0)", confidence: 0.94 },
        { box_2d: [865, 260, 985, 370], label: "Passenger Sedan Taxi (PCU: 1.0)", confidence: 0.92 }
      ],
      backend: "EDGE_OPTICAL_ANALYSIS",
      // fixed sample scene, not computed from the image
      simulated: true
    };
  }

  const webster = calculateWebsterSignalTiming({
    phases: [
      { name: "Primary Corridor", flowRate: 1100, saturationFlow: 1900 },
      { name: "Secondary Crossing", flowRate: 500, saturationFlow: 1800 }
    ]
  });

  return {
    congestionScore: 45,
    vehicleCount: 32,
    hazardDetected: false,
    hazardDescription: "Balanced urban flow. Normal pedestrian and minibus activity.",
    ambulanceDetected: false,
    recommendedAction: "Maintain Webster equilibrium timing. Throughput is operating within optimal bounds.",
    greenLightDurationSeconds: webster.phases[0]?.effectiveGreenSeconds || 40,
    delayComparison: delayComparisonFor(webster),
    confidenceScore: 0.92,
    websterOptimization: webster,
    detectedObjects: [
      { box_2d: [400, 250, 550, 420], label: "Passenger Sedan (PCU: 1.0)", confidence: 0.94 },
      { box_2d: [480, 520, 600, 680], label: "Okada Motorbike (PCU: 0.5)", confidence: 0.91 }
    ],
    backend: "EDGE_OPTICAL_ANALYSIS",
    // fixed sample scene, not computed from the image
    simulated: true
  };
}

export const RULE_BASED_LABEL = 'Rule-based mode (AI offline)';

const ASSISTANT_ACTIONS = ['DISPATCH_GREEN_WAVE', 'OVERRIDE_TRAFFIC_LIGHT', 'NONE'];

/**
 * Traffic assistant chat.
 *
 * - If the server has a Gemini key (or the user supplied one), the question goes to
 *   /api/gemini-proxy and the model picks the action itself (`mode: 'ai'`).
 * - Otherwise a small set of explicit rules answers, and every reply is labelled
 *   RULE_BASED_LABEL (`mode: 'rule-based'`). Rules are never presented as AI.
 *
 * Actions only change the simulated signal state in the browser; no real
 * traffic controller is connected.
 */
export async function queryIncidentCommander(apiKey, userMessage, cityState = {}) {
  const prompt = `You assist a traffic operator in Accra, Ghana. Signal controllers are simulated.
Current state:
- Congested intersections (>70%): ${cityState.trafficBottlenecks || 'none'}
- Active incident: ${cityState.activeEmergencies || 'none'}

Operator: ${userMessage}

Answer in at most 4 short sentences. Do not invent numbers that are not in the state above.
On the last line write exactly one of:
ACTION: DISPATCH_GREEN_WAVE
ACTION: OVERRIDE_TRAFFIC_LIGHT <node id, e.g. TR-01>
ACTION: NONE`;

  try {
    const headers = { 'Content-Type': 'application/json' };
    if (apiKey && apiKey.trim().length > 10) headers['X-Gemini-Key'] = apiKey.trim();
    const res = await fetch('/api/gemini-proxy', {
      method: 'POST',
      headers,
      body: JSON.stringify({ prompt })
    });
    if (res.ok) {
      const data = await res.json();
      if (typeof data.result === 'string' && data.result.trim()) {
        return { mode: 'ai', text: stripActionLine(data.result), toolCall: parseActionLine(data.result) };
      }
    }
  } catch {
    // proxy unreachable (e.g. tests, offline) -> rule-based mode below
  }

  return getRuleBasedResponse(userMessage);
}

function stripActionLine(text) {
  return text.replace(/^\s*ACTION:.*$/gim, '').trim();
}

export function parseActionLine(text) {
  const match = /^\s*ACTION:\s*([A-Z_]+)(?:\s+(TR-\d{2}))?/im.exec(text || '');
  if (!match || !ASSISTANT_ACTIONS.includes(match[1]) || match[1] === 'NONE') return null;
  if (match[1] === 'DISPATCH_GREEN_WAVE') {
    return { name: 'DISPATCH_GREEN_WAVE', params: { origin: 'N-CIRCLE', dest: 'N-37MIL' } };
  }
  return { name: 'OVERRIDE_TRAFFIC_LIGHT', params: { nodeId: match[2] || 'TR-01' } };
}

/**
 * Explicit keyword rules used when no AI is available. Deliberately simple and
 * labelled as such in every reply.
 */
export function getRuleBasedResponse(userMessage) {
  const q = (userMessage || '').toLowerCase();

  if (/ambulance|emergency|hospital|green wave/.test(q)) {
    return {
      mode: 'rule-based',
      text: `${RULE_BASED_LABEL}: matched "emergency" keywords. Dispatching a simulated green wave from Kwame Nkrumah Circle to 37 Military Hospital.`,
      toolCall: { name: 'DISPATCH_GREEN_WAVE', params: { origin: 'N-CIRCLE', dest: 'N-37MIL' } }
    };
  }

  const nodeMatch = /tr-\d{2}/.exec(q);
  if (/signal|light|webster|cycle|congestion|jam/.test(q)) {
    const nodeId = nodeMatch ? nodeMatch[0].toUpperCase() : 'TR-01';
    return {
      mode: 'rule-based',
      text: `${RULE_BASED_LABEL}: matched "signal" keywords. Applying the Webster plan to ${nodeId} in the simulation.`,
      toolCall: { name: 'OVERRIDE_TRAFFIC_LIGHT', params: { nodeId } }
    };
  }

  return {
    mode: 'rule-based',
    text: `${RULE_BASED_LABEL}: no rule matched. Try "green wave for an ambulance" or "recompute signal at TR-02".`,
    toolCall: null
  };
}
