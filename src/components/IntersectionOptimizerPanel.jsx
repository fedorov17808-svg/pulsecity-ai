import React, { useState } from 'react';
import { 
  Car, Activity, Shield, Siren, Sparkles, Cpu, Clock, 
  ArrowRight, CheckCircle2, ChevronRight, BarChart2, Radio,
  Sliders, Layers, Play
} from 'lucide-react';
import CctvTrafficCanvas from './CctvTrafficCanvas';
import { calculateWebsterSignalTiming, compareFixedVsWebster } from '../utils/websterAlgorithm';
import DelayComparison from './DelayComparison';
import { sfx } from '../utils/soundEffects';

export default function IntersectionOptimizerPanel({
  selectedNode,
  allTrafficNodes = [],
  onSelectNode,
  onOpenVisionModal,
  onApplyOptimization,
  onLaunchGreenWave,
  onOpenGateway
}) {
  const [optimizing, setOptimizing] = useState(false);
  const [optSuccess, setOptSuccess] = useState(false);

  // Default to first traffic node if none selected
  const node = selectedNode && selectedNode.id.startsWith('TR-') 
    ? selectedNode 
    : (allTrafficNodes[0] || {
        id: 'TR-01',
        name: 'Kwame Nkrumah Interchange (Circle)',
        flowRate: 3420,
        saturationFlow: 4500,
        congestion: 78,
        speedKmh: 14,
        lightState: 'GREEN',
        cycleRemainingSec: 24,
        cameraFeed: 'CAM-01: Circle Flyover 360'
      });

  // Calculate Webster optimum values dynamically for this node
  const flow = node.flowRate || 0;
  const sat = node.saturationFlow || 1800;
  const webster = calculateWebsterSignalTiming({
    phases: [
      { name: 'Primary Arterial Approach', flowRate: flow, saturationFlow: sat, minGreen: 20 },
      { name: 'Cross-Turn Secondary Approach', flowRate: Math.round(flow * 0.42), saturationFlow: sat, minGreen: 12 }
    ],
    lostTimePerPhase: 4,
    maxCycleLength: 120,
    minCycleLength: 40
  });

  const optimalCycle = webster.optimumCycleLengthSeconds;
  const phase1Green = webster.phases[0].effectiveGreenSeconds;
  const phase2Green = webster.phases[1].effectiveGreenSeconds;
  const flowRatioY = webster.totalFlowRatio_Y.toFixed(2);
  const mainDelay = webster.phases[0]?.estimatedDelaySecPerVehicle;
  const delaySec = mainDelay === null || mainDelay === undefined ? null : mainDelay.toFixed(1);
  const comparison = compareFixedVsWebster({ phases: webster.phases });

  const handleApplyWebster = () => {
    sfx.click();
    setOptimizing(true);
    setTimeout(() => {
      if (onApplyOptimization) {
        onApplyOptimization(node.id, optimalCycle);
      }
      setOptimizing(false);
      setOptSuccess(true);
      sfx.success();
      setTimeout(() => setOptSuccess(false), 3500);
    }, 600);
  };

  return (
    <div 
      className="glass-panel" 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%', 
        overflowY: 'auto',
        borderRadius: '16px',
        padding: '16px',
        gap: '14px',
        background: 'rgba(8, 14, 26, 0.85)',
        border: '1px solid rgba(0, 242, 254, 0.22)',
        boxShadow: '0 12px 35px rgba(0,0,0,0.65)'
      }}
    >
      {/* 1. Header with Intersection Identity & Light State */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ 
              fontSize: '0.62rem', 
              fontFamily: 'var(--font-mono)', 
              color: 'var(--accent-cyan)',
              background: 'rgba(0, 242, 254, 0.12)',
              border: '1px solid rgba(0, 242, 254, 0.3)',
              padding: '1px 6px',
              borderRadius: '4px',
              fontWeight: '700'
            }}>
              {node.id} // CONTROLLER ARMED
            </span>
            <span style={{ fontSize: '0.65rem', color: '#64748b' }}>
              NEMA TS2 Type 1 CMU
            </span>
          </div>
          <h2 style={{ fontSize: '1.15rem', color: '#fff', fontWeight: '800', marginTop: '3px', letterSpacing: '-0.01em' }}>
            {node.name}
          </h2>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
            Speed: <strong style={{ color: '#fff' }}>{node.speedKmh || 18} km/h</strong> • Demand: <strong style={{ color: '#38bdf8' }}>{node.flowRate || 3200} PCU/h</strong>
          </div>
        </div>

        {/* Live Signal Status Pill */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'flex-end',
          background: 'rgba(0, 0, 0, 0.4)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '6px 10px',
          borderRadius: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: node.lightState === 'GREEN' ? '#10b981' : node.lightState === 'YELLOW' ? '#f59e0b' : '#ef4444',
              boxShadow: node.lightState === 'GREEN' ? '0 0 10px #10b981' : node.lightState === 'YELLOW' ? '0 0 10px #f59e0b' : '0 0 10px #ef4444'
            }} />
            <span style={{ 
              fontSize: '0.8rem', 
              fontWeight: '800', 
              fontFamily: 'var(--font-mono)',
              color: node.lightState === 'GREEN' ? '#34d399' : node.lightState === 'YELLOW' ? '#fbbf24' : '#f87171'
            }}>
              {node.lightState}
            </span>
          </div>
          <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
            {node.cycleRemainingSec}s remaining
          </div>
        </div>
      </div>

      {/* 2. Arterial Node Quick Selector Pills */}
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
        {allTrafficNodes.slice(0, 5).map((n) => {
          const isSelected = n.id === node.id;
          return (
            <button
              key={n.id}
              onClick={() => { sfx.click(); if (onSelectNode) onSelectNode(n); }}
              style={{
                background: isSelected ? 'rgba(0, 242, 254, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                border: isSelected ? '1px solid var(--accent-cyan)' : '1px solid rgba(255, 255, 255, 0.08)',
                color: isSelected ? '#fff' : '#94a3b8',
                borderRadius: '6px',
                padding: '4px 8px',
                fontSize: '0.68rem',
                fontWeight: isSelected ? '700' : '500',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              {n.id}: {n.name.split(' ')[0]}
            </button>
          );
        })}
      </div>

      {/* 3. Live Edge Computer Vision Frame */}
      <div style={{
        background: 'rgba(3, 7, 18, 0.85)',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        borderRadius: '12px',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Stream metadata bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '6px 10px',
          background: 'rgba(0, 0, 0, 0.6)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444' }} className="pulse-indicator" />
            <span style={{ fontSize: '0.68rem', fontWeight: '700', color: '#fff', fontFamily: 'var(--font-mono)' }}>
              EDGE CV • RTSP CAM-01
            </span>
          </div>
          <button
            onClick={() => { sfx.click(); if (onOpenVisionModal) onOpenVisionModal(node); }}
            style={{
              background: 'rgba(0, 242, 254, 0.15)',
              border: '1px solid rgba(0, 242, 254, 0.4)',
              color: 'var(--accent-cyan)',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '0.66rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>Full 4K Vision</span>
            <ChevronRight size={11} />
          </button>
        </div>

        {/* Live Canvas Feed */}
        <div style={{ width: '100%', height: '140px', position: 'relative' }}>
          <CctvTrafficCanvas
            cameraName={node.cameraFeed || 'Kwame Nkrumah Circle'}
            lightState={node.lightState}
            isIncident={node.incidentActive}
          />
        </div>

        {/* Real-time PCU Detection Strip */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '4px',
          padding: '6px 8px',
          background: 'rgba(0, 0, 0, 0.5)',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          textAlign: 'center'
        }}>
          <div>
            <div style={{ fontSize: '0.6rem', color: '#94a3b8' }}>INPUT DATA</div>
            <div style={{ fontSize: '0.78rem', fontWeight: '800', color: '#fbbf24' }}>
              {node.simulated ? 'Simulated' : 'Telemetry'} • {flow} veh/h
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.6rem', color: '#94a3b8' }}>SATURATION RATIO</div>
            <div style={{ fontSize: '0.78rem', fontWeight: '800', color: flowRatioY > 0.7 ? '#f87171' : '#34d399' }}>
              Y = {flowRatioY}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.6rem', color: '#94a3b8' }}>CONGESTION DENSITY</div>
            <div style={{ fontSize: '0.78rem', fontWeight: '800', color: '#38bdf8' }}>
              {node.congestion}%
            </div>
          </div>
        </div>
      </div>

      {/* 4. F.V. Webster (1958) Algorithmic Engine Box */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.75) 0%, rgba(30, 41, 59, 0.5) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.35)',
        borderRadius: '12px',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sliders size={14} color="#34d399" />
            <span style={{ fontSize: '0.76rem', fontWeight: '800', color: '#6ee7b7' }}>
              F.V. Webster (1958) Signal Timing Formula
            </span>
          </div>
          <span style={{ fontSize: '0.62rem', color: '#10b981', fontFamily: 'var(--font-mono)' }}>
            C₀ = (1.5L + 5) / (1 - Y)
          </span>
        </div>

        {/* Parameter Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '6px',
          background: 'rgba(0, 0, 0, 0.35)',
          padding: '8px',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div>
            <div style={{ fontSize: '0.6rem', color: '#94a3b8' }}>LOST TIME (L)</div>
            <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#fff', fontFamily: 'var(--font-mono)' }}>
              8.0s
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.6rem', color: '#94a3b8' }}>OPTIMAL C₀</div>
            <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#34d399', fontFamily: 'var(--font-mono)' }}>
              {optimalCycle}s
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.6rem', color: '#94a3b8' }}>PHASE 1 GREEN</div>
            <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
              {phase1Green}s
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.6rem', color: '#94a3b8' }}>PHASE 2 GREEN</div>
            <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#c084fc', fontFamily: 'var(--font-mono)' }}>
              {phase2Green}s
            </div>
          </div>
        </div>

        {/* Delay Saved Delta */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          padding: '6px 10px',
          borderRadius: '6px'
        }}>
          <span style={{ fontSize: '0.7rem', color: '#cbd5e1' }}>
            Estimated delay per vehicle:
          </span>
          <span style={{ fontSize: '0.74rem', fontWeight: '800', color: '#34d399', fontFamily: 'var(--font-mono)' }}>
            {delaySec === null ? 'oversaturated' : `${delaySec}s / veh`}
          </span>
        </div>

        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
          <DelayComparison comparison={comparison} />
        </div>

        {/* Apply Button */}
        <button
          onClick={handleApplyWebster}
          disabled={optimizing}
          style={{
            background: optSuccess 
              ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
              : 'linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, rgba(56, 189, 248, 0.25) 100%)',
            border: '1px solid #10b981',
            color: '#fff',
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '0.76rem',
            fontWeight: '700',
            cursor: optimizing ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.2s ease'
          }}
        >
          {optSuccess ? (
            <>
              <CheckCircle2 size={13} color="#fff" />
              <span>✓ Optimal Webster Phase Dispatched to Cabinet</span>
            </>
          ) : (
            <>
              <Sparkles size={13} color="#34d399" />
              <span>{optimizing ? 'Calculating Webster matrix...' : `Apply Webster Split (${optimalCycle}s Cycle)`}</span>
            </>
          )}
        </button>
      </div>

      {/* 5. Emergency Medical Green Wave Dispatch */}
      <div style={{
        background: 'rgba(239, 68, 68, 0.08)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: '12px',
        padding: '10px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Siren size={14} color="#f87171" />
            <span style={{ fontSize: '0.74rem', fontWeight: '800', color: '#fca5a5' }}>
              Golden Hour Medical Preemption
            </span>
          </div>
          <div style={{ fontSize: '0.66rem', color: '#94a3b8', marginTop: '2px' }}>
            Kwame Nkrumah Circle → 37 Military Hospital Corridor
          </div>
        </div>

        <button
          onClick={() => {
            sfx.alarm();
            if (onLaunchGreenWave) onLaunchGreenWave();
          }}
          className="btn-emergency-pulse"
          style={{
            fontSize: '0.72rem',
            padding: '6px 12px',
            whiteSpace: 'nowrap'
          }}
        >
          <Play size={11} fill="#fff" />
          <span>Launch Green Wave</span>
        </button>
      </div>

    </div>
  );
}
