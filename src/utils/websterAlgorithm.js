/**
 * Webster's Signal Timing Optimization Algorithm
 * Based on F.V. Webster's traffic engineering formulation:
 * C_0 = (1.5 * L + 5) / (1 - Y)
 * where:
 *   L = total lost time per cycle (sum of yellow + all-red per phase)
 *   Y = sum of critical flow ratios (q_i / s_i)
 *   g_i = (y_i / Y) * (C_0 - L)  (effective green time for phase i)
 */

export function calculateWebsterSignalTiming(options = {}) {
  const {
    phases = [
      { name: "Major Artery Approach", flowRate: 1400, saturationFlow: 1800, minGreen: 20 },
      { name: "Cross Street / Turning Approach", flowRate: 650, saturationFlow: 1800, minGreen: 12 }
    ],
    lostTimePerPhase = 4, // seconds (3s yellow + 1s all-red)
    maxCycleLength = 120, // max safe cycle in urban network
    minCycleLength = 40
  } = options;

  const validPhases = Array.isArray(phases) && phases.length > 0 ? phases : [
    { name: "Phase 1", flowRate: 800, saturationFlow: 1800, minGreen: 15 },
    { name: "Phase 2", flowRate: 400, saturationFlow: 1800, minGreen: 15 }
  ];

  const numPhases = validPhases.length;
  const safeLostTimePerPhase = Math.max(1, lostTimePerPhase);
  const totalLostTime_L = numPhases * safeLostTimePerPhase;

  // 1. Calculate flow ratios y_i = q_i / s_i with zero-division protection
  const phaseRatios = validPhases.map((p) => {
    const safeFlow = Math.max(0, p.flowRate || 0);
    const safeSat = Math.max(100, p.saturationFlow || 1800);
    return {
      ...p,
      flowRate: safeFlow,
      saturationFlow: safeSat,
      flowRatio_y: safeFlow / safeSat
    };
  });

  const rawY = phaseRatios.reduce((acc, p) => acc + p.flowRatio_y, 0);
  const totalFlowRatio_Y = Math.min(0.98, Math.max(0.01, rawY));

  // If oversaturated (Y >= 0.92), network is severely choked: cap cycle to maximum
  let optimumCycleLength_C0;
  let isOverSaturated = false;

  if (rawY >= 0.92) {
    optimumCycleLength_C0 = maxCycleLength;
    isOverSaturated = true;
  } else {
    const rawC0 = (1.5 * totalLostTime_L + 5) / (1 - totalFlowRatio_Y);
    optimumCycleLength_C0 = Math.round(Math.min(maxCycleLength, Math.max(minCycleLength, rawC0)));
  }

  // 2. Available total effective green time in the cycle: G_total = C_0 - L
  const totalAvailableGreen = Math.max(10, optimumCycleLength_C0 - totalLostTime_L);

  // 3. Allocate green time proportionally to flow ratios: g_i = (y_i / Y) * G_total
  const allocatedPhases = phaseRatios.map((p) => {
    const proportionalGreen = totalFlowRatio_Y > 0 
      ? Math.round((p.flowRatio_y / totalFlowRatio_Y) * totalAvailableGreen)
      : Math.round(totalAvailableGreen / numPhases);

    const minG = p.minGreen || 10;
    const effectiveGreen = Math.min(totalAvailableGreen - 5, Math.max(minG, proportionalGreen));

    // Webster's Delay Formula per vehicle:
    // d = [C * (1 - lambda)^2] / [2 * (1 - lambda * x)] + [x^2] / [2 * q * (1 - x)]
    const lambda = Math.min(0.95, Math.max(0.05, effectiveGreen / optimumCycleLength_C0));
    const capacity = lambda * p.saturationFlow;
    const degreeOfSaturation_x = Math.min(0.95, Math.max(0.05, p.flowRate / Math.max(1, capacity)));
    
    // Robust delay estimation (guarded against division by zero if flowRate is 0)
    const term1 = (optimumCycleLength_C0 * Math.pow(1 - lambda, 2)) / Math.max(0.01, 2 * (1 - lambda * degreeOfSaturation_x));
    const safeQPerSec = Math.max(0.01, p.flowRate / 3600);
    const term2 = Math.pow(degreeOfSaturation_x, 2) / (2 * safeQPerSec * Math.max(0.05, 1 - degreeOfSaturation_x));
    const avgDelaySec = Math.round(term1 + Math.min(60, term2));

    return {
      name: p.name,
      flowRate: p.flowRate,
      flowRatio: Number(p.flowRatio_y.toFixed(3)),
      effectiveGreenSeconds: effectiveGreen,
      degreeOfSaturation: Number(degreeOfSaturation_x.toFixed(2)),
      estimatedDelaySecPerVehicle: isNaN(avgDelaySec) ? 15 : avgDelaySec
    };
  });

  return {
    optimumCycleLengthSeconds: optimumCycleLength_C0,
    totalLostTimeSeconds: totalLostTime_L,
    totalFlowRatio_Y: Number(totalFlowRatio_Y.toFixed(3)),
    isOverSaturated,
    phases: allocatedPhases,
    mathProof: {
      formula: "C_0 = (1.5 * L + 5) / (1 - Y)",
      formulaValues: `(${1.5} * ${totalLostTime_L} + 5) / (1 - ${totalFlowRatio_Y.toFixed(3)}) = ${optimumCycleLength_C0}s`,
      totalGreenBudget: `${totalAvailableGreen}s across ${numPhases} phases`
    }
  };
}
