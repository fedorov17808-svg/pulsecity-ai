import React, { useState } from 'react';
import { Shield, Zap, AlertTriangle, Radio, Navigation, CheckCircle2, Siren } from 'lucide-react';

export default function FieldOfficerHUD({ isOpen, onClose, onSignalOverride, onBreakerToggle }) {
  const [role, setRole] = useState('mttd'); // 'mttd' | 'ecg'
  const [activeOverride, setActiveOverride] = useState(null);
  const [radioLog, setRadioLog] = useState([
    { id: 1, time: '12:18:02', text: 'MTTD Unit 4: Kwame Nkrumah Circle congestion surge. Heavy trotro accumulation.' },
    { id: 2, time: '12:19:45', text: 'ECG Control: Achimota Bulk Supply Point reported 14 MW reserve deficit.' }
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
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-card" 
        style={{ maxWidth: '520px', border: '2px solid rgba(245, 158, 11, 0.6)', boxShadow: '0 25px 70px rgba(0,0,0,0.9), 0 0 35px rgba(245, 158, 11, 0.25)' }}
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
              <h2 style={{ fontSize: '0.88rem', fontWeight: '900', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Field Tactical Terminal v2.6
              </h2>
              <p style={{ fontSize: '0.68rem', fontWeight: '700', color: '#1c1917' }}>
                DIRECTORATE OF URBAN CRISIS MANAGEMENT // GAMA
              </p>
            </div>
          </div>
          <button className="modal-close-btn" style={{ background: 'rgba(0,0,0,0.2)', color: '#000', border: 'none' }} onClick={onClose}>✕</button>
        </div>

        {/* Agency Switcher */}
        <div style={{ padding: '12px 18px', background: 'rgba(15, 23, 42, 0.95)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setRole('mttd')}
            className={`pill-tab ${role === 'mttd' ? 'active' : ''}`}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            🚓 MTTD Traffic Police
          </button>
          <button
            onClick={() => setRole('ecg')}
            className={`pill-tab ${role === 'ecg' ? 'active' : ''}`}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            ⚡ ECG Grid Engineering
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
          {role === 'mttd' ? (
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
          ) : (
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
