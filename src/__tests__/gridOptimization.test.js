import { describe, it, expect } from 'vitest';
import { optimizeGridLoadBalance, LOAD_TIERS } from '../utils/gridOptimization';

describe('Anti-Dumsor Grid Balance & Knapsack Optimization', () => {
  it('detects nominal grid states without shedding any circuits', () => {
    const result = optimizeGridLoadBalance({
      name: "Achimota Substation",
      capacityMw: 250,
      currentLoadMw: 180,
      safeThresholdPct: 85 // Safe cap = 212.5 MW
    }, 40);

    expect(result.actionRequired).toBe(false);
    expect(result.stabilized).toBe(true);
    expect(result.deficitMw).toBe(0);
    expect(result.circuitsShedded).toHaveLength(0);
  });

  it('dispatches battery storage first before any physical shedding', () => {
    const result = optimizeGridLoadBalance({
      name: "Achimota Overloaded Substation",
      capacityMw: 200,
      currentLoadMw: 190,
      safeThresholdPct: 85 // Safe cap = 170 MW, deficit = 20 MW
    }, 30); // Battery capacity 30 MW >= 20 MW deficit

    expect(result.deficitMw).toBe(20);
    expect(result.batteryDispatchedMw).toBe(20);
    expect(result.totalSheddedMw).toBe(0);
    expect(result.circuitsShedded).toHaveLength(0);
  });

  it('strictly protects Tier 1 Critical circuits (Hospitals and Waterworks) from shedding', () => {
    const result = optimizeGridLoadBalance({
      name: "Severe Deficit Substation",
      capacityMw: 200,
      currentLoadMw: 260, // Deficit = 260 - 170 = 90 MW
      safeThresholdPct: 85
    }, 10); // Only 10 MW battery, 80 MW must be shedded

    expect(result.totalSheddedMw).toBeGreaterThan(0);
    
    // Ensure Ridge Hospital (F-01) and Weija Water (F-02) are NEVER in shedded circuits
    const sheddedIds = result.circuitsShedded.map(c => c.feederId);
    expect(sheddedIds).not.toContain('F-01');
    expect(sheddedIds).not.toContain('F-02');
  });

  it('sheds Tier 4 (Billboards & Decorative) before Tier 2 (Residential)', () => {
    const result = optimizeGridLoadBalance({
      name: "Moderate Deficit Substation",
      capacityMw: 200,
      currentLoadMw: 195, // Deficit = 25 MW
      safeThresholdPct: 85
    }, 5); // 5 MW battery, 20 MW to shed

    const sheddedIds = result.circuitsShedded.map(c => c.feederId);
    // F-07 and F-08 are Tier 4 (lowest priority, shed first)
    expect(sheddedIds).toContain('F-07');
    expect(sheddedIds).toContain('F-08');
  });
});
