import { describe, it, expect } from 'vitest';
import { 
  calculateWebsterSignalTiming, 
  validateCabinetSafetyInterlocks, 
  calculateLWRShockwaveAndOffset,
  CABINET_SAFETY_STANDARDS 
} from '../utils/websterAlgorithm';

describe('Webster Signal Timing Optimization Algorithm', () => {
  it('calculates optimal cycle length C_0 using formula (1.5L + 5) / (1 - Y)', () => {
    const result = calculateWebsterSignalTiming({
      phases: [
        { name: "Major Artery", flowRate: 1200, saturationFlow: 1800, minGreen: 20 },
        { name: "Cross Street", flowRate: 400, saturationFlow: 1800, minGreen: 12 }
      ],
      lostTimePerPhase: 4,
      minCycleLength: 40,
      maxCycleLength: 120
    });

    expect(result).toBeDefined();
    expect(result.optimumCycleLengthSeconds).toBeGreaterThanOrEqual(40);
    expect(result.optimumCycleLengthSeconds).toBeLessThanOrEqual(120);
    expect(result.phases).toHaveLength(2);
    expect(result.phases[0].effectiveGreenSeconds).toBeGreaterThan(result.phases[1].effectiveGreenSeconds);
  });

  it('allocates green time proportionally to critical flow ratios', () => {
    const result = calculateWebsterSignalTiming({
      phases: [
        { name: "Heavy Approach", flowRate: 1000, saturationFlow: 2000, minGreen: 15 },
        { name: "Light Approach", flowRate: 250, saturationFlow: 2000, minGreen: 10 }
      ],
      lostTimePerPhase: 4
    });

    const heavyGreen = result.phases[0].effectiveGreenSeconds;
    const lightGreen = result.phases[1].effectiveGreenSeconds;
    expect(heavyGreen).toBeGreaterThan(lightGreen);
    expect(result.totalFlowRatio_Y).toBeCloseTo(0.625, 2);
  });

  it('handles zero or degenerate flow without dividing by zero', () => {
    const result = calculateWebsterSignalTiming({
      phases: [
        { name: "Empty Road", flowRate: 0, saturationFlow: 1800, minGreen: 10 },
        { name: "Idle Street", flowRate: 0, saturationFlow: 1800, minGreen: 10 }
      ]
    });

    expect(result.optimumCycleLengthSeconds).toBeGreaterThanOrEqual(40);
    expect(result.phases[0].estimatedDelaySecPerVehicle).toBeDefined();
    expect(Number.isNaN(result.phases[0].estimatedDelaySecPerVehicle)).toBe(false);
  });

  it('caps cycle length to maxCycleLength under severe oversaturation', () => {
    const result = calculateWebsterSignalTiming({
      phases: [
        { name: "Gridlocked Junction 1", flowRate: 1900, saturationFlow: 1800 },
        { name: "Gridlocked Junction 2", flowRate: 1700, saturationFlow: 1800 }
      ],
      maxCycleLength: 120
    });

    expect(result.isOverSaturated).toBe(true);
    expect(result.optimumCycleLengthSeconds).toBe(120);
  });
});

describe('NEMA TS2 Conflict Monitor Unit (CMU) Hardware Interlocks', () => {
  it('enforces MUTCD 12s minimum green safety threshold', () => {
    const unsafePhases = [
      { name: "Northbound Ring Road", effectiveGreenSeconds: 8, greenSec: 8 },
      { name: "Eastbound Cantonments", effectiveGreenSeconds: 45, greenSec: 45 }
    ];

    const audit = validateCabinetSafetyInterlocks(unsafePhases);
    expect(audit.isSafe).toBe(false);
    expect(audit.cmuStatus).toBe("TRIPPED_TO_FAIL_SAFE_FLASH");
    expect(audit.activeState).toBe(CABINET_SAFETY_STANDARDS.FAIL_SAFE_STATE);
    expect(audit.issues[0]).toContain("below MUTCD minimum safety limit");
  });

  it('approves compliant NEMA TS2 phase splits with armed interlocks', () => {
    const safePhases = [
      { name: "Kwame Nkrumah Overpass", effectiveGreenSeconds: 52, greenSec: 52 },
      { name: "Circle Feeder", effectiveGreenSeconds: 24, greenSec: 24 }
    ];

    const audit = validateCabinetSafetyInterlocks(safePhases);
    expect(audit.isSafe).toBe(true);
    expect(audit.cmuStatus).toBe("ARMED_MONITORING_NOMINAL");
    expect(audit.activeState).toBe("COORDINATED_ACTIVE");
  });

  it('trips immediately if intersecting approaches attempt simultaneous active state', () => {
    const conflictingPhases = [
      { name: "Liberation Rd North", effectiveGreenSeconds: 40, active: true },
      { name: "Airport Crossflow East", effectiveGreenSeconds: 30, active: true }
    ];

    const audit = validateCabinetSafetyInterlocks(conflictingPhases, [[0, 1]]);
    expect(audit.isSafe).toBe(false);
    expect(audit.issues[0]).toContain("CRITICAL HARDWARE CONFLICT");
  });
});

describe('Lighthill-Whitham-Richards (LWR) Shockwave & Queue Spillback Gating', () => {
  it('calculates backward-forming shockwave speed and time-to-spillback', () => {
    const lwr = calculateLWRShockwaveAndOffset({
      linkLengthMeters: 800,
      upstreamFlowVph: 1800,
      downstreamCapacityVph: 1900,
      jamDensityVehPerKm: 135,
      freeFlowSpeedKmh: 50,
      cycleLengthSec: 90,
      currentDownstreamQueueVehicles: 30
    });

    expect(lwr.shockwaveSpeedKmh).toBeLessThan(0); // Backward propagation
    expect(lwr.timeToSpillbackSec).toBeGreaterThan(0);
    expect(lwr.spillbackRisk).toBe(false);
    expect(lwr.coordinatedOffsetSec).toBeGreaterThanOrEqual(0);
    expect(lwr.coordinatedOffsetSec).toBeLessThan(90);
  });

  it('activates queue spillback gating when downstream link storage exceeds 80%', () => {
    const lwr = calculateLWRShockwaveAndOffset({
      linkLengthMeters: 500, // max storage ~ 66 vehicles
      currentDownstreamQueueVehicles: 58 // > 85% full
    });

    expect(lwr.storageSaturationPct).toBeGreaterThanOrEqual(80);
    expect(lwr.spillbackRisk).toBe(true);
    expect(lwr.gatedGreenCapSec).toBeDefined();
    expect(lwr.gatedGreenCapSec).toBeGreaterThanOrEqual(12);
  });
});
