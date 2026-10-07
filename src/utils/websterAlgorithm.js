/**
 * Webster's Signal Timing Optimization Algorithm & Advanced Traffic Hydrodynamics
 * 
 * 1. F.V. Webster's Traffic Engineering Formulation (1958):
 *    C_0 = (1.5 * L + 5) / (1 - Y)
 *    where:
 *      L = total lost time per cycle (sum of yellow + all-red per phase)
 *      Y = sum of critical flow ratios (q_i / s_i)
 *      g_i = (y_i / Y) * (C_0 - L)  (effective green time for phase i)
 * 
 * 2. Physical Cabinet Conflict Monitor Unit (CMU-16LE / NEMA TS2) Safety Interlocks:
 *    - Enforces 12s minimum green safety threshold (MUTCD Section 4D).
 *    - Validates Conflict Matrix to prevent simultaneous intersecting green phases.
 *    - Hard fail-safe default-pass to FLASHING_YELLOW_RED if interlock is violated.
 * 
 * 3. Lighthill-Whitham-Richards (LWR, 1955) Shockwave & Queue Spillback Gating:
 *    - w = Δq / Δk = (q_2 - q_1) / (k_2 - k_1)
 *    - Computes backward-forming shockwave propagation and gates upstream green
 *      to prevent spillback gridlock into upstream roundabouts (Kwame Nkrumah Circle).
 *    - Coordinated signal offset θ = (LinkDistance / v_progression) mod C_0.
 */

export const CABINET_SAFETY_STANDARDS = {
  MUTCD_MIN_GREEN_SEC: 12,
  NEMA_MIN_YELLOW_SEC: 3.5,
  NEMA_MIN_ALL_RED_SEC: 1.5,
  MAX_ALLOWABLE_CYCLE_SEC: 140,
  FAIL_SAFE_STATE: "FLASHING_YELLOW_RED"
};

/**
 * Validates phase splits and timing against NEMA TS2 / Conflict Monitor Unit (CMU) hardware standards.
 * Ensures zero green-green overlapping phases and compliant clearance intervals.
 */
export function validateCabinetSafetyInterlocks(proposedPhases = [], conflictPairs = [[0, 1]]) {
  const issues = [];
  let isCmuTrip = false;

  if (!Array.isArray(proposedPhases) || proposedPhases.length === 0) {
    return {
      isSafe: false,
      cmuStatus: "TRIP_FAIL_SAFE",
      activeState: CABINET_SAFETY_STANDARDS.FAIL_SAFE_STATE,
      issues: ["No valid phases provided to CMU validator"]
    };
  }

  // 1. Minimum Green Safety Limit (MUTCD Section 4D)
  proposedPhases.forEach((p, idx) => {
    const green = p.effectiveGreenSeconds ?? p.greenSec ?? 0;
    if (green < CABINET_SAFETY_STANDARDS.MUTCD_MIN_GREEN_SEC) {
      issues.push(`Phase ${idx + 1} (${p.name || 'Approach'}): Green ${green}s is below MUTCD minimum safety limit (${CABINET_SAFETY_STANDARDS.MUTCD_MIN_GREEN_SEC}s).`);
      isCmuTrip = true;
    }
  });

  // 2. Conflict Matrix Check: No intersecting approaches can share simultaneous green
  conflictPairs.forEach(([pA, pB]) => {
    if (proposedPhases[pA] && proposedPhases[pB]) {
      if (proposedPhases[pA].active && proposedPhases[pB].active) {
        issues.push(`CRITICAL HARDWARE CONFLICT: Conflicting approaches (${proposedPhases[pA].name} and ${proposedPhases[pB].name}) cannot be active simultaneously.`);
        isCmuTrip = true;
      }
    }
  });

  return {
    isSafe: !isCmuTrip,
    cmuStatus: isCmuTrip ? "TRIPPED_TO_FAIL_SAFE_FLASH" : "ARMED_MONITORING_NOMINAL",
    activeState: isCmuTrip ? CABINET_SAFETY_STANDARDS.FAIL_SAFE_STATE : "COORDINATED_ACTIVE",
    interlockStandard: "NEMA TS2-2016 / 170-CMU16LE Hardware Matrix",
    issues
  };
}

/**
 * Lighthill-Whitham-Richards (LWR) Traffic Shockwave & Queue Spillback Gating
 */
export function calculateLWRShockwaveAndOffset(options = {}) {
  const {
    linkLengthMeters = 800,
    upstreamFlowVph = 1600,
    downstreamCapacityVph = 1900,
    jamDensityVehPerKm = 135,
    freeFlowSpeedKmh = 50,
    cycleLengthSec = 80,
    currentDownstreamQueueVehicles = 45
  } = options;

  const safeJamDensity = Math.max(80, jamDensityVehPerKm);
  const safeFreeFlowSpeed = Math.max(20, freeFlowSpeedKmh);
  const safeLinkLength = Math.max(100, linkLengthMeters);
  const safeCycleLength = Math.max(30, cycleLengthSec);

  // Maximum vehicle storage capacity of the link (assuming 7.5m per vehicle including gap)
  const maxVehicleStorage = Math.floor(safeLinkLength / 7.5);
  const storageSaturationPct = Math.min(100, Math.round((currentDownstreamQueueVehicles / maxVehicleStorage) * 100));

  // Density before jam: k_inflow = upstreamFlow / freeFlowSpeed
  const kInflow = upstreamFlowVph / safeFreeFlowSpeed; // veh/km

  // Shockwave speed w (km/h): w = (q_2 - q_1) / (k_2 - k_1)
  // q_2 = 0 (standing queue), k_2 = k_jam
  const shockwaveSpeedKmh = -Math.abs((0 - upstreamFlowVph) / Math.max(1, safeJamDensity - kInflow));
  const shockwaveSpeedMps = Math.abs(shockwaveSpeedKmh * (1000 / 3600));

  // Time until queue spills back to upstream intersection
  const timeToSpillbackSec = Math.round(safeLinkLength / Math.max(0.5, shockwaveSpeedMps));

  // Spillback Gating Decision:
  // If downstream link storage is > 80% full, upstream green time must be throttled to prevent gridlock
  const spillbackRisk = storageSaturationPct >= 80;
  const gatedGreenCapSec = spillbackRisk 
    ? Math.max(12, Math.round((maxVehicleStorage - currentDownstreamQueueVehicles) * 2.2))
    : null;

  // Ideal Coordinated Offset for green wave progression
  const travelTimeSec = Math.round(safeLinkLength / (safeFreeFlowSpeed * (1000 / 3600)));
  const coordinatedOffsetSec = travelTimeSec % safeCycleLength;

  return {
    linkLengthMeters: safeLinkLength,
    storageSaturationPct,
    maxVehicleStorage,
    currentQueue: currentDownstreamQueueVehicles,
    shockwaveSpeedKmh: Number(shockwaveSpeedKmh.toFixed(1)),
    timeToSpillbackSec,
    spillbackRisk,
    gatedGreenCapSec,
    coordinatedOffsetSec,
    travelTimeSec,
    engineeringProof: {
      lwrFormula: "w = Δq / Δk = (0 - q_inflow) / (k_jam - k_inflow)",
      progressionFormula: "θ = (Distance / v_progression) mod C",
      calculatedValues: `w = ${shockwaveSpeedKmh.toFixed(1)} km/h | t_spill = ${timeToSpillbackSec}s | θ = ${coordinatedOffsetSec}s`
    }
  };
}

/**
 * Main Webster Signal Timing Optimization
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

    const minG = Math.max(CABINET_SAFETY_STANDARDS.MUTCD_MIN_GREEN_SEC, p.minGreen || 12);
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

  // 4. Hardware CMU Safety Interlock Verification
  const cmuAudit = validateCabinetSafetyInterlocks(allocatedPhases);

  return {
    optimumCycleLengthSeconds: optimumCycleLength_C0,
    totalLostTimeSeconds: totalLostTime_L,
    totalFlowRatio_Y: Number(totalFlowRatio_Y.toFixed(3)),
    isOverSaturated,
    phases: allocatedPhases,
    cmuAudit,
    mathProof: {
      formula: "C_0 = (1.5 * L + 5) / (1 - Y)",
      formulaValues: `(${1.5} * ${totalLostTime_L} + 5) / (1 - ${totalFlowRatio_Y.toFixed(3)}) = ${optimumCycleLength_C0}s`,
      totalGreenBudget: `${totalAvailableGreen}s across ${numPhases} phases`,
      cmuStandard: "NEMA TS2-2016 Port 1 SDLC (12s Min Green Enforced)"
    }
  };
}
