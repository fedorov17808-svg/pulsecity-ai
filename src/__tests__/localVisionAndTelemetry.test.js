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
import { queryIncidentCommander } from '../services/geminiService';

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
    expect(result.simulated).toBe(false);
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

describe('Incident Commander & SCADA Actuator Dispatcher', () => {
  it('dispatches emergency green wave with safety validation and receipt', async () => {
    const cityState = {
      trafficBottlenecks: 'Kwame Nkrumah Circle',
      gridReserve: '72%',
      avgAqi: '68'
    };

    const res = await queryIncidentCommander(null, 'Preempt green wave for ambulance at Circle', cityState);
    expect(res).toBeDefined();
    expect(res.toolCall).toBeDefined();
    expect(res.toolCall.name).toBe('DISPATCH_GREEN_WAVE');
    expect(res.toolCall.status).toBe('EXECUTED');
    expect(res.toolCall.safetyValidated).toBe(true);
    expect(res.toolCall.dispatchReceipt).toMatch(/^0x[0-9A-F]{8}$/);
    expect(res.toolCall.cmuInterlocks).toBe('ARMED_MONITORING_NOMINAL');
  });

  it('dispatches grid knapsack load shedding with solid-state relay timing', async () => {
    const cityState = {
      trafficBottlenecks: 'Tema Motorway',
      gridReserve: '62%',
      avgAqi: '74'
    };

    const res = await queryIncidentCommander(null, 'Emergency blackout warning at Achimota substation, shed non-essential load', cityState);
    expect(res).toBeDefined();
    expect(res.toolCall).toBeDefined();
    expect(res.toolCall.name).toBe('BALANCE_GRID_SHED');
    expect(res.toolCall.status).toBe('EXECUTED');
    expect(res.toolCall.latencyMs).toBeLessThanOrEqual(100);
    expect(res.toolCall.dispatchReceipt).toBeDefined();
  });
});
