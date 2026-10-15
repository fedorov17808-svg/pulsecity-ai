/**
 * PulseCity AI — Persistent Telemetry Store & Audit Logger
 * Manages client-side time-series buffer (LocalStorage & memory)
 * Generates cryptographic telemetry packet receipts and CSV / JSON exports.
 */

const STORAGE_KEY = 'pulsecity_telemetry_history_v3';
const MAX_PACKETS = 250;

let memoryCache = null;

function loadStorage() {
  if (memoryCache !== null) return memoryCache;
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      memoryCache = JSON.parse(raw);
      if (Array.isArray(memoryCache)) return memoryCache;
    }
  } catch (e) {
    console.warn('Telemetry storage load warning:', e);
  }

  memoryCache = [];
  return memoryCache;
}

function saveStorage(packets) {
  memoryCache = packets;
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(packets.slice(-MAX_PACKETS)));
  } catch (e) {
    console.warn('Telemetry storage write error:', e);
  }
}

/**
 * Computes a deterministic checksum hash for an ingested packet
 */
export function computePacketChecksum(pkt) {
  const str = `${pkt.nodeId || ''}_${pkt.timestamp || Date.now()}_${pkt.congestionPercentage ?? pkt.currentLoadMw ?? pkt.waterLevelMeters ?? 0}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return '0x' + Math.abs(hash).toString(16).padStart(8, '0').toUpperCase();
}

/**
 * Records an ingested packet into the persistent circular buffer
 */
export function recordTelemetryPacket(rawPacket) {
  if (!rawPacket || !rawPacket.nodeId) return null;

  const now = Date.now();
  const checksum = computePacketChecksum(rawPacket);

  const packet = {
    ...rawPacket,
    receivedAt: rawPacket.receivedAt || new Date(now).toISOString(),
    epochMs: rawPacket.epochMs || now,
    checksum,
    source: rawPacket.source || (rawPacket.nodeId.startsWith('ECO') ? 'ESP32_SENSOR_NODE' : rawPacket.nodeId.startsWith('TR') ? 'RPI_VISION_SENTINEL' : 'SCADA_SUBSTATION_RTU')
  };

  const history = loadStorage();
  history.push(packet);
  if (history.length > MAX_PACKETS) {
    history.shift();
  }

  saveStorage(history);

  // Dispatch custom browser event for reactive UI updates
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('pulsecity:telemetry_packet', { detail: packet }));
  }

  return packet;
}

/**
 * Returns recorded packets, optionally filtered by nodeId
 */
export function getTelemetryHistory(filterNodeId = null) {
  const history = loadStorage();
  if (!filterNodeId) return [...history];
  return history.filter(p => p.nodeId === filterNodeId);
}

/**
 * Clears stored telemetry history
 */
export function clearTelemetryHistory() {
  saveStorage([]);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('pulsecity:telemetry_cleared'));
  }
}

/**
 * Returns statistical summaries of the recorded packets
 */
export function getTelemetryMetrics() {
  const history = loadStorage();
  const total = history.length;
  if (total === 0) {
    return {
      totalPackets: 0,
      activeNodes: 0,
      avgCongestion: 0,
      recentNodeIds: [],
      latestPacketTime: null
    };
  }

  const uniqueNodes = new Set(history.map(p => p.nodeId));
  const congestionValues = history.map(p => p.congestionPercentage).filter(v => typeof v === 'number');
  const avgCongestion = congestionValues.length > 0 
    ? Math.round(congestionValues.reduce((a, b) => a + b, 0) / congestionValues.length) 
    : 0;

  return {
    totalPackets: total,
    activeNodes: uniqueNodes.size,
    avgCongestion,
    recentNodeIds: Array.from(uniqueNodes),
    latestPacketTime: history[history.length - 1]?.receivedAt
  };
}

/**
 * Exports telemetry dataset as CSV
 */
export function exportTelemetryAsCsv() {
  const history = loadStorage();
  if (history.length === 0) return '';

  const headers = [
    'epochMs',
    'receivedAt',
    'nodeId',
    'type',
    'congestionPercentage',
    'flowRateVehiclesPerHour',
    'currentLoadMw',
    'dumsorRiskScore',
    'waterLevelMeters',
    'aqiScore',
    'wasteFillPercentage',
    'checksum'
  ];

  const rows = history.map(p => [
    p.epochMs || '',
    `"${p.receivedAt || ''}"`,
    p.nodeId || '',
    p.type || '',
    p.congestionPercentage ?? '',
    p.flowRateVehiclesPerHour ?? '',
    p.currentLoadMw ?? '',
    p.dumsorRiskScore ?? '',
    p.waterLevelMeters ?? '',
    p.aqiScore ?? '',
    p.wasteFillPercentage ?? '',
    p.checksum || ''
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

/**
 * Triggers browser download of CSV file
 */
export function downloadTelemetryCsv(filename = 'pulsecity_telemetry_audit.csv') {
  if (typeof window === 'undefined') return;
  const csv = exportTelemetryAsCsv();
  if (!csv) {
    alert('No telemetry packets in buffer to export.');
    return;
  }

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
