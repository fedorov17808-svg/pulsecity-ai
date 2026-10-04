import React, { useState } from 'react';

export default function FieldOfficerHUD({ isOpen, onClose, onSignalOverride, onBreakerToggle }) {
  const [role, setRole] = useState('mttd'); // 'mttd' | 'ecg'
  const [activeOverride, setActiveOverride] = useState(null);
  const [radioLog, setRadioLog] = useState([
    { id: 1, time: '12:18:02', text: 'MTTD Unit 4: Circling Kwame Nkrumah roundabout. Heavy trotro accumulation.' },
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-zinc-950 border-2 border-amber-500 rounded-3xl shadow-2xl shadow-amber-950/60 flex flex-col overflow-hidden text-zinc-100 font-sans max-h-[95vh]">
        
        {/* Tactical Header */}
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-5 py-3.5 text-zinc-950 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-white animate-pulse"></span>
            <div>
              <h2 className="text-sm font-black tracking-wider uppercase">Field Tactical Terminal v2.6</h2>
              <p className="text-[10px] font-bold text-zinc-900 tracking-tight">DIRECTORATE OF URBAN CRISIS MANAGEMENT</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-950/20 hover:bg-zinc-950/40 text-zinc-950 font-black flex items-center justify-center text-sm transition"
          >
            ✕
          </button>
        </div>

        {/* Agency Switcher */}
        <div className="p-3 bg-zinc-900 border-b border-zinc-800 flex gap-2">
          <button
            onClick={() => setRole('mttd')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              role === 'mttd'
                ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/30'
                : 'bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            🚓 MTTD Traffic Police
          </button>
          <button
            onClick={() => setRole('ecg')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              role === 'ecg'
                ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/30'
                : 'bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            ⚡ ECG Grid Engineering
          </button>
        </div>

        {/* Dynamic Action Notification */}
        {actionNotice && (
          <div className="bg-emerald-500 text-zinc-950 text-xs font-bold px-4 py-2 flex items-center gap-2 animate-bounce">
            <span>🚨</span>
            <span>{actionNotice}</span>
          </div>
        )}

        {/* Main Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {role === 'mttd' ? (
            /* MTTD Traffic Tactical Panel */
            <div className="space-y-4">
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-3.5 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-400">Assigned Junction:</span>
                  <span className="font-mono font-bold text-amber-400">Kwame Nkrumah Circle (TR-01)</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-400">Current Phase State:</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                    NORTH-SOUTH DUAL GREEN (42s)
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-400">Optical Queue Estimate:</span>
                  <span className="font-mono text-rose-400 font-bold">34 Vehicles (94% Saturation)</span>
                </div>
              </div>

              {/* Instant Tactical Action Buttons */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => triggerAction('ALL-RED LOCKDOWN', 'All intersection signals switched to solid RED for VIP escort / accident clearance.')}
                  className="p-3.5 rounded-2xl bg-rose-950/80 border-2 border-rose-500 hover:bg-rose-900 text-rose-200 font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition active:scale-95"
                >
                  <span className="text-xl">🛑</span>
                  <span>FORCE ALL-RED</span>
                  <span className="text-[10px] text-rose-400 font-normal">Accident Clearance</span>
                </button>

                <button
                  onClick={() => {
                    triggerAction('AMBULANCE GREEN WAVE', 'A* Emergency route preempted from Ridge Hospital.');
                    if (onSignalOverride) onSignalOverride('GREEN_WAVE');
                  }}
                  className="p-3.5 rounded-2xl bg-emerald-950/80 border-2 border-emerald-500 hover:bg-emerald-900 text-emerald-200 font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition active:scale-95"
                >
                  <span className="text-xl">🚑</span>
                  <span>TRIGGER GREEN WAVE</span>
                  <span className="text-[10px] text-emerald-400 font-normal">Ridge Hosp. Corridor</span>
                </button>

                <button
                  onClick={() => triggerAction('EXTEND GREEN +25s', 'Webster split extended for heavy northbound trotro surge.')}
                  className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-700 hover:border-amber-400 text-zinc-200 font-bold text-xs flex flex-col items-center justify-center gap-1 transition active:scale-95"
                >
                  <span className="text-lg">⏱️</span>
                  <span>EXTEND GREEN (+25s)</span>
                  <span className="text-[10px] text-zinc-400 font-normal">Northbound Flush</span>
                </button>

                <button
                  onClick={() => triggerAction('FLASHING AMBER', 'Signals degraded to caution flash due to grid instability.')}
                  className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-700 hover:border-amber-400 text-zinc-200 font-bold text-xs flex flex-col items-center justify-center gap-1 transition active:scale-95"
                >
                  <span className="text-lg">⚠️</span>
                  <span>FLASHING AMBER</span>
                  <span className="text-[10px] text-zinc-400 font-normal">Caution Mode</span>
                </button>
              </div>
            </div>
          ) : (
            /* ECG Grid Engineering Tactical Panel */
            <div className="space-y-4">
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-3.5 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-400">Substation:</span>
                  <span className="font-mono font-bold text-amber-400">Achimota Bulk Supply Point (BSP-03)</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-400">Grid Frequency:</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                    49.92 Hz (Within IEC 60034)
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-400">Load Deficit:</span>
                  <span className="font-mono text-amber-400 font-bold">14.0 MW (Moderate Deficit)</span>
                </div>
              </div>

              {/* Physical Circuit Trip Switches */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold uppercase text-zinc-400 tracking-wider">Field SCADA Actuators</div>

                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white">Feeder 4: Industrial Kaneshie</div>
                    <div className="text-[10px] text-zinc-400">Load: 8.5 MW | Tier 2 Priority</div>
                  </div>
                  <button
                    onClick={() => {
                      triggerAction('TRIP FEEDER 4', 'Kaneshie Industrial feeder tripped to prevent frequency collapse.');
                      if (onBreakerToggle) onBreakerToggle('c3');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition active:scale-95"
                  >
                    TRIP BREAKER
                  </button>
                </div>

                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white">Feeder 2: East Legon Residential</div>
                    <div className="text-[10px] text-zinc-400">Load: 12.0 MW | Tier 3 Priority</div>
                  </div>
                  <button
                    onClick={() => {
                      triggerAction('TRIP FEEDER 2', 'East Legon residential circuit shedded via SCADA remote command.');
                      if (onBreakerToggle) onBreakerToggle('c2');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition active:scale-95"
                  >
                    TRIP BREAKER
                  </button>
                </div>

                <div className="p-3 bg-zinc-900/60 border border-emerald-900/60 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-emerald-400">Feeder 1: Ridge Hospital Life Support</div>
                    <div className="text-[10px] text-emerald-500">Tier 1 Sovereign Priority — PROTECTED</div>
                  </div>
                  <span className="px-2.5 py-1 text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">
                    LOCKED ON
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Secure Officer Dispatch Log */}
          <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-3 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-zinc-400 font-bold uppercase">
              <span>Encrypted Field Dispatch Log</span>
              <span className="text-emerald-400 font-mono text-[10px]">APCO-25 VHF Sync</span>
            </div>
            <div className="space-y-1.5 max-h-32 overflow-y-auto text-xs font-mono">
              {radioLog.map((log) => (
                <div key={log.id} className="text-zinc-400 leading-tight">
                  <span className="text-zinc-600">[{log.time}]</span>{' '}
                  <span className="text-zinc-200">{log.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tactical Footer */}
        <div className="bg-zinc-900 px-5 py-3 border-t border-zinc-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="text-zinc-400 text-[11px]">Officer 4082 (Active Session)</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold transition"
          >
            Dismiss HUD
          </button>
        </div>
      </div>
    </div>
  );
}
