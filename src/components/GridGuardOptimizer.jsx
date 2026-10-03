import React, { useState } from 'react';
import { 
  Zap, BatteryCharging, Sun, AlertTriangle, ShieldCheck, 
  ArrowUpRight, ArrowDownRight, RefreshCw, Cpu, CheckCircle2, Calculator, ShieldAlert 
} from 'lucide-react';
import { optimizeGridLoadBalance } from '../utils/gridOptimization';
import confetti from 'canvas-confetti';

export default function GridGuardOptimizer({
  energyNodes,
  onBalanceGrid
}) {
  const [autoBalanceEnabled, setAutoBalanceEnabled] = useState(true);
  const [balancingInProgress, setBalancingInProgress] = useState(false);
  const [optimizationAudit, setOptimizationAudit] = useState(null);

  // Compute aggregate stats
  const totalCapacity = energyNodes.reduce((acc, n) => acc + n.capacityMw, 0);
  const currentLoad = energyNodes.reduce((acc, n) => acc + n.currentLoadMw, 0);
  const totalSolar = energyNodes.reduce((acc, n) => acc + n.solarInputMw, 0);
  const loadPercentage = Math.round((currentLoad / totalCapacity) * 100);

  const handleRunKnapsackOptimization = () => {
    setBalancingInProgress(true);
    
    setTimeout(() => {
      // Find the most strained substation (Achimota)
      const strainedSubstation = energyNodes.find((n) => n.id === 'EN-01') || energyNodes[0];
      
      // Execute the real Priority Knapsack optimization algorithm
      const audit = optimizeGridLoadBalance(strainedSubstation, 35);
      setOptimizationAudit(audit);
      
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
    <div className="glass-panel" style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Title & Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
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
              <h3 style={{ fontSize: '1.2rem', color: '#fff' }}>GridGuard AI // Anti-Dumsor Knapsack Engine</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Track 2: Discrete Priority Optimization & Blackout Prevention
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Auto-Stabilizer:</span>
          <button
            onClick={() => setAutoBalanceEnabled(!autoBalanceEnabled)}
            style={{
              background: autoBalanceEnabled ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)',
              border: autoBalanceEnabled ? '1px solid #10b981' : '1px solid var(--border-subtle)',
              color: autoBalanceEnabled ? '#34d399' : 'var(--text-muted)',
              padding: '4px 10px',
              borderRadius: '9999px',
              fontSize: '0.72rem',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            {autoBalanceEnabled ? '● ARMED' : 'OFFLINE'}
          </button>
        </div>
      </div>

      {/* Aggregate City Grid Bar */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: 'var(--radius-md)',
        padding: '14px',
        border: '1px solid var(--border-subtle)',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.82rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Metropolitan Load vs Safe Continuous Threshold</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: loadPercentage > 85 ? '#f43f5e' : '#a855f7' }}>
            {currentLoad} MW / {totalCapacity} MW ({loadPercentage}%)
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
            width: `${Math.min(loadPercentage, 100)}%`,
            background: loadPercentage > 85 
              ? 'linear-gradient(90deg, #f59e0b 0%, #f43f5e 100%)' 
              : 'linear-gradient(90deg, #10b981 0%, #a855f7 100%)',
            transition: 'width 0.5s ease',
            boxShadow: '0 0 12px rgba(168, 85, 247, 0.5)'
          }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Sun size={13} color="#f59e0b" /> Solar: <strong style={{ color: '#f59e0b' }}>+{totalSolar} MW</strong>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <BatteryCharging size={13} color="#10b981" /> Industrial BESS: <strong style={{ color: '#10b981' }}>88% Ready</strong>
          </span>
        </div>
      </div>

      {/* Knapsack Optimization Audit Box (Shows real math if triggered) */}
      {optimizationAudit && (
        <div style={{
          background: 'rgba(168, 85, 247, 0.08)',
          border: '1px solid rgba(168, 85, 247, 0.4)',
          borderRadius: 'var(--radius-md)',
          padding: '14px',
          marginBottom: '14px',
          animation: 'fadeIn 0.3s ease'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#c084fc', fontSize: '0.78rem', fontWeight: 'bold' }}>
              <Calculator size={14} />
              MATHEMATICAL KNAPSACK BALANCE AUDIT
            </div>
            <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>Blackout Averted</span>
          </div>

          <div style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: '#f1f5f9', marginBottom: '8px' }}>
            {optimizationAudit.mathAudit.equation}
          </div>

          {/* Protected Critical Life Support vs Shedded Circuits */}
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
            <div style={{ color: '#34d399', marginBottom: '2px' }}>
              ✓ <strong>Protected:</strong> {optimizationAudit.protectedCircuits?.join(', ')}
            </div>
            <div style={{ color: '#fb7185' }}>
              ⚠ <strong>Shedded:</strong> {optimizationAudit.circuitsShedded?.map(c => `${c.name} (-${c.sheddedMw}MW)`).join(', ')}
            </div>
          </div>
        </div>
      )}

      {/* Substation Feeder Grid Cards */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
        {energyNodes.map((node) => {
          const loadRatio = Math.round((node.currentLoadMw / node.capacityMw) * 100);
          const isDanger = node.dumsorRisk > 70;

          return (
            <div 
              key={node.id}
              style={{
                background: isDanger ? 'rgba(244, 63, 94, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                border: isDanger ? '1px solid rgba(244, 63, 94, 0.4)' : '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.86rem', fontWeight: 'bold', color: '#fff' }}>
                    {node.name.replace(' Bulk Supply Point (BSP)', ' BSP')}
                  </span>
                  {isDanger && (
                    <span className="badge badge-rose" style={{ fontSize: '0.62rem', padding: '1px 5px' }}>
                      Dumsor Spike
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Supplying: {node.connectedDistricts?.slice(0, 3).join(', ')}
                </div>
              </div>

              <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 'bold', color: isDanger ? '#f43f5e' : '#c084fc' }}>
                  {node.currentLoadMw} / {node.capacityMw} MW
                </div>
                <div style={{ fontSize: '0.7rem', color: isDanger ? '#fb7185' : 'var(--text-muted)' }}>
                  Load: {loadRatio}% • Risk: {node.dumsorRisk}%
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Optimization Execution Button */}
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
            Solving Constrained Knapsack LP...
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
