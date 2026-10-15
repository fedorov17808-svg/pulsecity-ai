import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { configDefaults } from 'vitest/config';

// Dev middleware: serve /api/* with the real serverless handlers from api/ so local
// development behaves like Vercel (same validation, same Supabase storage).
const API_ROUTES = {
  '/api/health': '/api/health.js',
  '/api/gemini-proxy': '/api/gemini-proxy.js',
  '/api/telemetry/ingest': '/api/telemetry/ingest.js',
  '/api/v1/telemetry/ingest': '/api/telemetry/ingest.js',
  '/api/ingest': '/api/telemetry/ingest.js'
};

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => { raw += chunk; });
    req.on('end', () => {
      if (!raw) return resolve(undefined);
      try { resolve(JSON.parse(raw)); } catch (err) { reject(err); }
    });
  });
}

function devApiPlugin(env) {
  return {
    name: 'dev-api-plugin',
    configureServer(server) {
      // Server-side secrets from .env become visible to the handlers only (not VITE_-prefixed)
      Object.assign(process.env, env);

      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url || '/', 'http://localhost');
        const modulePath = API_ROUTES[url.pathname];
        if (!modulePath) return next();

        try {
          req.query = Object.fromEntries(url.searchParams);
          req.body = req.method === 'POST' ? await readJsonBody(req) : undefined;
        } catch {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Invalid JSON body' }));
        }

        // Minimal Vercel-style response helpers
        res.status = (code) => { res.statusCode = code; return res; };
        res.json = (obj) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(obj)); return res; };

        const { default: handler } = await server.ssrLoadModule(modulePath);
        await handler(req, res);
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), devApiPlugin(loadEnv(mode, process.cwd(), ''))],
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
}));
