import { describe, it, expect } from 'vitest';
import { calculateWebsterSignalTiming, websterDelay, compareFixedVsWebster } from '../src/utils/websterAlgorithm';
import { calculatePcuAndFlow } from '../src/services/localVisionService';

// Worked example (computed by hand):
//   phase A: q = 900 veh/h, s = 1800 veh/h -> y = 0.500
//   phase B: q = 300 veh/h, s = 1800 veh/h -> y = 0.1667
//   Y = 0.6667, L = 2 phases x 4 s = 8 s
//   C0 = (1.5 * 8 + 5) / (1 - 0.6667) = 17 / 0.3333 = 51 s
//   effective green G = C0 - L = 43 s
//   g_A = 0.5 / 0.6667 * 43 = 32.25 -> 32 s
//   g_B = 0.1667 / 0.6667 * 43 = 10.75 -> raised to the 12 s minimum green
const PHASES = [
  { name: 'A', flowRate: 900, saturationFlow: 1800 },
  { name: 'B', flowRate: 300, saturationFlow: 1800 }
];

describe('Webster optimum cycle', () => {
  const result = calculateWebsterSignalTiming({ phases: PHASES, lostTimePerPhase: 4 });

  it('computes C0 = (1.5L + 5) / (1 - Y)', () => {
    expect(result.totalLostTimeSeconds).toBe(8);
    expect(result.totalFlowRatio_Y).toBeCloseTo(0.667, 3);
    expect(result.optimumCycleLengthSeconds).toBe(51);
  });

  it('splits green in proportion to y_i, with a 12 s minimum', () => {
    expect(result.phases[0].effectiveGreenSeconds).toBe(32);
    expect(result.phases[1].effectiveGreenSeconds).toBe(12);
  });

  it('caps the cycle when the junction is oversaturated (Y >= 0.92)', () => {
    const over = calculateWebsterSignalTiming({
      phases: [
        { name: 'A', flowRate: 1700, saturationFlow: 1800 },
        { name: 'B', flowRate: 600, saturationFlow: 1800 }
      ],
      maxCycleLength: 120
    });
    expect(over.isOverSaturated).toBe(true);
    expect(over.optimumCycleLengthSeconds).toBe(120);
  });
});

describe('Webster average delay', () => {
  // Hand calculation: C = 60 s, g = 27 s, q = 600 veh/h, s = 1800 veh/h
  //   lambda = 0.45, q = 1/6 veh/s, x = 600 / (0.45 * 1800) = 0.7407
  //   uniform    = 60 * 0.55^2 / (2 * (1 - 0.45 * 0.7407))    = 13.613
  //   random     = 0.7407^2 / (2 * (1/6) * (1 - 0.7407))       =  6.349
  //   correction = 0.65 * (60 / (1/6)^2)^(1/3) * 0.7407^4.25   =  2.347
  //   d = 13.613 + 6.349 - 2.347 = 17.615 s/veh
  it('matches the hand-calculated example', () => {
    const d = websterDelay({ cycleSec: 60, effectiveGreenSec: 27, flowVph: 600, saturationFlowVph: 1800 });
    expect(d.degreeOfSaturation).toBeCloseTo(0.7407, 4);
    expect(d.delaySec).toBeCloseTo(17.615, 2);
  });

  it('returns null (not a number) for an oversaturated approach', () => {
    const d = websterDelay({ cycleSec: 60, effectiveGreenSec: 20, flowVph: 900, saturationFlowVph: 1800 });
    expect(d.oversaturated).toBe(true);
    expect(d.delaySec).toBeNull();
  });

  it('reports the fixed plan as oversaturated instead of inventing a saving', () => {
    // fixed 120 s, equal split: g = 56 s, capacity A = 56/120 * 1800 = 840 < 900 veh/h -> x = 1.07
    const cmp = compareFixedVsWebster({ phases: PHASES });
    expect(cmp.assumptions.fixedCycleSec).toBe(120);
    expect(cmp.fixed.perPhase.map((p) => p.greenSec)).toEqual([56, 56]);
    expect(cmp.fixed.oversaturated).toBe(true);
    expect(cmp.webster.cycleSec).toBe(51);
    expect(cmp.webster.oversaturated).toBe(false);
    expect(cmp.delaySavedSecPerVeh).toBeNull();
  });

  it('computes the flow-weighted delay saving when both plans are undersaturated', () => {
    const cmp = compareFixedVsWebster({
      phases: [
        { name: 'A', flowRate: 600, saturationFlow: 1800 },
        { name: 'B', flowRate: 300, saturationFlow: 1800 }
      ]
    });
    expect(cmp.fixed.oversaturated).toBe(false);
    expect(cmp.webster.oversaturated).toBe(false);
    expect(cmp.delaySavedSecPerVeh).toBeCloseTo(cmp.fixed.avgDelaySec - cmp.webster.avgDelaySec, 10);
    // the long fixed cycle makes every vehicle wait longer than the Webster cycle
    expect(cmp.delaySavedSecPerVeh).toBeGreaterThan(0);
  });
});

describe('PCU count', () => {
  it('sums vehicle counts weighted by PCU factor', () => {
    // 2 trotro x 2.2 + 1 truck x 3.0 + 3 taxi x 1.0 + 4 motorbike x 0.5 = 12.4
    const res = calculatePcuAndFlow({ trotro: 2, truck: 1, taxi: 3, motorbike: 4 });
    expect(res.totalVehicles).toBe(10);
    expect(res.effectivePcu).toBeCloseTo(12.4, 10);
  });

  it('is zero for an empty frame', () => {
    expect(calculatePcuAndFlow({}).effectivePcu).toBe(0);
  });
});
