import React from 'react';

const FORMULA_TOOLTIP = [
  'How we calculate',
  "Webster's average delay per vehicle on each approach:",
  'd = C(1-λ)² / [2(1-λx)] + x² / [2q(1-x)] - 0.65 (C/q²)^(1/3) · x^(2+5λ)',
  'λ = g/C, x = q/(λs), q = flow, s = saturation flow.',
  'Baseline: fixed 120 s cycle with equal green split (assumed, not a published Accra plan).',
  'Adaptive: Webster optimum cycle C0 = (1.5L + 5)/(1 - Y) with proportional green.',
  'Both use the same approach flows; the result is a flow-weighted average.'
].join('\n');

const fmt = (sec) => (sec === null ? 'oversaturated' : `${sec.toFixed(1)} s/veh`);

/**
 * Shows the computed delay comparison returned by compareFixedVsWebster().
 */
export default function DelayComparison({ comparison }) {
  if (!comparison) return null;
  const { fixed, webster, delaySavedSecPerVeh } = comparison;

  return (
    <div title={FORMULA_TOOLTIP} style={{ background: 'rgba(0,0,0,0.3)', padding: '6px 8px', borderRadius: '6px', cursor: 'help' }}>
      <div>
        Avg delay: fixed {fixed.cycleSec}s → <strong>{fmt(fixed.avgDelaySec)}</strong>
        {' · '}Webster {webster.cycleSec}s → <strong>{fmt(webster.avgDelaySec)}</strong>
      </div>
      <div style={{ marginTop: '2px' }}>
        {delaySavedSecPerVeh !== null
          ? <>Delay saved: <strong style={{ color: '#38bdf8' }}>{delaySavedSecPerVeh.toFixed(1)} s/veh</strong></>
          : fixed.oversaturated && !webster.oversaturated
            ? <>Fixed plan is oversaturated (queue grows each cycle); Webster plan is not.</>
            : <>Not computable: demand exceeds capacity in both plans.</>}
        <span style={{ color: 'var(--text-muted)' }}> (hover: how we calculate)</span>
      </div>
    </div>
  );
}
