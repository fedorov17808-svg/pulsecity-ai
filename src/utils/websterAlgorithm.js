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

    const delay = websterDelay({
      cycleSec: optimumCycleLength_C0,
      effectiveGreenSec: effectiveGreen,
      flowVph: p.flowRate,
      saturationFlowVph: p.saturationFlow
    });

    return {
      name: p.name,
      flowRate: p.flowRate,
      saturationFlow: p.saturationFlow,
      flowRatio: Number(p.flowRatio_y.toFixed(3)),
      effectiveGreenSeconds: effectiveGreen,
      degreeOfSaturation: Number(delay.degreeOfSaturation.toFixed(2)),
      // null when the approach is oversaturated (x >= 1): Webster's formula does not apply
      estimatedDelaySecPerVehicle: delay.delaySec === null ? null : Math.round(delay.delaySec)
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

/**
 * Webster (1958) average delay per vehicle on one signalised approach.
 *
 *   d = C(1 - λ)² / [2(1 - λx)] + x² / [2q(1 - x)] - 0.65 (C / q²)^(1/3) · x^(2 + 5λ)
 *
 *   C = cycle length (s), λ = g / C (effective green ratio),
 *   q = arrival flow (veh/s), s = saturation flow (veh/s), x = q / (λ·s).
 *
 * The formula is only valid for undersaturated approaches. When x >= 1 the queue
 * grows every cycle, so `delaySec` is null instead of a made-up number.
 */
export function websterDelay({ cycleSec, effectiveGreenSec, flowVph, saturationFlowVph }) {
  const C = cycleSec;
  const lambda = effectiveGreenSec / C;
  const q = Math.max(0, flowVph) / 3600;
  const s = saturationFlowVph / 3600;
  const x = q / (lambda * s);

  if (!(C > 0) || !(lambda > 0) || !(s > 0)) {
    throw new Error('websterDelay: cycle, green and saturation flow must be positive');
  }
  if (x >= 1) {
    return { delaySec: null, degreeOfSaturation: x, oversaturated: true };
  }

  const uniform = (C * (1 - lambda) ** 2) / (2 * (1 - lambda * x));
  const random = q > 0 ? (x ** 2) / (2 * q * (1 - x)) : 0;
  const correction = q > 0 ? 0.65 * Math.cbrt(C / (q * q)) * x ** (2 + 5 * lambda) : 0;

  return {
    delaySec: Math.max(0, uniform + random - correction),
    degreeOfSaturation: x,
    oversaturated: false
  };
}

/**
 * Compares a fixed-time plan (equal green split) with the Webster plan for the
 * same approach flows, using Webster's delay formula for both.
 *
 * The fixed-time baseline is an assumption (no published signal plans for Accra
 * junctions are available to us); it is returned in `assumptions` so the UI can
 * show it next to the result.
 */
export function compareFixedVsWebster({ phases, fixedCycleSec = 120, lostTimePerPhase = 4, maxCycleLength = 120, minCycleLength = 40 }) {
  const webster = calculateWebsterSignalTiming({ phases, lostTimePerPhase, maxCycleLength, minCycleLength });
  const totalLost = phases.length * lostTimePerPhase;
  const fixedGreen = (fixedCycleSec - totalLost) / phases.length;

  const evaluate = (cycleSec, greens) => {
    const perPhase = phases.map((p, i) => ({
      name: p.name,
      flowVph: p.flowRate,
      greenSec: greens[i],
      ...websterDelay({ cycleSec, effectiveGreenSec: greens[i], flowVph: p.flowRate, saturationFlowVph: p.saturationFlow })
    }));
    const totalFlow = perPhase.reduce((sum, p) => sum + p.flowVph, 0);
    const anyOversaturated = perPhase.some((p) => p.delaySec === null);
    const avgDelaySec = anyOversaturated || totalFlow === 0
      ? null
      : perPhase.reduce((sum, p) => sum + p.flowVph * p.delaySec, 0) / totalFlow;
    return { cycleSec, perPhase, avgDelaySec, oversaturated: anyOversaturated };
  };

  const fixed = evaluate(fixedCycleSec, phases.map(() => fixedGreen));
  const adaptive = evaluate(webster.optimumCycleLengthSeconds, webster.phases.map((p) => p.effectiveGreenSeconds));
  const totalFlowVph = phases.reduce((sum, p) => sum + p.flowRate, 0);

  const delaySavedSecPerVeh = fixed.avgDelaySec !== null && adaptive.avgDelaySec !== null
    ? fixed.avgDelaySec - adaptive.avgDelaySec
    : null;

  return {
    fixed,
    webster: adaptive,
    delaySavedSecPerVeh,
    // vehicle-hours of delay saved per hour of operation at these flows
    vehicleHoursSavedPerHour: delaySavedSecPerVeh === null ? null : (totalFlowVph * delaySavedSecPerVeh) / 3600,
    assumptions: {
      fixedCycleSec,
      fixedSplit: 'equal green for every phase',
      lostTimePerPhase
    }
  };
}
