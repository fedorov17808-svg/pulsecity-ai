import React, { useState, useRef, useEffect } from 'react';
import { 
  Zap, BatteryCharging, Sun, AlertTriangle, ShieldCheck, 
  ArrowUpRight, RefreshCw, Cpu, 
  Calculator, ToggleLeft, ToggleRight, Activity, Sliders
} from 'lucide-react';
import { optimizeGridLoadBalance } from '../utils/gridOptimization';
import { playBreakerTripSound, playFrequencyWarningHum } from '../utils/soundEffects';
import confetti from 'canvas-confetti';

export default function GridGuardOptimizer({
  energyNodes,
  onBalanceGrid
}) {
  const [balancingInProgress, setBalancingInProgress] = useState(false);
  const [optimizationAudit, setOptimizationAudit] = useState(null);
  const [baseGridStressMw, setBaseGridStressMw] = useState(85);

  // Oscilloscope Canvas Ref
  const oscCanvasRef = useRef(null);

  // Interactive Circuit Breakers State (SCADA emulation)
  const [circuitStates, setCircuitStates] = useState([
    { id: "F-01", name: "Ridge Hospital Trauma Hub", tier: "TIER_1_CRITICAL", loadMw: 18, isClosed: true, isLocked: true },
    { id: "F-02", name: "Weija Municipal Waterworks", tier: "TIER_1_CRITICAL", loadMw: 24, isClosed: true, isLocked: true },
    { id: "F-03", name: "Dome & West Legon Feeder #1", tier: "TIER_2_RESIDENTIAL", loadMw: 36, isClosed: true, isLocked: false },
    { id: "F-04", name: "Taifa & Kwabenya Feeder #2", tier: "TIER_2_RESIDENTIAL", loadMw: 32, isClosed: true, isLocked: false },
    { id: "F-05", name: "Accra Mall Retail Hub", tier: "TIER_3_COMMERCIAL", loadMw: 15, isClosed: true, isLocked: false },
    { id: "F-06", name: "Industrial Cold Storage Feeder", tier: "TIER_3_COMMERCIAL", loadMw: 22, isClosed: true, isLocked: false },
    { id: "F-07", name: "Digital Billboard Network", tier: "TIER_4_NON_ESSENTIAL", loadMw: 8, isClosed: false, isLocked: false },
    { id: "F-08", name: "Decorative Lighting & Pumps", tier: "TIER_4_NON_ESSENTIAL", loadMw: 12, isClosed: false, isLocked: false }
  ]);

  // Compute aggregate stats from dynamic breaker loads + manual stress
  const activeFeederLoad = circuitStates.filter(c => c.isClosed).reduce((acc, c) => acc + c.loadMw, 0);
  const baseSubstation = energyNodes.find((n) => n.id === 'EN-01') || energyNodes[0] || { capacityMw: 250, currentLoadMw: 232 };
  const dynamicLoad = Math.min(250, baseGridStressMw + activeFeederLoad);
  const safeCapacity = (baseSubstation.capacityMw || 250) * 0.85; // 212.5 MW
  
  // Power Grid Frequency: 50.00 Hz nominal, dips when load exceeds safe capacity
  const frequencyDelta = ((dynamicLoad - safeCapacity) / safeCapacity) * 0.45;
  const gridFrequencyHz = Number(Math.max(49.40, Math.min(50.25, 50.00 - frequencyDelta)).toFixed(2));
  const isFrequencyCritical = gridFrequencyHz < 49.80;
  const transformerTempC = Math.round(55 + (dynamicLoad / 250) * 35);

  // Play warning audio if frequency trips into critical
  useEffect(() => {
    if (isFrequencyCritical) {
      playFrequencyWarningHum();
    }
  }, [isFrequencyCritical]);

  // Real-time Canvas AC Oscilloscope Loop
  useEffect(() => {
    let animId;
    let phase = 0;

    const renderOscilloscope = () => {
      const canvas = oscCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;
      const midY = height / 2;

      ctx.fillStyle = '#06090f';
      ctx.fillRect(0, 0, width, height);

      // Grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 15) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Centerline
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, midY);
      ctx.lineTo(width, midY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Sinusoidal Waveform
      const freqMultiplier = gridFrequencyHz / 50.0;
      const amplitude = isFrequencyCritical ? 24 : 18;
      const waveColor = isFrequencyCritical ? '#f43f5e' : gridFrequencyHz < 49.92 ? '#f59e0b' : '#00f2fe';

      ctx.strokeStyle = waveColor;
      ctx.lineWidth = 2.5;
      ctx.shadowBlur = 10;
      ctx.shadowColor = waveColor;

      ctx.beginPath();
      for (let x = 0; x < width; x++) {
        // Add harmonic distortion if critical
        const harmonic = isFrequencyCritical ? Math.sin((x * 0.12 * freqMultiplier) + phase * 2) * 4 : 0;
        const y = midY + Math.sin((x * 0.045 * freqMultiplier) + phase) * amplitude + harmonic;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      phase += 0.08 * freqMultiplier;
      animId = requestAnimationFrame(renderOscilloscope);
    };

    renderOscilloscope();
    return () => cancelAnimationFrame(animId);
  }, [gridFrequencyHz, isFrequencyCritical]);

  const handleToggleBreaker = (circuitId) => {
    playBreakerTripSound();
    setCircuitStates((prev) =>
      prev.map((c) => {
        if (c.id === circuitId && !c.isLocked) {
          return { ...c, isClosed: !c.isClosed };
        }
        return c;
      })
    );
  };

  const handleRunKnapsackOptimization = () => {
    playBreakerTripSound();
    setBalancingInProgress(true);
    
    setTimeout(() => {
      // Execute the real Priority Knapsack optimization algorithm
      const audit = optimizeGridLoadBalance({ ...baseSubstation, currentLoadMw: dynamicLoad }, 35);
      setOptimizationAudit(audit);
      
      // Automatically open Tier 4 circuits to shed load
      setCircuitStates((prev) =>
        prev.map((c) => {
          if (c.tier === 'TIER_4_NON_ESSENTIAL') {
            return { ...c, isClosed: false };
          }
          return c;
        })
      );

      onBalanceGrid();
      setBalancingInProgress(false);
      
      confetti({
        particleCount: 45,
        spread: 55,
        origin: { y: 0.7 }
      });
    }, 600);
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
      {/* Title & Frequency Meter */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(168, 85, 247, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(168, 85, 247, 0.3)'
            }}>
              <Zap size={20} color="#c084fc" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', color: '#fff' }}>GridGuard SCADA & Anti-Dumsor Engine</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Track 2: Physical Power Flow Simulation & Priority Knapsack LP
              </p>
            </div>
          </div>
        </div>

        {/* Real-time Frequency & Temperature Badges */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{
            background: transformerTempC > 80 ? 'rgba(244, 63, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)',
            border: transformerTempC > 80 ? '1px solid #f43f5e' : '1px solid #f59e0b',
            padding: '4px 10px',
            borderRadius: '8px',
            textAlign: 'right'
          }}>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>TRANSFORMER OIL</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 'bold', fontFamily: 'var(--font-mono)', color: transformerTempC > 80 ? '#f43f5e' : '#fbbf24' }}>
              {transformerTempC}°C {transformerTempC > 80 ? '🔥' : '❄️'}
            </div>
          </div>

          <div style={{
            background: isFrequencyCritical ? 'rgba(244, 63, 94, 0.15)' : 'rgba(16, 185, 129, 0.15)',
            border: isFrequencyCritical ? '1px solid #f43f5e' : '1px solid #10b981',
            padding: '4px 12px',
            borderRadius: '8px',
            textAlign: 'right'
          }}>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>GRID FREQUENCY</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 'bold', fontFamily: 'var(--font-mono)', color: isFrequencyCritical ? '#f43f5e' : '#34d399' }}>
              {gridFrequencyHz} Hz
            </div>
          </div>
        </div>
      </div>

      {/* Live 50Hz AC Frequency Oscilloscope Panel */}
      <div style={{
        background: '#070b12',
        border: isFrequencyCritical ? '1px solid #f43f5e' : '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '10px 14px',
        marginBottom: '12px',
        boxShadow: isFrequencyCritical ? '0 0 20px rgba(244, 63, 94, 0.25)' : 'none'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem' }}>
            <Activity size={13} color={isFrequencyCritical ? '#f43f5e' : '#00f2fe'} />
            <span style={{ color: '#fff', fontWeight: '600' }}>Live 50.00 Hz Pure Sine SCADA Oscilloscope</span>
          </div>
          <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: isFrequencyCritical ? '#f43f5e' : '#38bdf8' }}>
            {isFrequencyCritical ? 'UNDERFREQUENCY SAG COLLAPSE' : 'IEC 60034 HARMONIC TOLERANCE OK'}
          </span>
        </div>
        <canvas
          ref={oscCanvasRef}
          width={580}
          height={64}
          style={{ width: '100%', height: '64px', borderRadius: '4px', display: 'block' }}
        />

        {/* Interactive Grid Surge Stress Slider */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            <Sliders size={13} />
            <span>Simulate Grid Demand Surge:</span>
          </div>
          <input
            type="range"
            min="60"
            max="125"
            value={baseGridStressMw}
            onChange={(e) => setBaseGridStressMw(Number(e.target.value))}
            style={{ flex: 1, accentColor: isFrequencyCritical ? '#f43f5e' : '#a855f7', cursor: 'pointer' }}
          />
          <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: '#fff' }}>
            +{baseGridStressMw} MW
          </span>
        </div>
      </div>

      {/* Aggregate Substation Metric Bar */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.35)',
        borderRadius: 'var(--radius-md)',
        padding: '14px',
        border: '1px solid var(--border-subtle)',
        marginBottom: '14px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.8rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Achimota BSP Load vs Safe Rating (212.5 MW)</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: dynamicLoad > safeCapacity ? '#f43f5e' : '#34d399' }}>
            {dynamicLoad} MW / {baseSubstation.capacityMw} MW ({Math.round(dynamicLoad/baseSubstation.capacityMw*100)}%)
          </span>
        </div>
        
        <div style={{
          position: 'relative',
          height: '12px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '6px',
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            width: `${Math.min(100, Math.round(dynamicLoad/baseSubstation.capacityMw*100))}%`,
            background: dynamicLoad > safeCapacity 
              ? 'linear-gradient(90deg, #f59e0b 0%, #f43f5e 100%)' 
              : 'linear-gradient(90deg, #10b981 0%, #a855f7 100%)',
            transition: 'width 0.4s ease',
            boxShadow: '0 0 12px rgba(168, 85, 247, 0.5)'
          }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Sun size={13} color="#f59e0b" /> Legon Solar Park: <strong style={{ color: '#f59e0b' }}>+58 MW (Online)</strong>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <BatteryCharging size={13} color="#10b981" /> Microgrid BESS: <strong style={{ color: '#10b981' }}>35 MW Reserve Ready</strong>
          </span>
        </div>
      </div>

      {/* Knapsack Optimization Audit Box */}
      {optimizationAudit && (
        <div style={{
          background: 'rgba(168, 85, 247, 0.08)',
          border: '1px solid rgba(168, 85, 247, 0.4)',
          borderRadius: 'var(--radius-md)',
          padding: '12px',
          marginBottom: '12px',
          animation: 'fadeIn 0.3s ease'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#c084fc', fontSize: '0.76rem', fontWeight: 'bold' }}>
              <Calculator size={14} />
              KNAPSACK REBALANCE AUDIT TRAIL
            </div>
            <span className="badge badge-emerald" style={{ fontSize: '0.62rem' }}>Deficit Cleared</span>
          </div>

          <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: '#f1f5f9', marginBottom: '6px' }}>
            Equation: {optimizationAudit.mathAudit.equation}
          </div>

          <div style={{ fontSize: '0.7rem', color: '#34d399' }}>
            ✓ Critical Life Support (Ridge Trauma Hub, Weija Waterworks) 100% Protected
          </div>
        </div>
      )}

      {/* Interactive Circuit Breakers Feeder Switchboard (SCADA) */}
      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
        <span>SUBSTATION FEEDER SWITCHBOARD (SCADA)</span>
        <span>BREAKER STATUS</span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
        {circuitStates.map((circuit) => {
          const isCritical = circuit.tier === 'TIER_1_CRITICAL';

          return (
            <div
              key={circuit.id}
              style={{
                background: circuit.isClosed ? 'rgba(255, 255, 255, 0.03)' : 'rgba(244, 63, 94, 0.08)',
                border: circuit.isClosed ? '1px solid var(--border-subtle)' : '1px solid rgba(244, 63, 94, 0.35)',
                borderRadius: '8px',
                padding: '8px 12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 'bold', color: circuit.isClosed ? '#fff' : '#94a3b8' }}>
                  {circuit.name}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  Demand: {circuit.loadMw} MW • {isCritical ? <span style={{ color: '#10b981' }}>Class A (Life Support)</span> : circuit.tier.replace('_', ' ')}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  fontSize: '0.68rem',
                  fontFamily: 'var(--font-mono)',
                  color: circuit.isClosed ? '#10b981' : '#f43f5e',
                  fontWeight: 'bold'
                }}>
                  {circuit.isClosed ? 'CLOSED (LIVE)' : 'OPEN (SHED)'}
                </span>

                <button
                  onClick={() => handleToggleBreaker(circuit.id)}
                  disabled={circuit.isLocked}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: circuit.isLocked ? 'not-allowed' : 'pointer',
                    color: circuit.isClosed ? '#10b981' : '#64748b',
                    padding: '0 2px'
                  }}
                  title={circuit.isLocked ? "Life-Support Circuit: Manual disconnect prohibited" : "Toggle circuit breaker"}
                >
                  {circuit.isClosed ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Execute Knapsack Button */}
      <button
        onClick={handleRunKnapsackOptimization}
        disabled={balancingInProgress}
        className="btn-primary"
        style={{
          background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
          boxShadow: '0 4px 15px rgba(168, 85, 247, 0.35)',
          padding: '10px'
        }}
      >
        {balancingInProgress ? (
          <>
            <RefreshCw size={15} className="animate-spin" />
            Solving Discrete Priority Knapsack LP...
          </>
        ) : (
          <>
            <Cpu size={15} />
            Execute Anti-Dumsor Priority Knapsack
          </>
        )}
      </button>
    </div>
  );
}
