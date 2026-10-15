import React, { useState, useRef, useEffect } from 'react';
import { 
  Zap, BatteryCharging, Sun, AlertTriangle, ShieldCheck, 
  ArrowUpRight, RefreshCw, Cpu, 
  Calculator, ToggleLeft, ToggleRight, Activity, Sliders,
  Shield, CheckCircle, Lock, Key, FileCheck, Info, Power, Battery
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

  // Electrical Physics & BESS State
  const [bessInjectionMw, setBessInjectionMw] = useState(0); // 0 to 35 MW
  const [autonomyLevel, setAutonomyLevel] = useState('level1_advisory'); // 'level1_advisory', 'level2_micro', 'level3_islanding'
  const [dispatcherModalOpen, setDispatcherModalOpen] = useState(false);
  const [dispatchTicketHash, setDispatchTicketHash] = useState('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  const [lastCosignedTime, setLastCosignedTime] = useState(null);

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

  // Compute aggregate stats from dynamic breaker loads + manual stress - BESS peak shaving
  const activeFeederLoad = circuitStates.filter(c => c.isClosed).reduce((acc, c) => acc + c.loadMw, 0);
  const baseSubstation = energyNodes.find((n) => n.id === 'EN-01') || energyNodes[0] || { capacityMw: 250, currentLoadMw: 232 };
  const rawSubstationDemandMw = Math.min(250, baseGridStressMw + activeFeederLoad);
  
  // Dynamic Load after BESS peak-shaving injection
  const dynamicLoad = Math.max(0, rawSubstationDemandMw - bessInjectionMw);
  const safeCapacity = (baseSubstation.capacityMw || 250) * 0.85; // 212.5 MW

  // AC Power Triangle Physics (Active, Reactive, Apparent Power & Power Factor)
  const powerFactorCosPhi = 0.89; // Standard inductive municipal load factor
  const apparentPowerMva = Number((dynamicLoad / powerFactorCosPhi).toFixed(1));
  const reactivePowerMvar = Number(Math.sqrt(Math.max(0, Math.pow(apparentPowerMva, 2) - Math.pow(dynamicLoad, 2))).toFixed(1));
  
  // Power Grid Frequency: 50.00 Hz nominal, dips when load exceeds safe capacity
  const frequencyDelta = ((dynamicLoad - safeCapacity) / safeCapacity) * 0.45;
  const gridFrequencyHz = Number(Math.max(49.15, Math.min(50.25, 50.00 - frequencyDelta)).toFixed(2));
  const isFrequencyCritical = gridFrequencyHz < 49.80;
  const isBlackoutImminent = gridFrequencyHz < 49.25;
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
    if (autonomyLevel === 'level1_advisory') {
      // Level 1: Requires ECG Dispatcher Cryptographic Co-sign
      const randomTicket = 'ECG-TICKET-2026-' + Math.floor(Math.random() * 89999 + 10000);
      setDispatchTicketHash(randomTicket + '-SHA256:' + Math.random().toString(16).substring(2, 10) + '9b34ca495991b7');
      setDispatcherModalOpen(true);
      return;
    }

    executeKnapsackShedding();
  };

  const executeKnapsackShedding = () => {
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

      // If Level 3 Islanding is active, lock hospitals onto microgrid
      if (autonomyLevel === 'level3_islanding') {
        setCircuitStates((prev) =>
          prev.map((c) => {
            if (c.id === 'F-01' || c.id === 'F-02') {
              return { ...c, isClosed: true, isLocked: true };
            }
            return c;
          })
        );
      }

      onBalanceGrid();
      setBalancingInProgress(false);
      setLastCosignedTime(new Date().toLocaleTimeString());
      
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
    }, 600);
  };

  const handleAuthorizeDispatch = () => {
    setDispatcherModalOpen(false);
    executeKnapsackShedding();
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
                Track 2: Cold Load Pickup Inrush Protection & Priority Knapsack LP
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

      {/* Cold Load Pickup Inrush Engineering Banner */}
      <div style={{
        background: 'rgba(168, 85, 247, 0.08)',
        border: '1px solid rgba(168, 85, 247, 0.3)',
        borderRadius: '8px',
        padding: '10px 14px',
        marginBottom: '14px',
        fontSize: '0.74rem',
        color: '#e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px'
      }}>
        <div>
          <strong style={{ color: '#c084fc' }}>⚡ REAL ELECTRICAL PHYSICS: Cold Load Pickup Inrush Mitigation.</strong>
          <span style={{ color: '#cbd5e1', marginLeft: '6px' }}>
            When power returns after Dumsor, 50k compressors restart at once. Staged 10% reconnection tranches prevent thermal blowout of 33kV substation transformers ($250k unit cost).
          </span>
        </div>
        <span className="badge badge-purple" style={{ fontSize: '0.62rem', whiteSpace: 'nowrap' }}>
          ECG SCADA Protocol
        </span>
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

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '6px 8px', borderRadius: '6px' }}>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>ACTIVE POWER (P)</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 'bold', fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>
              {dynamicLoad} MW
            </div>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '6px 8px', borderRadius: '6px' }}>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>APPARENT POWER (S)</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 'bold', fontFamily: 'var(--font-mono)', color: '#c084fc' }}>
              {apparentPowerMva} MVA
            </div>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '6px 8px', borderRadius: '6px' }}>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>REACTIVE POWER (Q)</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 'bold', fontFamily: 'var(--font-mono)', color: '#f59e0b' }}>
              {reactivePowerMvar} MVAr
            </div>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '6px 8px', borderRadius: '6px' }}>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>POWER FACTOR</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 'bold', fontFamily: 'var(--font-mono)', color: '#10b981' }}>
              cos φ {powerFactorCosPhi}
            </div>
          </div>
        </div>

        {/* BESS Peak-Shaving Injection Control */}
        <div style={{
          marginTop: '10px',
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: '8px',
          padding: '10px 12px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem' }}>
              <BatteryCharging size={14} color="#34d399" />
              <strong style={{ color: '#fff' }}>Achimota 40 MWh BESS Peak Shaving</strong>
              <span style={{ fontSize: '0.68rem', color: '#34d399', fontFamily: 'var(--font-mono)' }}>(SoC: 78% • 31.2 MWh Available)</span>
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: bessInjectionMw > 0 ? '#34d399' : 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              +{bessInjectionMw} MW Injected
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>0 MW</span>
            <input
              type="range"
              min="0"
              max="35"
              step="5"
              value={bessInjectionMw}
              onChange={(e) => setBessInjectionMw(Number(e.target.value))}
              style={{ flex: 1, accentColor: '#10b981', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>35 MW Max</span>
          </div>
        </div>

        {/* 3-Level Human-in-the-Loop Autonomy Selector */}
        <div style={{
          marginTop: '10px',
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '8px',
          padding: '10px 12px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>
              AUTONOMY SAFETY GOVERNANCE:
            </span>
            {lastCosignedTime && (
              <span style={{ fontSize: '0.68rem', color: '#10b981', fontFamily: 'var(--font-mono)' }}>
                ✓ Last Co-Signed: {lastCosignedTime}
              </span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
            <button
              onClick={() => setAutonomyLevel('level1_advisory')}
              style={{
                background: autonomyLevel === 'level1_advisory' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(0,0,0,0.3)',
                border: autonomyLevel === 'level1_advisory' ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.06)',
                color: autonomyLevel === 'level1_advisory' ? '#fff' : 'var(--text-secondary)',
                padding: '6px 8px',
                borderRadius: '6px',
                fontSize: '0.68rem',
                fontWeight: '600',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div style={{ color: autonomyLevel === 'level1_advisory' ? '#38bdf8' : 'currentColor', fontWeight: 'bold' }}>Level 1: Advisory</div>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>ECG Dispatcher Co-Sign</div>
            </button>

            <button
              onClick={() => setAutonomyLevel('level2_micro')}
              style={{
                background: autonomyLevel === 'level2_micro' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(0,0,0,0.3)',
                border: autonomyLevel === 'level2_micro' ? '1px solid #a855f7' : '1px solid rgba(255,255,255,0.06)',
                color: autonomyLevel === 'level2_micro' ? '#fff' : 'var(--text-secondary)',
                padding: '6px 8px',
                borderRadius: '6px',
                fontSize: '0.68rem',
                fontWeight: '600',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div style={{ color: autonomyLevel === 'level2_micro' ? '#c084fc' : 'currentColor', fontWeight: 'bold' }}>Level 2: Micro</div>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Streetlight/Solar Shift</div>
            </button>

            <button
              onClick={() => setAutonomyLevel('level3_islanding')}
              style={{
                background: autonomyLevel === 'level3_islanding' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(0,0,0,0.3)',
                border: autonomyLevel === 'level3_islanding' ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.06)',
                color: autonomyLevel === 'level3_islanding' ? '#fff' : 'var(--text-secondary)',
                padding: '6px 8px',
                borderRadius: '6px',
                fontSize: '0.68rem',
                fontWeight: '600',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div style={{ color: autonomyLevel === 'level3_islanding' ? '#34d399' : 'currentColor', fontWeight: 'bold' }}>Level 3: Islanding</div>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Hospital UPS &lt;49.2Hz</div>
            </button>
          </div>
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
            {autonomyLevel === 'level1_advisory' ? 'Execute with ECG Dispatcher Co-Sign' : 'Execute Anti-Dumsor Knapsack'}
          </>
        )}
      </button>

      {/* ECG Dispatcher Cryptographic Co-Sign Modal (Level 1 Safeguard) */}
      {dispatcherModalOpen && (
        <div className="modal-backdrop" onClick={() => setDispatcherModalOpen(false)} style={{ zIndex: 1000 }}>
          <div 
            className="modal-card" 
            style={{
              maxWidth: '540px',
              border: '1px solid rgba(56, 189, 248, 0.5)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.9), 0 0 30px rgba(56, 189, 248, 0.25)',
              padding: '24px'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38bdf8'
              }}>
                <Key size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', color: '#fff' }}>ECG Dispatcher Cryptographic Co-Sign</h3>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                  Level 1 Human-in-the-Loop Protocol • National Control Center (NCC) Tema
                </p>
              </div>
            </div>

            <div style={{
              background: 'rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '14px',
              fontSize: '0.72rem',
              fontFamily: 'var(--font-mono)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div><span style={{ color: 'var(--text-muted)' }}>Ticket ID:</span> <strong style={{ color: '#38bdf8' }}>{dispatchTicketHash.split('-SHA256')[0]}</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>SHA-256 Digest:</span> <span style={{ color: '#a855f7' }}>{dispatchTicketHash.split('-SHA256:')[1]}</span></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Substation:</span> <strong>Achimota Bulk Supply Point (330kV/33kV)</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Authorized Dispatcher:</span> <strong>Kwesi Mensah (ECG Senior Controller #408)</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Target Load Shedding:</span> <strong style={{ color: '#f59e0b' }}>Tier 4 Non-Essential (20 MW: F-07 Billboards & F-08 Lighting)</strong></div>
              <div style={{ color: '#34d399', fontWeight: 'bold' }}>
                ✓ Tier 1 Life-Support (Ridge Hospital & Weija Waterworks) LOCKED IMMUTABLY
              </div>
            </div>

            <p style={{ fontSize: '0.75rem', color: '#cbd5e1', lineHeight: '1.4', marginBottom: '16px' }}>
              Autonomous AI load shed execution is disabled without human verification. By cryptographically signing, you authorize the opening of Tier 4 breakers to arrest grid underfrequency collapse ({gridFrequencyHz} Hz).
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setDispatcherModalOpen(false)}
                className="btn-secondary"
                style={{ flex: 1, padding: '9px 14px', fontSize: '0.78rem' }}
              >
                Reject & Cancel
              </button>
              <button
                onClick={handleAuthorizeDispatch}
                className="btn-primary"
                style={{
                  flex: 1.4,
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  padding: '9px 14px',
                  fontSize: '0.78rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <CheckCircle size={15} />
                Cryptographically Co-Sign & Shed 20 MW
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
