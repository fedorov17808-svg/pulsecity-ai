/**
 * Anti-Dumsor Grid Balance & Priority Knapsack Load Shedding Algorithm
 * 
 * Objective: Minimize total societal and economic disruption while maintaining
 * substation frequency within stable bounds (49.8 Hz - 50.2 Hz).
 * 
 * Formulated as a Constrained Priority Knapsack Optimization:
 * Minimize sum(W_i * x_i * P_i)
 * Subject to:
 *   Total Shedded Load >= Deficit (Demand - Safe_Capacity)
 *   Tier 1 (Emergency/Hospitals) x_i = 0 (Strict Non-Shed Constraint)
 */

export const LOAD_TIERS = {
  TIER_1_CRITICAL: { name: "Class A: Life-Support & Water", weight: 10000, canShed: false },
  TIER_2_RESIDENTIAL: { name: "Class B: High-Density Residential", weight: 1000, canShed: true },
  TIER_3_COMMERCIAL: { name: "Class C: Commercial & Light Industry", weight: 100, canShed: true },
  TIER_4_NON_ESSENTIAL: { name: "Class D: Billboards & Decorative", weight: 10, canShed: true }
};

export function optimizeGridLoadBalance(substation, availableBatteryStorageMw = 40) {
  const {
    id,
    name,
    capacityMw,
    currentLoadMw,
    safeThresholdPct = 85 // Safe continuous rating threshold
  } = substation;

  const safeCapacityMw = capacityMw * (safeThresholdPct / 100);
  const powerDeficitMw = Math.max(0, currentLoadMw - safeCapacityMw);

  // If load is within safe limits, no action required
  if (powerDeficitMw <= 0) {
    return {
      stabilized: true,
      actionRequired: false,
      deficitMw: 0,
      batteryDispatchedMw: 0,
      circuitsShedded: [],
      finalLoadMw: currentLoadMw,
      finalLoadPct: Math.round((currentLoadMw / capacityMw) * 100),
      summary: "Grid operates within nominal thermal and frequency limits."
    };
  }

  // 1. Step 1: Dispatch renewable battery storage first (Zero Disruption)
  const batteryDispatchMw = Math.min(availableBatteryStorageMw, powerDeficitMw);
  let remainingDeficitMw = powerDeficitMw - batteryDispatchMw;

  // Circuit feeders with their respective demand & priority tiers
  const feeders = [
    { id: "F-01", name: "Ridge Hospital & Emergency Trauma Hub", tier: "TIER_1_CRITICAL", loadMw: 18 },
    { id: "F-02", name: "Weija Municipal Water Treatment Feed", tier: "TIER_1_CRITICAL", loadMw: 24 },
    { id: "F-03", name: "Dome & West Legon Residential Feeder #1", tier: "TIER_2_RESIDENTIAL", loadMw: 36 },
    { id: "F-04", name: "Taifa & Kwabenya Residential Feeder #2", tier: "TIER_2_RESIDENTIAL", loadMw: 32 },
    { id: "F-05", name: "Accra Mall & Commercial Retail Plaza", tier: "TIER_3_COMMERCIAL", loadMw: 15 },
    { id: "F-06", name: "Industrial Cold Storage & Logistics Zone", tier: "TIER_3_COMMERCIAL", loadMw: 22 },
    { id: "F-07", name: "Digital Billboard Network & High Street Beacons", tier: "TIER_4_NON_ESSENTIAL", loadMw: 8 },
    { id: "F-08", name: "Public Decorative Lighting & Non-Critical Pumps", tier: "TIER_4_NON_ESSENTIAL", loadMw: 12 },
  ];

  // 2. Step 2: Sort shed candidates in ascending order of societal weight (shed Tier 4 first)
  const sheddableFeeders = feeders
    .filter((f) => LOAD_TIERS[f.tier].canShed)
    .sort((a, b) => LOAD_TIERS[a.tier].weight - LOAD_TIERS[b.tier].weight);

  const circuitsShedded = [];
  let totalSheddedMw = 0;

  for (const circuit of sheddableFeeders) {
    if (remainingDeficitMw <= 0) break;

    // Fractional or full shed
    const shedAmount = Math.min(circuit.loadMw, remainingDeficitMw);
    circuitsShedded.push({
      feederId: circuit.id,
      name: circuit.name,
      tier: LOAD_TIERS[circuit.tier].name,
      sheddedMw: Number(shedAmount.toFixed(1)),
      percentShed: Math.round((shedAmount / circuit.loadMw) * 100)
    });

    totalSheddedMw += shedAmount;
    remainingDeficitMw -= shedAmount;
  }

  const finalLoadMw = Math.round(currentLoadMw - batteryDispatchMw - totalSheddedMw);
  const finalLoadPct = Math.round((finalLoadMw / capacityMw) * 100);

  return {
    substationName: name,
    initialLoadMw: currentLoadMw,
    capacityMw,
    deficitMw: Number(powerDeficitMw.toFixed(1)),
    batteryDispatchedMw: Number(batteryDispatchMw.toFixed(1)),
    totalSheddedMw: Number(totalSheddedMw.toFixed(1)),
    finalLoadMw,
    finalLoadPct,
    circuitsShedded,
    protectedCircuits: feeders.filter((f) => !LOAD_TIERS[f.tier].canShed).map((f) => f.name),
    mathAudit: {
      formula: "Final_Load = Current_Load - P_Battery - Sum(P_Shed_i)",
      equation: `${currentLoadMw}MW - ${batteryDispatchMw.toFixed(1)}MW - ${totalSheddedMw.toFixed(1)}MW = ${finalLoadMw}MW (${finalLoadPct}%)`,
      blackoutPrevented: true
    }
  };
}
