import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle2, Zap, RefreshCw, Cpu, Radio, Activity } from 'lucide-react';
import { sfx } from '../utils/soundEffects';

export default function HardwareSchematicViewer() {
  const [faultMode, setFaultMode] = useState(false); // false = NORMAL, true = FAULT / WATCHDOG TRIP
  const [activePhase, setActivePhase] = useState('NS'); // 'NS' or 'EW'
  const [amberBlink, setAmberBlink] = useState(false);

  // 1Hz blink for emergency flashing amber
  useEffect(() => {
    if (!faultMode) return;
    const interval = setInterval(() => {
      setAmberBlink(prev => !prev);
    }, 500);
    return () => clearInterval(interval);
  }, [faultMode]);

  // Phase cycling in normal mode
  useEffect(() => {
    if (faultMode) return;
    const interval = setInterval(() => {
      setActivePhase(prev => (prev === 'NS' ? 'EW' : 'NS'));
    }, 4500);
    return () => clearInterval(interval);
  }, [faultMode]);

  const handleToggleFault = () => {
    sfx.alert();
    setFaultMode(!faultMode);
  };

  const handleManualPhaseToggle = () => {
    if (faultMode) return;
    sfx.click();
    setActivePhase(prev => (prev === 'NS' ? 'EW' : 'NS'));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Tactical Status & Control Bar */}
      <div style={{
        background: faultMode 
          ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(185, 28, 28, 0.35) 100%)' 
          : 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 78, 59, 0.25) 100%)',
        border: faultMode ? '1px solid rgba(239, 68, 68, 0.6)' : '1px solid rgba(16, 185, 129, 0.4)',
        borderRadius: '12px',
        padding: '14px 18px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        transition: 'all 0.3s ease'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: faultMode ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.25)',
            border: faultMode ? '1px solid #ef4444' : '1px solid #10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {faultMode ? <AlertTriangle size={20} color="#fca5a5" /> : <Shield size={20} color="#34d399" />}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontSize: '0.86rem',
                fontWeight: '800',
                color: '#fff',
                fontFamily: 'var(--font-mono)'
              }}>
                {faultMode ? 'CMU FAIL-SAFE ACTIVE: HARDWARE INTERLOCK ENGAGED' : 'SYSTEM OPERATIONAL: AUTONOMOUS ACTUATION ACTIVE'}
              </span>
              <span style={{
                fontSize: '0.62rem',
                fontWeight: '700',
                padding: '2px 7px',
                borderRadius: '4px',
                background: faultMode ? '#ef4444' : '#10b981',
                color: faultMode ? '#fff' : '#022c22'
              }}>
                {faultMode ? 'WATCHDOG TRIP' : 'NOMINAL (18ms)'}
              </span>
            </div>
            <p style={{ fontSize: '0.72rem', color: faultMode ? '#fca5a5' : '#94a3b8', margin: '3px 0 0 0' }}>
              {faultMode 
                ? 'MCU heartbeat expired. Mechanical DPDT relays dropped open, cutting ESP32 actuation and locking all signal heads into Flashing Yellow (Amber) at 1Hz. Zero collision risk.' 
                : 'Webster delay algorithm streaming to SSR relays via optocouplers. Mechanical CMU conflict interlock prevents conflicting greens.'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handleManualPhaseToggle}
            disabled={faultMode}
            className="btn-secondary"
            style={{
              fontSize: '0.72rem',
              padding: '6px 12px',
              opacity: faultMode ? 0.4 : 1,
              cursor: faultMode ? 'not-allowed' : 'pointer'
            }}
            title="Switch green light between North-South and East-West corridors"
          >
            <RefreshCw size={12} />
            <span>Cycle Phase ({activePhase === 'NS' ? 'N/S Green' : 'E/W Green'})</span>
          </button>

          <button
            onClick={handleToggleFault}
            style={{
              background: faultMode ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 14px',
              fontSize: '0.72rem',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: faultMode ? '0 0 15px rgba(16, 185, 129, 0.4)' : '0 0 15px rgba(239, 68, 68, 0.4)'
            }}
            title="Simulate complete MCU crash or Ghana brownout to verify mechanical CMU fail-safe"
          >
            <Zap size={13} />
            <span>{faultMode ? 'Restore Normal MCU Control' : 'Simulate MCU Crash / Watchdog Trip'}</span>
          </button>
        </div>
      </div>

      {/* SVG Interactive Electrical Schematic Canvas */}
      <div style={{
        background: '#040812',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '14px',
        padding: '16px',
        overflowX: 'auto',
        boxShadow: 'inset 0 0 30px rgba(0, 0, 0, 0.8)'
      }}>
        <svg
          viewBox="0 0 940 450"
          style={{ width: '100%', minWidth: '820px', height: 'auto', display: 'block' }}
        >
          <defs>
            <linearGradient id="mainsGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#d97706" stopOpacity="0.4" />
            </linearGradient>
            <linearGradient id="espGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#0369a1" stopOpacity="0.9" />
            </linearGradient>
            <filter id="glowGreen" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glowAmber" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glowRed" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Grid Background Pattern */}
          <g opacity="0.12">
            {[...Array(20)].map((_, i) => (
              <line key={`vg-${i}`} x1={i * 50} y1="0" x2={i * 50} y2="450" stroke="#00f2fe" strokeWidth="0.5" />
            ))}
            {[...Array(10)].map((_, i) => (
              <line key={`hg-${i}`} x1="0" y1={i * 50} x2="940" y2={i * 50} stroke="#00f2fe" strokeWidth="0.5" />
            ))}
          </g>

          {/* ZONE 1: 230V AC MAINS & CABINET INCOMING (Left) */}
          <g>
            <rect x="20" y="30" width="180" height="390" rx="10" fill="#0b1329" stroke="rgba(245, 158, 11, 0.4)" strokeWidth="1.5" />
            <text x="35" y="55" fill="#fbbf24" fontSize="11" fontWeight="800" fontFamily="monospace">1. 230V AC CABINET</text>
            <text x="35" y="70" fill="#94a3b8" fontSize="9">Legacy Dial Cabinet (1990s)</text>

            {/* 230V Live Incoming Bus */}
            <line x1="40" y1="100" x2="180" y2="100" stroke="#ef4444" strokeWidth="3" />
            <text x="40" y="93" fill="#fca5a5" fontSize="9" fontWeight="700">230V L1 (Phase A Mains)</text>

            <line x1="40" y1="150" x2="180" y2="150" stroke="#3b82f6" strokeWidth="3" />
            <text x="40" y="143" fill="#93c5fd" fontSize="9" fontWeight="700">230V L2 (Phase B Mains)</text>

            <line x1="40" y1="200" x2="180" y2="200" stroke="#64748b" strokeWidth="2" strokeDasharray="4 2" />
            <text x="40" y="193" fill="#94a3b8" fontSize="8">Neutral Return Bus</text>

            {/* Non-Invasive SCT-013 Split-Core Clamps */}
            <g transform="translate(130, 85)">
              <rect x="0" y="0" width="36" height="30" rx="6" fill="#1e40af" stroke="#60a5fa" strokeWidth="1.5" />
              <text x="4" y="18" fill="#fff" fontSize="8" fontWeight="800">CT-01</text>
              <text x="-12" y="44" fill="#38bdf8" fontSize="7.5" fontWeight="700">SCT-013</text>
            </g>
            <g transform="translate(130, 135)">
              <rect x="0" y="0" width="36" height="30" rx="6" fill="#1e40af" stroke="#60a5fa" strokeWidth="1.5" />
              <text x="4" y="18" fill="#fff" fontSize="8" fontWeight="800">CT-02</text>
              <text x="-12" y="44" fill="#38bdf8" fontSize="7.5" fontWeight="700">SCT-013</text>
            </g>

            {/* Non-Invasive Badge */}
            <rect x="32" y="270" width="156" height="65" rx="6" fill="rgba(16, 185, 129, 0.1)" stroke="rgba(16, 185, 129, 0.35)" />
            <text x="40" y="290" fill="#34d399" fontSize="8.5" fontWeight="800">ZERO WIRE SPLICING</text>
            <text x="40" y="306" fill="#94a3b8" fontSize="7.5">• Magnetic core clamp-on</text>
            <text x="40" y="320" fill="#94a3b8" fontSize="7.5">• 0 copper cutting / 15m install</text>

            {/* Mean Well PSU */}
            <rect x="32" y="350" width="156" height="55" rx="6" fill="rgba(245, 158, 11, 0.1)" stroke="rgba(245, 158, 11, 0.3)" />
            <text x="40" y="368" fill="#fbbf24" fontSize="8.5" fontWeight="800">MEAN WELL HDR-15-5</text>
            <text x="40" y="382" fill="#94a3b8" fontSize="7.5">DIN-Rail PSU: 85-264V AC</text>
            <text x="40" y="394" fill="#34d399" fontSize="7.5">Output: 5V DC Isolated Logic</text>
          </g>

          {/* GALVANIC ISOLATION BARRIER (Dashed amber line) */}
          <line x1="220" y1="20" x2="220" y2="430" stroke="#f59e0b" strokeWidth="2" strokeDasharray="6 4" />
          <text x="212" y="220" fill="#fbbf24" fontSize="9" fontWeight="800" transform="rotate(-90 212 220)">
            3,750 Vrms GALVANIC ISOLATION BARRIER (IEC 60947 / UL 1577)
          </text>

          {/* ZONE 2: OPTOCOUPLER STAGE (PC817) */}
          <g>
            <rect x="235" y="80" width="90" height="90" rx="8" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
            <text x="245" y="100" fill="#38bdf8" fontSize="9.5" fontWeight="800">PC817 BANK</text>
            <text x="245" y="115" fill="#94a3b8" fontSize="7.5">4-Ch Opto</text>
            <circle cx="255" cy="135" r="4" fill="#34d399" />
            <text x="265" y="138" fill="#94a3b8" fontSize="7">TX LED</text>
            <circle cx="255" cy="152" r="4" fill="#38bdf8" />
            <text x="265" y="155" fill="#94a3b8" fontSize="7">RX PHOTO</text>

            {/* Traces from CTs to Optos */}
            <line x1="166" y1="100" x2="235" y2="110" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" />
            <line x1="166" y1="150" x2="235" y2="140" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" />
          </g>

          {/* ZONE 3: PULSECITY EDGE COMPUTE (ESP32-S3 + SIM7600G) */}
          <g>
            <rect x="345" y="30" width="220" height="390" rx="10" fill="url(#espGrad)" stroke="#00f2fe" strokeWidth="1.5" />
            <text x="360" y="55" fill="#fff" fontSize="11" fontWeight="900" fontFamily="monospace">2. PULSECITY RETROFIT NODE</text>
            <text x="360" y="70" fill="#bae6fd" fontSize="8.5">ESP32-S3 Dual-Core 240MHz ($340 BOM)</text>

            {/* On-Chip Webster Calculation Core */}
            <rect x="360" y="90" width="190" height="90" rx="8" fill="rgba(0, 0, 0, 0.45)" stroke="rgba(0, 242, 254, 0.4)" />
            <text x="372" y="110" fill="#00f2fe" fontSize="9.5" fontWeight="800">ON-CHIP WEBSTER ENGINE</text>
            <text x="372" y="126" fill="#e0f2fe" fontSize="8">Co = (1.5L + 5) / (1 - Y)</text>
            <text x="372" y="142" fill="#34d399" fontSize="8">
              {faultMode ? 'STATUS: HALTED / BROWN-OUT' : `ACTIVE: ${activePhase === 'NS' ? 'Phase A Green (52s)' : 'Phase B Green (36s)'}`}
            </text>
            <text x="372" y="158" fill="#94a3b8" fontSize="7.5">Sat Flow: 4,800 PCU • Lost Time: 12s</text>
            <text x="372" y="170" fill="#fbbf24" fontSize="7.5">GPRTU Trotro Bias: +14s Weight</text>

            {/* GSM 2G / USSD Modem */}
            <rect x="360" y="195" width="190" height="65" rx="8" fill="rgba(0, 0, 0, 0.45)" stroke="rgba(245, 158, 11, 0.4)" />
            <text x="372" y="215" fill="#fbbf24" fontSize="9" fontWeight="800">SIM7600G CELLULAR / USSD</text>
            <text x="372" y="230" fill="#cbd5e1" fontSize="8">Offline 2G GSM Fallback Engine</text>
            <text x="372" y="246" fill="#34d399" fontSize="7.5">• USSD *920*26# citizen ingest</text>
            <text x="372" y="256" fill="#38bdf8" fontSize="7.5">• Vercel REST Ingest: 12ms latency</text>

            {/* MAX6369 Hardware Watchdog Timer */}
            <rect x="360" y="275" width="190" height="65" rx="8" fill={faultMode ? "rgba(239, 68, 68, 0.4)" : "rgba(0, 0, 0, 0.45)"} stroke={faultMode ? "#ef4444" : "#10b981"} />
            <text x="372" y="295" fill={faultMode ? "#fca5a5" : "#34d399"} fontSize="9" fontWeight="800">MAX6369 HARDWARE WATCHDOG</text>
            <text x="372" y="310" fill="#e2e8f0" fontSize="8">Heartbeat Pulse: 500ms Interval</text>
            <text x="372" y="326" fill={faultMode ? "#ef4444" : "#34d399"} fontSize="8" fontWeight="700">
              {faultMode ? 'PULSE LOST ➔ RELAYS DROPPED' : 'HEARTBEAT OK ➔ RELAY CLOSED'}
            </text>

            {/* Actuation SSR Drivers */}
            <rect x="360" y="355" width="190" height="50" rx="8" fill="rgba(0, 0, 0, 0.45)" stroke="rgba(255, 255, 255, 0.2)" />
            <text x="372" y="375" fill="#fff" fontSize="8.5" fontWeight="800">SOLID STATE RELAY DRIVERS</text>
            <text x="372" y="392" fill="#94a3b8" fontSize="7.5">4-Phase Low-Rds Dry Contacts</text>
          </g>

          {/* ZONE 4: CONFLICT MONITOR UNIT (CMU) HARDWARE INTERLOCK RELAY */}
          <g>
            <rect x="585" y="30" width="175" height="390" rx="10" fill="#0d1527" stroke={faultMode ? "#ef4444" : "rgba(168, 85, 247, 0.5)"} strokeWidth="1.5" />
            <text x="600" y="55" fill="#c084fc" fontSize="11" fontWeight="900" fontFamily="monospace">3. CMU HARDWARE INTERLOCK</text>
            <text x="600" y="70" fill="#94a3b8" fontSize="8">Physical Mechanical DPDT Relays</text>

            {/* Mechanical Relays */}
            <g transform="translate(600, 95)">
              <rect x="0" y="0" width="145" height="60" rx="6" fill="#1e1b4b" stroke={faultMode ? "#ef4444" : "#a855f7"} />
              <text x="10" y="20" fill="#e9d5ff" fontSize="8.5" fontWeight="800">RELAY K1: N/S GREEN</text>
              <line x1="10" y1="35" x2="80" y2={faultMode ? "48" : "35"} stroke={faultMode ? "#ef4444" : "#34d399"} strokeWidth="2" />
              <circle cx="85" cy={faultMode ? "48" : "35"} r="3" fill={faultMode ? "#ef4444" : "#34d399"} />
              <text x="95" y="38" fill="#94a3b8" fontSize="7.5">{faultMode ? 'OPEN' : 'CLOSED'}</text>
            </g>

            <g transform="translate(600, 170)">
              <rect x="0" y="0" width="145" height="60" rx="6" fill="#1e1b4b" stroke={faultMode ? "#ef4444" : "#a855f7"} />
              <text x="10" y="20" fill="#e9d5ff" fontSize="8.5" fontWeight="800">RELAY K2: E/W GREEN</text>
              <line x1="10" y1="35" x2="80" y2={faultMode ? "48" : "35"} stroke={faultMode ? "#ef4444" : "#34d399"} strokeWidth="2" />
              <circle cx="85" cy={faultMode ? "48" : "35"} r="3" fill={faultMode ? "#ef4444" : "#34d399"} />
              <text x="95" y="38" fill="#94a3b8" fontSize="7.5">{faultMode ? 'OPEN' : 'CLOSED'}</text>
            </g>

            {/* Mechanical Cross-Interlock Lockout Bar */}
            <rect x="610" y="245" width="125" height="40" rx="6" fill="rgba(239, 68, 68, 0.15)" stroke="#f87171" strokeWidth="1" />
            <text x="618" y="262" fill="#fca5a5" fontSize="8" fontWeight="800">MECHANICAL INTERLOCK BAR</text>
            <text x="618" y="276" fill="#cbd5e1" fontSize="7">Simultaneous Green Physically Imposs.</text>

            {/* Emergency Hardware Flasher Unit */}
            <g transform="translate(600, 305)">
              <rect x="0" y="0" width="145" height="95" rx="6" fill={faultMode ? "rgba(245, 158, 11, 0.25)" : "rgba(0, 0, 0, 0.4)"} stroke={faultMode ? "#f59e0b" : "rgba(255, 255, 255, 0.2)"} />
              <text x="10" y="20" fill="#fbbf24" fontSize="8.5" fontWeight="800">EMERGENCY FLASHER UNIT</text>
              <text x="10" y="36" fill="#cbd5e1" fontSize="7.5">Passive Solid-State 1Hz Flasher</text>
              <text x="10" y="52" fill={faultMode ? "#fbbf24" : "#64748b"} fontSize="8" fontWeight="700">
                {faultMode ? '⚡ ENERGIZED: FLASHING AMBER' : 'STANDBY: RELAY DISENGAGED'}
              </text>
              <text x="10" y="70" fill="#94a3b8" fontSize="7">• Default state on 0 power</text>
              <text x="10" y="82" fill="#94a3b8" fontSize="7">• Complies with MTTD Act 683</text>
            </g>
          </g>

          {/* ZONE 5: PHYSICAL SIGNAL HEADS (Right) */}
          <g>
            <rect x="780" y="30" width="140" height="390" rx="10" fill="#080d1a" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="1.5" />
            <text x="792" y="55" fill="#fff" fontSize="11" fontWeight="900" fontFamily="monospace">4. SIGNAL HEADS</text>
            <text x="792" y="70" fill="#94a3b8" fontSize="8">Physical Intersection Lights</text>

            {/* Signal Head 1: North / South Approach */}
            <g transform="translate(795, 90)">
              <rect x="0" y="0" width="110" height="135" rx="10" fill="#000" stroke="#334155" strokeWidth="2" />
              <text x="15" y="20" fill="#94a3b8" fontSize="8" fontWeight="700">N/S APPROACH</text>
              {/* Red */}
              <circle cx="55" cy="42" r="14" fill={faultMode ? "#331111" : (activePhase === 'EW' ? "#ef4444" : "#331111")} filter={(!faultMode && activePhase === 'EW') ? "url(#glowRed)" : ""} />
              {/* Amber */}
              <circle cx="55" cy="77" r="14" fill={faultMode ? (amberBlink ? "#f59e0b" : "#332200") : "#332200"} filter={faultMode && amberBlink ? "url(#glowAmber)" : ""} />
              {/* Green */}
              <circle cx="55" cy="112" r="14" fill={faultMode ? "#062816" : (activePhase === 'NS' ? "#10b981" : "#062816")} filter={(!faultMode && activePhase === 'NS') ? "url(#glowGreen)" : ""} />
            </g>

            {/* Signal Head 2: East / West Approach */}
            <g transform="translate(795, 245)">
              <rect x="0" y="0" width="110" height="135" rx="10" fill="#000" stroke="#334155" strokeWidth="2" />
              <text x="15" y="20" fill="#94a3b8" fontSize="8" fontWeight="700">E/W APPROACH</text>
              {/* Red */}
              <circle cx="55" cy="42" r="14" fill={faultMode ? "#331111" : (activePhase === 'NS' ? "#ef4444" : "#331111")} filter={(!faultMode && activePhase === 'NS') ? "url(#glowRed)" : ""} />
              {/* Amber */}
              <circle cx="55" cy="77" r="14" fill={faultMode ? (amberBlink ? "#f59e0b" : "#332200") : "#332200"} filter={faultMode && amberBlink ? "url(#glowAmber)" : ""} />
              {/* Green */}
              <circle cx="55" cy="112" r="14" fill={faultMode ? "#062816" : (activePhase === 'EW' ? "#10b981" : "#062816")} filter={(!faultMode && activePhase === 'EW') ? "url(#glowGreen)" : ""} />
            </g>
          </g>

          {/* Trace connections between modules */}
          <line x1="565" y1="125" x2="600" y2="125" stroke={faultMode ? "#ef4444" : "#00f2fe"} strokeWidth="2" strokeDasharray={faultMode ? "3 3" : ""} />
          <line x1="565" y1="200" x2="600" y2="200" stroke={faultMode ? "#ef4444" : "#00f2fe"} strokeWidth="2" strokeDasharray={faultMode ? "3 3" : ""} />
          <line x1="745" y1="125" x2="795" y2="157" stroke={faultMode ? "#64748b" : (activePhase === 'NS' ? "#10b981" : "#ef4444")} strokeWidth="2" />
          <line x1="745" y1="200" x2="795" y2="312" stroke={faultMode ? "#64748b" : (activePhase === 'EW' ? "#10b981" : "#ef4444")} strokeWidth="2" />
          {faultMode && (
            <>
              <line x1="745" y1="350" x2="795" y2="167" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4 2" />
              <line x1="745" y1="350" x2="795" y2="322" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4 2" />
            </>
          )}
        </svg>
      </div>

      {/* 4-Pillar Engineering Compliance & Rigor Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '12px'
      }}>
        <div style={{
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '10px',
          padding: '12px 14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <CheckCircle2 size={14} color="#34d399" />
            <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#6ee7b7' }}>1. Zero Splicing Legality</span>
          </div>
          <p style={{ fontSize: '0.7rem', color: '#94a3b8', margin: 0, lineHeight: '1.4' }}>
            Non-invasive split-core CT clamps snap over insulated 230V conductors without stripping wire insulation or voiding cabinet warranty.
          </p>
        </div>

        <div style={{
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '10px',
          padding: '12px 14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <Shield size={14} color="#38bdf8" />
            <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#7dd3fc' }}>2. 3,750 Vrms Isolation</span>
          </div>
          <p style={{ fontSize: '0.7rem', color: '#94a3b8', margin: 0, lineHeight: '1.4' }}>
            PC817 optocouplers create an optical air-gap separating 230V AC mains from 3.3V ESP32 logic, completely shielding MCU from Ghana grid voltage surges.
          </p>
        </div>

        <div style={{
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: '10px',
          padding: '12px 14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <Zap size={14} color="#fbbf24" />
            <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#fde68a' }}>3. 18ms Mechanical CMU</span>
          </div>
          <p style={{ fontSize: '0.7rem', color: '#94a3b8', margin: 0, lineHeight: '1.4' }}>
            Hardware interlock relay makes simultaneous double-green physically impossible. On watchdog trip, releases in 18ms to Flashing Yellow.
          </p>
        </div>

        <div style={{
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid rgba(168, 85, 247, 0.3)',
          borderRadius: '10px',
          padding: '12px 14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <Cpu size={14} color="#c084fc" />
            <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#d8b4fe' }}>4. $340 vs $85k Siemens</span>
          </div>
          <p style={{ fontSize: '0.7rem', color: '#94a3b8', margin: 0, lineHeight: '1.4' }}>
            Installed inside existing junction cabinets in 18 minutes by standard roadside municipal electricians. Saves millions in municipal CAPEX.
          </p>
        </div>
      </div>
    </div>
  );
}
