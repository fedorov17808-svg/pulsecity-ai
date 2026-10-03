// Alias for /api/telemetry/ingest
import ingestHandler from './telemetry/ingest.js';

export default function handler(req, res) {
  return ingestHandler(req, res);
}
