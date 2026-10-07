import { describe, it, expect } from 'vitest';
import { calculateWebsterSignalTiming } from '../utils/websterAlgorithm';

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

    // L = 2 phases * 4s = 8s
    // Y = 1200/1800 + 400/1800 = 1600/1800 = 0.8889
    // C_0 = (1.5 * 8 + 5) / (1 - 0.8889) = 17 / 0.1111 = 153s -> capped at max 120s
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
