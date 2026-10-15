import { describe, it, expect } from 'vitest';
import { 
  optimizeGridLoadBalance, 
  calculateACReactivePowerFlow, 
  LOAD_TIERS 
} from '../utils/gridOptimization';

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

describe('AC Complex Power Flow, Reactive Power & Voltage Stability', () => {
  it('calculates apparent power S = sqrt(P^2 + Q^2) and detects low power factor', () => {
    const ac = calculateACReactivePowerFlow({
      activePowerP_Mw: 160,
      reactivePowerQ_Mvar: 120, // 3-4-5 triangle -> S = 200 MVA, cos(phi) = 0.80
      nominalBusVoltageKv: 33.0,
      availableCapacitorBanksMvar: 50
    });

    expect(ac.initial.apparentPowerMva).toBe(200);
    expect(ac.initial.powerFactorCosPhi).toBeCloseTo(0.80, 2);
    expect(ac.initial.busVoltageKv).toBeLessThan(33.0);
  });

  it('dispatches static capacitor banks to boost power factor and restore bus voltage', () => {
    const ac = calculateACReactivePowerFlow({
      activePowerP_Mw: 180,
      reactivePowerQ_Mvar: 100,
      nominalBusVoltageKv: 33.0,
      availableCapacitorBanksMvar: 75
    });

    expect(ac.compensation.capacitorsDispatchedMvar).toBeGreaterThan(0);
    expect(ac.compensation.finalPowerFactorCosPhi).toBeGreaterThan(ac.initial.powerFactorCosPhi);
    expect(ac.compensation.busVoltageKv).toBeGreaterThan(ac.initial.busVoltageKv);
    expect(ac.compensation.voltageRestored).toBe(true);
  });
});
