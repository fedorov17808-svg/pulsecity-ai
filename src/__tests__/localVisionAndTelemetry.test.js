import { describe, it, expect, beforeEach } from 'vitest';
import { calculatePcuAndFlow, detectObjectsOfflineEdge } from '../services/localVisionService';
import { 
  recordTelemetryPacket, 
  getTelemetryHistory, 
  clearTelemetryHistory, 
  exportTelemetryAsCsv,
  computePacketChecksum,
  getTelemetryMetrics 
} from '../services/telemetryStore';
import { queryIncidentCommander, parseActionLine, RULE_BASED_LABEL } from '../services/geminiService';

describe('Local Edge Vision & PCU Engine', () => {
  it('correctly calculates African transit PCU factors for Trotro, Trucks, Cabs and Motorbikes', () => {
    const counts = {
      trotro: 10,  // 10 * 2.2 = 22.0
      truck: 2,    // 2 * 3.0 = 6.0
      taxi: 8,     // 8 * 1.0 = 8.0
      motorbike: 6 // 6 * 0.5 = 3.0
    };

    const res = calculatePcuAndFlow(counts);
    expect(res.effectivePcu).toBeCloseTo(39.0, 1);
    expect(res.totalVehicles).toBe(26);
    expect(res.congestionScore).toBeGreaterThanOrEqual(15);
    expect(res.congestionScore).toBeLessThanOrEqual(98);
  });

  it('generates valid Webster green phase split and cycle length from PCU flow', () => {
    const counts = { trotro: 15, truck: 4, taxi: 12, motorbike: 10 };
    const res = calculatePcuAndFlow(counts);

    expect(res.webster).toBeDefined();
    expect(res.webster.optimumCycleLengthSeconds).toBeGreaterThanOrEqual(40);
    expect(res.webster.optimumCycleLengthSeconds).toBeLessThanOrEqual(120);
    expect(res.webster.phases).toHaveLength(2);
    expect(res.webster.phases[0].effectiveGreenSeconds).toBeGreaterThan(12); // MUTCD min green
  });

  it('runs deterministic offline edge vision analysis without throwing errors', () => {
    const mockMedia = {
      width: 640,
      height: 400
    };

    const result = detectObjectsOfflineEdge(mockMedia);
    // fallback boxes are placeholders, so the result must be labelled simulated
    expect(result.simulated).toBe(true);
    expect(result.backend).toBe('EDGE_CANVAS_PIXEL_CONTOUR');
    expect(result.detectedObjects.length).toBeGreaterThan(0);
    expect(result.websterOptimization).toBeDefined();
    expect(result.greenLightDurationSeconds).toBeGreaterThanOrEqual(12);
  });
});

describe('Telemetry Store & Persistent Audit Trail', () => {
  beforeEach(() => {
    clearTelemetryHistory();
  });

  it('computes deterministic checksum hashes for telemetry packets', () => {
    const pkt1 = { nodeId: 'TR-01', timestamp: 1728400000000, congestionPercentage: 78 };
    const hash1 = computePacketChecksum(pkt1);
    expect(hash1).toMatch(/^0x[0-9A-F]{8}$/);

    const pkt2 = { nodeId: 'TR-01', timestamp: 1728400000000, congestionPercentage: 78 };
    const hash2 = computePacketChecksum(pkt2);
    expect(hash1).toBe(hash2);
  });

  it('records, queries, and filters packets in persistent circular buffer', () => {
    recordTelemetryPacket({ nodeId: 'TR-01', congestionPercentage: 82 });
    recordTelemetryPacket({ nodeId: 'EN-01', currentLoadMw: 234 });
    recordTelemetryPacket({ nodeId: 'ECO-01', waterLevelMeters: 2.8 });

    const all = getTelemetryHistory();
    expect(all).toHaveLength(3);

    const trOnly = getTelemetryHistory('TR-01');
    expect(trOnly).toHaveLength(1);
    expect(trOnly[0].checksum).toBeDefined();

    const metrics = getTelemetryMetrics();
    expect(metrics.totalPackets).toBe(3);
    expect(metrics.activeNodes).toBe(3);
  });

  it('exports recorded telemetry buffer as standard compliant CSV', () => {
    recordTelemetryPacket({
      nodeId: 'TR-01',
      type: 'TRAFFIC',
      congestionPercentage: 75,
      flowRateVehiclesPerHour: 3200
    });

    const csv = exportTelemetryAsCsv();
    expect(csv).toContain('nodeId,type,congestionPercentage');
    expect(csv).toContain('TR-01');
    expect(csv).toContain('3200');
  });
});

describe('Traffic assistant without AI (rule-based mode)', () => {
  it('labels every reply as rule-based and dispatches a green wave for emergencies', async () => {
    const res = await queryIncidentCommander(null, 'Preempt green wave for ambulance at Circle', {});
    expect(res.mode).toBe('rule-based');
    expect(res.text.startsWith(RULE_BASED_LABEL)).toBe(true);
    expect(res.toolCall.name).toBe('DISPATCH_GREEN_WAVE');
  });

  it('maps signal requests to the named intersection and returns no action otherwise', async () => {
    const signal = await queryIncidentCommander(null, 'recompute signal cycle at TR-02', {});
    expect(signal.toolCall).toEqual({ name: 'OVERRIDE_TRAFFIC_LIGHT', params: { nodeId: 'TR-02' } });

    const unknown = await queryIncidentCommander(null, 'hello', {});
    expect(unknown.mode).toBe('rule-based');
    expect(unknown.toolCall).toBeNull();
  });

  it('parses the ACTION line chosen by the model in AI mode', () => {
    expect(parseActionLine('Clear the corridor.\nACTION: DISPATCH_GREEN_WAVE').name).toBe('DISPATCH_GREEN_WAVE');
    expect(parseActionLine('ACTION: OVERRIDE_TRAFFIC_LIGHT TR-04').params.nodeId).toBe('TR-04');
    expect(parseActionLine('ACTION: NONE')).toBeNull();
  });
});
