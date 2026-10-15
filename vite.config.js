import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { configDefaults } from 'vitest/config';

// Dev middleware plugin so /api/... routes work in local development identically to Vercel
function devApiPlugin() {
  return {
    name: 'dev-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && req.url.startsWith('/api/')) {
          const urlPath = req.url.split('?')[0];

          // Handle Health check
          if (urlPath === '/api/health') {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify({
              status: "HEALTHY_AND_ONLINE",
              service: "PulseCity AI Urban Nervous System Local Gateway",
              region: "Greater Accra Metropolitan Area (Ghana)",
              uptimeSeconds: Math.round(process.uptime()),
              environment: "development",
              timestamp: new Date().toISOString()
            }));
            return;
          }

          // Handle Ingestion API
          if (urlPath === '/api/v1/telemetry/ingest' || urlPath === '/api/telemetry/ingest' || urlPath === '/api/ingest') {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Sensor-Token, Authorization');

            if (req.method === 'OPTIONS') {
              res.statusCode = 200;
              res.end();
              return;
            }

            // Auth check
            const token = req.headers['x-sensor-token'] || req.headers['authorization']?.replace('Bearer ', '');
            if (!token || token !== 'afri-pulse-live-2026') {
              res.statusCode = 401;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                error: "Unauthorized",
                message: "Missing or invalid sensor authentication token in 'X-Sensor-Token' header.",
                code: "AUTH_TOKEN_INVALID"
              }));
              return;
            }

            // Read body
            let bodyStr = '';
            req.on('data', chunk => { bodyStr += chunk; });
            req.on('end', () => {
              try {
                const body = bodyStr ? JSON.parse(bodyStr) : {};
                const nodeId = body.nodeId || "TR-01";

                res.statusCode = 201;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  status: "CREATED",
                  message: `Telemetry successfully ingested for node ${nodeId}`,
                  data: {
                    ...body,
                    receivedAt: new Date().toISOString(),
                    gateway: "Vite Local Dev Bridge v2.2 (Hardened)"
                  },
                  serverAudit: {
                    latencyMs: 8,
                    verifiedBy: "PulseCity Local Edge Ingestion Engine"
                  }
                }));
              } catch (err) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: "Invalid JSON format: " + err.message }));
              }
            });
            return;
          }

          // Handle Gemini Proxy locally
          if (urlPath === '/api/gemini-proxy') {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.statusCode = 200;
            res.end(JSON.stringify({
              success: true,
              source: "PULSECITY_LOCAL_DEV_PROXY",
              result: JSON.stringify({
                congestionScore: 78,
                vehicleCount: 54,
                hazardDetected: false,
                hazardDescription: "Local Vite Dev Mode Simulated Telemetry",
                ambulanceDetected: false,
                confidenceScore: 0.94
              })
            }));
            return;
          }
        }
        next();
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), devApiPlugin()],
  test: {
    // Archived (non-submission) modules are kept for reference only.
    exclude: [...configDefaults.exclude, 'src/_archive/**']
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'vendor';
          }
          if (id.includes('node_modules/leaflet/')) {
            return 'leaflet';
          }
          if (id.includes('node_modules/lucide-react/')) {
            return 'icons';
          }
        }
      }
    }
  }
});
