import React, { useState } from 'react';
import { Trophy, Check, X, Shield, Cpu, Radio, DollarSign, Zap, Download } from 'lucide-react';

export default function BenchmarkModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('comparison'); // 'comparison', 'lorawan', 'roi'

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-zinc-950 border border-cyan-500/40 rounded-3xl shadow-2xl shadow-cyan-950/50 flex flex-col overflow-hidden text-zinc-100">
        
        {/* Header */}
        <div className="px-6 py-4 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Trophy size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Competitive Benchmark & LoRaWAN TCO Audit</h3>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Total Cost of Ownership Analysis
                </span>
              </div>
              <p className="text-xs text-zinc-400">Why legacy Western smart city vendors fail in African megacities</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center text-xs transition"
          >
            ✕
          </button>
        </div>

        {/* Tab switch */}
        <div className="px-6 py-2.5 bg-zinc-950/80 border-b border-zinc-800 flex gap-2 text-xs">
          <button
            onClick={() => setActiveTab('comparison')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              activeTab === 'comparison'
                ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                : 'bg-zinc-900 text-zinc-400 hover:text-white'
            }`}
          >
            System Comparison Matrix
          </button>
          <button
            onClick={() => setActiveTab('lorawan')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              activeTab === 'lorawan'
                ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                : 'bg-zinc-900 text-zinc-400 hover:text-white'
            }`}
          >
            LoRaWAN 868MHz Mesh Architecture
          </button>
          <button
            onClick={() => setActiveTab('roi')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              activeTab === 'roi'
                ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                : 'bg-zinc-900 text-zinc-400 hover:text-white'
            }`}
          >
            Municipal ROI & Savings
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {activeTab === 'comparison' && (
            <div className="space-y-4">
              <div className="border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-900/40">
                <table className="w-full text-left">
                  <thead className="bg-zinc-900 text-zinc-300 border-b border-zinc-800 text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Evaluation Criteria</th>
                      <th className="py-3 px-4 text-cyan-400 font-bold bg-cyan-950/20">PulseCity AI (Ghana)</th>
                      <th className="py-3 px-4 text-zinc-400">Siemens Sitraffic / SCOOT</th>
                      <th className="py-3 px-4 text-zinc-400">Tyco SCATS (Australia)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                    <tr>
                      <td className="py-3 px-4 font-medium text-white">Unit Sensor CapEx</td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400 bg-cyan-950/10">$13.05 USD</td>
                      <td className="py-3 px-4 font-mono text-rose-400">$45,000+ USD</td>
                      <td className="py-3 px-4 font-mono text-rose-400">$60,000+ USD</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-medium text-white">Dumsor Blackout Resilience</td>
                      <td className="py-3 px-4 text-emerald-400 bg-cyan-950/10 flex items-center gap-1.5">
                        <Check size={14} /> 36-hr Solar LiFePO4
                      </td>
                      <td className="py-3 px-4 text-rose-400 flex items-center gap-1">
                        <X size={14} /> Fails instantly
                      </td>
                      <td className="py-3 px-4 text-rose-400 flex items-center gap-1">
                        <X size={14} /> Requires AC grid
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-medium text-white">Backhaul Telecom Needs</td>
                      <td className="py-3 px-4 text-emerald-400 bg-cyan-950/10">
                        LoRaWAN 868MHz Mesh (Zero SIM cost)
                      </td>
                      <td className="py-3 px-4 text-zinc-400">Dedicated Underground Fiber</td>
                      <td className="py-3 px-4 text-zinc-400">High-Cost Cellular APN</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-medium text-white">Multi-Pillar Integration</td>
                      <td className="py-3 px-4 text-emerald-400 bg-cyan-950/10">
                        Traffic + Power Grid + Flood Basin
                      </td>
                      <td className="py-3 px-4 text-zinc-500">Traffic signals only</td>
                      <td className="py-3 px-4 text-zinc-500">Traffic signals only</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-medium text-white">Informal Transit (Trotros)</td>
                      <td className="py-3 px-4 text-emerald-400 bg-cyan-950/10">
                        Native PCU Webster calibration
                      </td>
                      <td className="py-3 px-4 text-rose-400">Assumes rigid lane discipline</td>
                      <td className="py-3 px-4 text-rose-400">Assumes standard car lengths</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-medium text-white">Citizen Access (Feature Phones)</td>
                      <td className="py-3 px-4 text-emerald-400 bg-cyan-950/10">
                        Free USSD (*920*26#) + SMS
                      </td>
                      <td className="py-3 px-4 text-zinc-500">None (Internal control room)</td>
                      <td className="py-3 px-4 text-zinc-500">None</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'lorawan' && (
            <div className="space-y-4">
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 space-y-2">
                <h4 className="text-sm font-bold text-cyan-400">Solving the 1,420 SIM Card Telecom Dilemma</h4>
                <p className="text-zinc-300 leading-relaxed">
                  In Accra, provisioning 1,420 dedicated 4G LTE SIM cards from MTN Ghana would cost $18,460 USD annually in recurring mobile data tariffs. PulseCity AI eliminates 98% of this cost via <strong>LoRaWAN 868 MHz ISM Band Mesh Networking</strong>:
                </p>
                <div className="grid grid-cols-3 gap-3 pt-2 text-center">
                  <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                    <div className="font-bold text-emerald-400 text-sm">15 km</div>
                    <div className="text-[10px] text-zinc-400">Urban RF Line of Sight</div>
                  </div>
                  <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                    <div className="font-bold text-cyan-400 text-sm">$0.00 / month</div>
                    <div className="text-[10px] text-zinc-400">Cellular Data Toll</div>
                  </div>
                  <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                    <div className="font-bold text-amber-400 text-sm">SX1276 Transceiver</div>
                    <div className="text-[10px] text-zinc-400">Integrated $1.80 Module</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'roi' && (
            <div className="space-y-4">
              <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-4">
                <h4 className="text-sm font-bold text-emerald-400 mb-2">Annual Municipal Economic Impact (AMA & ECG)</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800">
                    <div className="text-base font-extrabold text-white font-mono">$3.4M USD</div>
                    <div className="text-[10px] text-zinc-400">Commuter Fuel Savings</div>
                  </div>
                  <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800">
                    <div className="text-base font-extrabold text-white font-mono">$1.1M USD</div>
                    <div className="text-[10px] text-zinc-400">Transformer Overload Protection</div>
                  </div>
                  <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800">
                    <div className="text-base font-extrabold text-white font-mono">18,500 Tons</div>
                    <div className="text-[10px] text-zinc-400">CO2 Emissions Averted</div>
                  </div>
                  <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800">
                    <div className="text-base font-extrabold text-emerald-400 font-mono">&lt; 3.2 Months</div>
                    <div className="text-[10px] text-zinc-400">Municipal Payback Period</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between text-xs">
          <span className="text-zinc-400">Independent Benchmark vs ISO 37120 Smart City Key Performance Indicators</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition"
          >
            Close Benchmark
          </button>
        </div>
      </div>
    </div>
  );
}
