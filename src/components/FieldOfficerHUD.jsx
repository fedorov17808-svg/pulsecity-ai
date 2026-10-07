import React, { useState } from 'react';
import { Shield, Zap, AlertTriangle, Radio, Navigation, CheckCircle2, Siren } from 'lucide-react';

export default function FieldOfficerHUD({ isOpen, onClose, onSignalOverride, onBreakerToggle }) {
  const [role, setRole] = useState('mttd'); // 'mttd' | 'ecg' | 'ama'
  const [activeOverride, setActiveOverride] = useState(null);
  const [radioLog, setRadioLog] = useState([
    { id: 1, time: '12:18:02', text: 'MTTD Unit 4: Kwame Nkrumah Circle congestion surge. Heavy trotro accumulation.' },
    { id: 2, time: '12:19:45', text: 'ECG Control: Achimota Bulk Supply Point reported 14 MW reserve deficit.' },
    { id: 3, time: '12:20:10', text: 'AMA Sanitation: Korle Lagoon sluice gate telemetry synchronized. Basin depth 2.44m.' }
  ]);
  const [actionNotice, setActionNotice] = useState(null);

  if (!isOpen) return null;

  const triggerAction = (label, details) => {
    setActiveOverride(label);
    setActionNotice(`✓ EXECUTED: ${label} — ${details}`);
    setRadioLog(prev => [
      { id: Date.now(), time: new Date().toLocaleTimeString(), text: `FIELD OVERRIDE: ${label} applied by Officer ID 4082.` },
      ...prev.slice(0, 5)
    ]);
    setTimeout(() => setActionNotice(null), 4000);
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="field-hud-title">
      <div 
        className="modal-card" 
        style={{ maxWidth: '540px', border: '2px solid rgba(245, 158, 11, 0.6)', boxShadow: '0 25px 70px rgba(0,0,0,0.9), 0 0 35px rgba(245, 158, 11, 0.25)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Tactical Header */}
        <div style={{
          background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
          padding: '14px 20px',
          color: '#050811',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#fff', boxShadow: '0 0 10px #fff' }}></span>
            <div>
              <h2 id="field-hud-title" style={{ fontSize: '0.88rem', fontWeight: '900', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Field Tactical Terminal v2.6 // Multi-Agency RBAC
              </h2>
              <p style={{ fontSize: '0.68rem', fontWeight: '700', color: '#1c1917' }}>
                DIRECTORATE OF URBAN CRISIS MANAGEMENT // GAMA (MTTD • ECG • AMA)
              </p>
            </div>
          </div>
          <button className="modal-close-btn" style={{ background: 'rgba(0,0,0,0.2)', color: '#000', border: 'none' }} onClick={onClose} aria-label="Close Field Officer HUD">✕</button>
        </div>

        {/* Agency Switcher */}
        <div style={{ padding: '10px 14px', background: 'rgba(15, 23, 42, 0.95)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
          <button
            onClick={() => setRole('mttd')}
            className={`pill-tab ${role === 'mttd' ? 'active' : ''}`}
            style={{ justifyContent: 'center', fontSize: '0.72rem', padding: '6px 8px' }}
          >
            🚓 MTTD Police
          </button>
          <button
            onClick={() => setRole('ecg')}
            className={`pill-tab ${role === 'ecg' ? 'active' : ''}`}
            style={{ justifyContent: 'center', fontSize: '0.72rem', padding: '6px 8px' }}
          >
            ⚡ ECG Grid
          </button>
          <button
            onClick={() => setRole('ama')}
            className={`pill-tab ${role === 'ama' ? 'active' : ''}`}
            style={{ justifyContent: 'center', fontSize: '0.72rem', padding: '6px 8px' }}
          >
            🍃 AMA Flood/Waste
          </button>
        </div>

        {/* Dynamic Action Notification */}
        {actionNotice && (
          <div style={{
            background: '#10b981',
            color: '#022c22',
            fontSize: '0.75rem',
            fontWeight: '700',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>🚨</span>
            <span>{actionNotice}</span>
          </div>
        )}

        {/* Main Body */}
        <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
          {role === 'mttd' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.78rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Assigned Junction:</span>
                  <span style={{ color: '#fbbf24', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>Kwame Nkrumah Circle (TR-01)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Current Phase State:</span>
                  <span style={{ color: '#34d399', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>NORTH-SOUTH DUAL GREEN (42s)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Optical Queue Estimate:</span>
                  <span style={{ color: '#fb7185', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>34 Vehicles (94% Saturation)</span>
                </div>
              </div>

              {/* Instant Tactical Action Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  onClick={() => triggerAction('ALL-RED LOCKDOWN', 'All intersection signals switched to solid RED for VIP escort / accident clearance.')}
                  style={{
                    padding: '12px',
                    borderRadius: '12px',
                    background: 'rgba(244, 63, 94, 0.15)',
                    border: '1px solid rgba(244, 63, 94, 0.4)',
                    color: '#fecdd3',
                    fontWeight: '700',
                    fontSize: '0.75rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer'
                  }}
                >
                  <span style={{ fontSize: '1.2rem' }}>🛑</span>
                  <span>FORCE ALL-RED</span>
                  <span style={{ fontSize: '0.65rem', color: '#f43f5e', fontWeight: 'normal' }}>Accident Clearance</span>
                </button>

                <button
                  onClick={() => {
                    triggerAction('AMBULANCE GREEN WAVE', 'A* Emergency route preempted from Ridge Hospital.');
                    if (onSignalOverride) onSignalOverride('GREEN_WAVE');
                  }}
                  style={{
                    padding: '12px',
                    borderRadius: '12px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    color: '#a7f3d0',
                    fontWeight: '700',
                    fontSize: '0.75rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer'
                  }}
                >
                  <span style={{ fontSize: '1.2rem' }}>🚑</span>
                  <span>TRIGGER GREEN WAVE</span>
                  <span style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 'normal' }}>Ridge Hosp. Corridor</span>
                </button>

                <button
                  onClick={() => triggerAction('EXTEND GREEN +25s', 'Webster split extended for heavy northbound trotro surge.')}
                  style={{
                    padding: '12px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#f8fafc',
                    fontWeight: '700',
                    fontSize: '0.75rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer'
                  }}
                >
                  <span style={{ fontSize: '1.1rem' }}>⏱️</span>
                  <span>EXTEND GREEN (+25s)</span>
                  <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 'normal' }}>Northbound Flush</span>
                </button>

                <button
                  onClick={() => triggerAction('FLASHING AMBER', 'Signals degraded to caution flash due to grid instability.')}
                  style={{
                    padding: '12px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#f8fafc',
                    fontWeight: '700',
                    fontSize: '0.75rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer'
                  }}
                >
                  <span style={{ fontSize: '1.1rem' }}>⚠️</span>
                  <span>FLASHING AMBER</span>
                  <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 'normal' }}>Caution Mode</span>
                </button>
              </div>
            </div>
          )}

          {role === 'ecg' && (
            /* ECG Grid Engineering */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.78rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Substation Monitored:</span>
                  <span style={{ color: '#fbbf24', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>Achimota BSP (EN-01)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Underfrequency Threshold:</span>
                  <span style={{ color: '#f87171', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>49.80 Hz Trigger</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                <button
                  onClick={() => {
                    triggerAction('SHED NON-CRITICAL (TEMA FEEDER 4)', 'Shedding 25 MW of industrial non-essential arc furnaces to protect Accra hospitals.');
                    if (onBreakerToggle) onBreakerToggle('FEEDER_4');
                  }}
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    background: 'rgba(245, 158, 11, 0.15)',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    color: '#fef08a',
                    fontWeight: '700',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ textAlign: 'left' }}>
                    <div>⚡ TRIP NON-CRITICAL BREAKER</div>
                    <div style={{ fontSize: '0.68rem', color: '#fbbf24', fontWeight: 'normal' }}>Saves 25 MW • Preserves Korle Bu Hospital</div>
                  </div>
                  <span style={{ fontSize: '1.2rem' }}>&rarr;</span>
                </button>
              </div>
            </div>
          )}

          {role === 'ama' && (
            /* AMA Municipal Sanitation & Flood Response */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.78rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Monitored Drainage Basin:</span>
                  <span style={{ color: '#34d399', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>Korle Lagoon / Odaw River (ECO-01)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Basin Water Level:</span>
                  <span style={{ color: '#38bdf8', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>2.44m (High Tide Clearance: 1.8m)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Culvert Choke Index:</span>
                  <span style={{ color: '#fbbf24', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>38% Solid Waste Accumulation</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                <button
                  onClick={() => triggerAction('OPEN KORLE SLUICE GATES (65%)', 'Atlantic tidal gates motorized actuation engaged. Draining 48,000 m³/hr to sea.')}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '12px',
                    background: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    color: '#e0f2fe',
                    fontWeight: '700',
                    fontSize: '0.78rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ textAlign: 'left' }}>
                    <div>🌊 ACTUATE KORLE LAGOON SLUICE GATES</div>
                    <div style={{ fontSize: '0.66rem', color: '#38bdf8', fontWeight: 'normal' }}>Open to 65% capacity • Atlantic tidal outflow</div>
                  </div>
                  <span style={{ fontSize: '1.2rem' }}>&rarr;</span>
                </button>

                <button
                  onClick={() => triggerAction('DISPATCH COMPACTOR #04 (ODAW DRAIN)', 'Rapid desilting compactor truck mobilized to Kwame Nkrumah Circle culvert.')}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '12px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    color: '#d1fae5',
                    fontWeight: '700',
                    fontSize: '0.78rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ textAlign: 'left' }}>
                    <div>🚛 DISPATCH RAPID COMPACTOR TRUCK #04</div>
                    <div style={{ fontSize: '0.66rem', color: '#34d399', fontWeight: 'normal' }}>Circle Culvert desilting • Clears choked plastic bottleneck</div>
                  </div>
                  <span style={{ fontSize: '1.2rem' }}>&rarr;</span>
                </button>

                <button
                  onClick={() => triggerAction('FLASH EVACUATION ALERT (ALAJO BASIN)', 'Emergency broadcast transmitted over USSD *920*26# and GSM cell towers.')}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '12px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    color: '#fee2e2',
                    fontWeight: '700',
                    fontSize: '0.78rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ textAlign: 'left' }}>
                    <div>📢 BROADCAST FLASH BASIN EVACUATION</div>
                    <div style={{ fontSize: '0.66rem', color: '#f87171', fontWeight: 'normal' }}>Cell-broadcast & USSD alarm to flood risk zones</div>
                  </div>
                  <span style={{ fontSize: '1.2rem' }}>&rarr;</span>
                </button>
              </div>
            </div>
          )}

          {/* Radio Log */}
          <div style={{
            background: '#040810',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '12px',
            fontSize: '0.72rem',
            fontFamily: 'var(--font-mono)',
            color: '#94a3b8',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <div style={{ color: '#fbbf24', fontWeight: '700', fontSize: '0.7rem' }}>
              📻 ENCRYPTED TETRA POLICE RADIO LOG
            </div>
            {radioLog.map(item => (
              <div key={item.id} style={{ display: 'flex', gap: '8px' }}>
                <span style={{ color: '#64748b' }}>[{item.time}]</span>
                <span style={{ color: '#cbd5e1' }}>{item.text}</span>
              </div>
            ))}
          </div>

          {/* Offline Blackout & Hardware Watchdog Diagnostics */}
          <div style={{
            background: 'rgba(16, 185, 129, 0.05)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: '12px',
            padding: '12px',
            fontSize: '0.72rem',
            fontFamily: 'var(--font-mono)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#34d399', fontWeight: 'bold' }}>🛡️ OFFLINE BLACKOUT RESILIENCE</span>
              <span style={{ fontSize: '0.62rem', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '1px 6px', borderRadius: '4px' }}>
                FAIL-SAFE ACTIVE
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
              <span>Cellular 4G Link:</span> <span style={{ color: '#f59e0b' }}>STANDBY / LOW-RSSI</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
              <span>LoRaWAN 868MHz Mesh:</span> <strong style={{ color: '#34d399' }}>CONNECTED (Peer Relay)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
              <span>Hardware Watchdog (WDT):</span> <strong style={{ color: '#38bdf8' }}>8000ms Auto-Reset</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
              <span>LiFePO4 Solar Reserve:</span> <strong style={{ color: '#34d399' }}>72-hr Continuous Autonomous</strong>
            </div>
            <div style={{ fontSize: '0.66rem', color: '#94a3b8', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px', marginTop: '2px' }}>
              Fallback Mode: If cloud drops &gt;10s, intersection reverts to inductive-loop yellow/green safety splits automatically.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 18px', background: 'rgba(15, 23, 42, 0.8)', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-secondary" onClick={onClose}>
            Close HUD
          </button>
        </div>
      </div>
    </div>
  );
}
