import React, { useState } from 'react';
import { Phone, MessageSquare, Radio, Shield, Send, ArrowLeft, RefreshCw, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function CitizenUssdModal({ isOpen, onClose, trafficNodes, energyNodes, ecoNodes }) {
  const [ussdStep, setUssdStep] = useState('DIALER'); // 'DIALER', 'MENU', 'TRAFFIC', 'DUMSOR', 'FLOOD', 'REPORT', 'REPORT_CONFIRM'
  const [dialNumber, setDialNumber] = useState('*920*26#');
  const [reportText, setReportText] = useState('');
  const [activeSession, setActiveSession] = useState(false);

  if (!isOpen) return null;

  const handleDial = () => {
    if (dialNumber.trim() === '*920*26#' || dialNumber.trim() === '*920#') {
      setActiveSession(true);
      setUssdStep('MENU');
    } else {
      alert("Invalid MMI code. Dial *920*26# for PulseCity Accra.");
    }
  };

  const handleKeyPress = (num) => {
    if (ussdStep === 'DIALER') {
      setDialNumber(prev => prev + num);
    } else if (ussdStep === 'MENU') {
      if (num === '1') setUssdStep('TRAFFIC');
      else if (num === '2') setUssdStep('DUMSOR');
      else if (num === '3') setUssdStep('FLOOD');
      else if (num === '4') setUssdStep('REPORT');
    }
  };

  const handleReportSubmit = (e) => {
    e.preventDefault();
    if (!reportText.trim()) return;
    setUssdStep('REPORT_CONFIRM');
    confetti({ particleCount: 35, spread: 50, origin: { y: 0.7 } });
    setTimeout(() => {
      setReportText('');
    }, 4000);
  };

  const resetSession = () => {
    setUssdStep('DIALER');
    setDialNumber('*920*26#');
    setActiveSession(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-zinc-950 border border-emerald-500/40 rounded-3xl shadow-2xl shadow-emerald-950/50 flex flex-col overflow-hidden text-zinc-100">
        
        {/* Header */}
        <div className="px-5 py-3.5 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Phone size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                Public Citizen USSD Gateway
                <span className="px-1.5 py-0.2 text-[10px] rounded bg-emerald-500/20 text-emerald-300 font-mono">*920*26#</span>
              </h3>
              <p className="text-[11px] text-zinc-400">Offline-capable telecom service for all phones in Ghana (MTN/Telecel)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center text-xs transition"
          >
            ✕
          </button>
        </div>

        {/* Feature Phone Screen Simulation */}
        <div className="p-5 flex flex-col items-center">
          <div className="w-full max-w-[340px] bg-[#0c1f15] border-2 border-emerald-500/60 rounded-2xl p-4 font-mono shadow-inner text-emerald-400 text-xs min-h-[220px] flex flex-col justify-between">
            
            {/* Screen Content */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] text-emerald-600 border-b border-emerald-900/60 pb-1">
                <span>MTN GH // 4G/2G</span>
                <span>{new Date().toLocaleTimeString().slice(0, 5)} GMT</span>
              </div>

              {ussdStep === 'DIALER' && (
                <div className="text-center py-8 space-y-2">
                  <div className="text-[10px] text-emerald-500 uppercase tracking-widest">Dial MMI Code</div>
                  <div className="text-xl font-bold tracking-wider text-emerald-300 bg-emerald-950/60 py-2 rounded-lg border border-emerald-800">
                    {dialNumber || "_"}
                  </div>
                  <div className="text-[10px] text-emerald-600">Free municipal service. No data bundle required.</div>
                </div>
              )}

              {ussdStep === 'MENU' && (
                <div className="space-y-1.5 animate-fadeIn">
                  <div className="font-bold text-emerald-300 border-b border-emerald-900 pb-1">
                    === PULSECITY ACCRA LIVE ===
                  </div>
                  <div className="text-emerald-400">1. Traffic & Trotro Congestion</div>
                  <div className="text-emerald-400">2. ECG Dumsor Grid Status</div>
                  <div className="text-emerald-400">3. Odaw River Flood Safety</div>
                  <div className="text-emerald-400">4. Report Drainage Blockage</div>
                  <div className="text-emerald-600 pt-2 text-[10px]">Press 1-4 on keypad below</div>
                </div>
              )}

              {ussdStep === 'TRAFFIC' && (
                <div className="space-y-1.5 animate-fadeIn text-[11px]">
                  <div className="font-bold text-emerald-300 border-b border-emerald-900 pb-1">
                    [TRAFFIC RADAR - ACCRA]
                  </div>
                  <div>• Circle: 78% heavy. Trotro queue on flyover slip.</div>
                  <div>• Motorway Toll: 91% incident. Avoid Lane 2.</div>
                  <div>• Airport Bypass: 35% smooth wave.</div>
                  <div className="text-emerald-500 pt-1 text-[10px]">Webster Signal Optimization: Active (+18m saved)</div>
                </div>
              )}

              {ussdStep === 'DUMSOR' && (
                <div className="space-y-1.5 animate-fadeIn text-[11px]">
                  <div className="font-bold text-emerald-300 border-b border-emerald-900 pb-1">
                    [ECG DUMSOR RADAR]
                  </div>
                  <div>• Frequency: 49.92 Hz (Within IEC Standard).</div>
                  <div>• Ridge Trauma Hub: Priority A (100% Protected).</div>
                  <div>• Achimota Feeder: Backed by 35MW Legon Solar BESS.</div>
                  <div className="text-emerald-500 pt-1 text-[10px]">No rolling blackouts scheduled for your zone.</div>
                </div>
              )}

              {ussdStep === 'FLOOD' && (
                <div className="space-y-1.5 animate-fadeIn text-[11px]">
                  <div className="font-bold text-emerald-300 border-b border-emerald-900 pb-1">
                    [ODAW RIVER BASIN HYDRO]
                  </div>
                  <div>• Water Level: 2.15m (Below 3.0m Danger Mark).</div>
                  <div>• Korle Lagoon Sluice Gates: 45% Flow.</div>
                  <div>• Safe Evacuation Corridor: Ring Road North.</div>
                  <div className="text-emerald-500 pt-1 text-[10px]">AMA Sluices automated. Normal basin flow.</div>
                </div>
              )}

              {ussdStep === 'REPORT' && (
                <div className="space-y-2 animate-fadeIn text-[11px]">
                  <div className="font-bold text-emerald-300">
                    [REPORT DRAIN CHOKE / TRASH]
                  </div>
                  <p className="text-[10px] text-emerald-500">Enter location & issue for AMA Compactor dispatch:</p>
                  <form onSubmit={handleReportSubmit} className="space-y-2">
                    <input
                      type="text"
                      placeholder="e.g. Makola Market culvert choked"
                      value={reportText}
                      onChange={(e) => setReportText(e.target.value)}
                      className="w-full bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-xs p-1.5 rounded focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="w-full py-1 bg-emerald-600 hover:bg-emerald-500 text-black font-bold rounded text-xs transition"
                    >
                      Send Incident SMS
                    </button>
                  </form>
                </div>
              )}

              {ussdStep === 'REPORT_CONFIRM' && (
                <div className="text-center py-4 space-y-2 animate-fadeIn">
                  <CheckCircle2 size={24} className="mx-auto text-emerald-400" />
                  <div className="font-bold text-emerald-300">REPORT TRANSMITTED</div>
                  <div className="text-[10px] text-emerald-500">
                    Ticket #AMA-8492 logged. Compactor truck crew routed to zone. Thank you for keeping Accra clean!
                  </div>
                </div>
              )}
            </div>

            {/* Back / Reset Footer */}
            {ussdStep !== 'DIALER' && (
              <div className="pt-2 border-t border-emerald-900/60 flex justify-between text-[10px]">
                <button
                  onClick={() => setUssdStep('MENU')}
                  className="text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <ArrowLeft size={10} /> Main Menu
                </button>
                <button
                  onClick={resetSession}
                  className="text-emerald-600 hover:text-emerald-400"
                >
                  End Session
                </button>
              </div>
            )}
          </div>

          {/* Keypad */}
          <div className="w-full max-w-[340px] mt-4 grid grid-cols-3 gap-2 text-sm font-bold">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((k) => (
              <button
                key={k}
                onClick={() => handleKeyPress(k)}
                className="py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 active:scale-95 transition flex flex-col items-center justify-center"
              >
                <span>{k}</span>
                <span className="text-[8px] text-zinc-500 font-normal">
                  {k === '1' ? 'TRAFFIC' : k === '2' ? 'DUMSOR' : k === '3' ? 'FLOOD' : k === '4' ? 'REPORT' : ''}
                </span>
              </button>
            ))}
          </div>

          {/* Action Call Button */}
          {ussdStep === 'DIALER' ? (
            <button
              onClick={handleDial}
              className="w-full max-w-[340px] mt-3 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 transition active:scale-95"
            >
              <Phone size={16} /> Dial *920*26# (Free USSD)
            </button>
          ) : (
            <button
              onClick={resetSession}
              className="w-full max-w-[340px] mt-3 py-2 rounded-2xl bg-rose-900/50 hover:bg-rose-900 text-rose-300 font-bold text-xs flex items-center justify-center gap-2 transition"
            >
              Disconnect Call
            </button>
          )}
        </div>

        {/* Footer info */}
        <div className="px-5 py-2.5 bg-zinc-900 border-t border-zinc-800 text-[11px] text-zinc-400 flex items-center justify-between">
          <span>In Partnership with National Communications Authority (NCA Ghana)</span>
          <span className="text-emerald-400 font-mono">Zero Data Toll</span>
        </div>
      </div>
    </div>
  );
}
