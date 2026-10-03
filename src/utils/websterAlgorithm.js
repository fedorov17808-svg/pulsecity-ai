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

  const numPhases = phases.length;
  const totalLostTime_L = numPhases * lostTimePerPhase;

  // 1. Calculate flow ratios y_i = q_i / s_i
  const phaseRatios = phases.map((p) => ({
    ...p,
    flowRatio_y: p.flowRate / p.saturationFlow
  }));

  const totalFlowRatio_Y = phaseRatios.reduce((acc, p) => acc + p.flowRatio_y, 0);

  // If oversaturated (Y >= 1.0), network is severely choked: cap cycle to maximum
  let optimumCycleLength_C0;
  let isOverSaturated = false;

  if (totalFlowRatio_Y >= 0.95) {
    optimumCycleLength_C0 = maxCycleLength;
    isOverSaturated = true;
  } else {
    const rawC0 = (1.5 * totalLostTime_L + 5) / (1 - totalFlowRatio_Y);
    optimumCycleLength_C0 = Math.round(Math.min(maxCycleLength, Math.max(minCycleLength, rawC0)));
  }

  // 2. Available total effective green time in the cycle: G_total = C_0 - L
  const totalAvailableGreen = optimumCycleLength_C0 - totalLostTime_L;

  // 3. Allocate green time proportionally to flow ratios: g_i = (y_i / Y) * G_total
  const allocatedPhases = phaseRatios.map((p) => {
    const proportionalGreen = totalFlowRatio_Y > 0 
      ? Math.round((p.flowRatio_y / totalFlowRatio_Y) * totalAvailableGreen)
      : Math.round(totalAvailableGreen / numPhases);

    const effectiveGreen = Math.max(p.minGreen || 10, proportionalGreen);

    // Webster's Delay Formula per vehicle:
    // d = [C * (1 - lambda)^2] / [2 * (1 - lambda * x)] + [x^2] / [2 * q * (1 - x)]
    const lambda = effectiveGreen / optimumCycleLength_C0;
    const capacity = lambda * p.saturationFlow;
    const degreeOfSaturation_x = Math.min(0.99, p.flowRate / Math.max(1, capacity));
    
    // Simplified Webster delay estimation (seconds/vehicle)
    const term1 = (optimumCycleLength_C0 * Math.pow(1 - lambda, 2)) / (2 * (1 - lambda * degreeOfSaturation_x));
    const term2 = Math.pow(degreeOfSaturation_x, 2) / (2 * (p.flowRate / 3600) * (1 - degreeOfSaturation_x));
    const avgDelaySec = Math.round(term1 + Math.min(60, term2));

    return {
      name: p.name,
      flowRate: p.flowRate,
      flowRatio: Number(p.flowRatio_y.toFixed(3)),
      effectiveGreenSeconds: effectiveGreen,
      degreeOfSaturation: Number(degreeOfSaturation_x.toFixed(2)),
      estimatedDelaySecPerVehicle: avgDelaySec
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
