import React, { useState, useEffect } from 'react';
import { 
  Activity, Car, Zap, Wind, Bot, Shield, Trophy, 
  Sparkles, Radio, RefreshCw, Key, AlertTriangle, Layers, Clock 
} from 'lucide-react';
import { 
  CITY_METRICS, TRAFFIC_NODES, ENERGY_NODES, 
  ECO_NODES, PRESET_CRISES 
} from './data/mockCityData';
import CityMap from './components/CityMap';
import TrafficVisionModal from './components/TrafficVisionModal';
import GridGuardOptimizer from './components/GridGuardOptimizer';
import EcoSenseMonitor from './components/EcoSenseMonitor';
import IncidentCommanderChat from './components/IncidentCommanderChat';
import HackathonPitchModal from './components/HackathonPitchModal';

export default function App() {
  // Navigation & View State
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'traffic', 'energy', 'eco', 'commander'
  const [mapLayer, setMapLayer] = useState('all'); // 'all', 'traffic', 'energy', 'eco'
  
  // Real-time Interactive Node States
  const [trafficNodes, setTrafficNodes] = useState(TRAFFIC_NODES);
  const [energyNodes, setEnergyNodes] = useState(ENERGY_NODES);
  const [ecoNodes, setEcoNodes] = useState(ECO_NODES);
  const [selectedNode, setSelectedNode] = useState(null);

  // Modals
  const [visionModalOpen, setVisionModalOpen] = useState(false);
  const [visionModalNode, setVisionModalNode] = useState(null);
  const [pitchModalOpen, setPitchModalOpen] = useState(false);

  // Crisis state
  const [activeCrisis, setActiveCrisis] = useState(null);

  // Gemini API Key from localStorage
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem('pulsecity_gemini_key') || '';
  });

  // GMT Clock
  const [currentTime, setCurrentTime] = useState('');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toUTCString().slice(17, 25) + ' GMT');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Periodic Telemetry Simulation (traffic light cycling and slight flow drift)
  useEffect(() => {
    const interval = setInterval(() => {
      setTrafficNodes((prev) => 
        prev.map((node) => {
          let nextRem = node.cycleRemainingSec - 1;
          let nextLight = node.lightState;
          if (nextRem <= 0) {
            nextLight = node.lightState === 'GREEN' ? 'YELLOW' : node.lightState === 'YELLOW' ? 'RED' : 'GREEN';
            nextRem = nextLight === 'GREEN' ? 35 : nextLight === 'YELLOW' ? 5 : 25;
          }
          return {
            ...node,
            lightState: nextLight,
            cycleRemainingSec: nextRem
          };
        })
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Actions
  const handleApplyTrafficOptimization = (nodeId, newGreenDuration) => {
    setTrafficNodes((prev) =>
      prev.map((n) => {
        if (n.id === nodeId) {
          const reducedCongestion = Math.max(25, n.congestion - 28);
          return {
            ...n,
            congestion: reducedCongestion,
            speedKmh: Math.round(n.speedKmh * 1.45),
            lightState: 'GREEN',
            cycleRemainingSec: newGreenDuration || 45,
            alert: 'AI Green-Wave Active: Queue flushing smoothly'
          };
        }
        return n;
      })
    );
  };

  const handleBalanceGrid = () => {
    setEnergyNodes((prev) =>
      prev.map((n) => {
        if (n.id === 'EN-01') {
          // Achimota BSP stabilized
          return {
            ...n,
            currentLoadMw: 185,
            status: 'NOMINAL',
            dumsorRisk: 14,
            batteryReservePct: 82
          };
        }
        if (n.id === 'EN-03') {
          return {
            ...n,
            currentLoadMw: 160,
            status: 'NOMINAL',
            dumsorRisk: 18
          };
        }
        return n;
      })
    );
  };

  const handleDispatchWasteTruck = (nodeId) => {
    setEcoNodes((prev) =>
      prev.map((n) => {
        if (n.id === nodeId) {
          return {
            ...n,
            wasteLevelPct: 15,
            aqi: Math.max(30, n.aqi - 35),
            status: 'GOOD',
            recommendation: 'Compactor clearance complete. Drainage grating verified unobstructed.'
          };
        }
        return n;
      })
    );
  };

  const handleTriggerScenario = (scenarioId) => {
    const crisis = PRESET_CRISES.find((c) => c.id === scenarioId);
    if (!crisis) return;
    setActiveCrisis(crisis);

    // Apply stress test state to nodes
    if (scenarioId === 'crisis-motorway-pileup') {
      setTrafficNodes((prev) =>
        prev.map((n) => n.id === 'TR-02' ? { ...n, congestion: 98, speedKmh: 4, incidentActive: true } : n)
      );
      setMapLayer('traffic');
    } else if (scenarioId === 'crisis-achimota-dumsor') {
      setEnergyNodes((prev) =>
        prev.map((n) => n.id === 'EN-01' ? { ...n, currentLoadMw: 242, dumsorRisk: 96, status: 'CRITICAL' } : n)
      );
      setMapLayer('energy');
    } else if (scenarioId === 'crisis-makola-waste-flood') {
      setEcoNodes((prev) =>
        prev.map((n) => n.id === 'ECO-03' ? { ...n, wasteLevelPct: 98, aqi: 142, status: 'CRITICAL' } : n)
      );
      setMapLayer('eco');
    }
  };

  const handleResolveCrisis = () => {
    if (!activeCrisis) return;
    if (activeCrisis.id === 'crisis-motorway-pileup') {
      handleApplyTrafficOptimization('TR-02', 60);
    } else if (activeCrisis.id === 'crisis-achimota-dumsor') {
      handleBalanceGrid();
    } else if (activeCrisis.id === 'crisis-makola-waste-flood') {
      handleDispatchWasteTruck('ECO-03');
    }
    setActiveCrisis(null);
  };

  const openVisionForNode = (node) => {
    setVisionModalNode(node);
    setVisionModalOpen(true);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Main Navigation Bar */}
      <header style={{
        background: 'rgba(8, 12, 20, 0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-subtle)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        padding: '12px 24px'
      }}>
        <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Logo & City Identity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #00f2fe 0%, #0284c7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(0, 242, 254, 0.4)'
            }}>
              <Zap size={22} color="#04131f" strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="font-display" style={{ fontSize: '1.25rem', fontWeight: '800', color: '#fff', letterSpacing: '-0.03em' }}>
                  PulseCity <span style={{ color: 'var(--accent-cyan)' }}>AI</span>
                </span>
                <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>
                  Urban Nervous System
                </span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                ACCRA COMMAND // TECH HUB AFRICA 2026
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div style={{ display: 'flex', gap: '6px', background: 'rgba(255, 255, 255, 0.04)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
            <button
              onClick={() => setActiveTab('overview')}
              style={{
                background: activeTab === 'overview' ? 'rgba(0, 242, 254, 0.15)' : 'transparent',
                border: activeTab === 'overview' ? '1px solid var(--accent-cyan)' : '1px solid transparent',
                color: activeTab === 'overview' ? '#fff' : 'var(--text-secondary)',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontFamily: 'var(--font-display)',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Layers size={14} />
              Digital Twin Map
            </button>

            <button
              onClick={() => { setActiveTab('traffic'); setMapLayer('traffic'); }}
              style={{
                background: activeTab === 'traffic' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                border: activeTab === 'traffic' ? '1px solid #38bdf8' : '1px solid transparent',
                color: activeTab === 'traffic' ? '#fff' : 'var(--text-secondary)',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontFamily: 'var(--font-display)',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Car size={14} color="#38bdf8" />
              Traffic Sentinel
            </button>

            <button
              onClick={() => { setActiveTab('energy'); setMapLayer('energy'); }}
              style={{
                background: activeTab === 'energy' ? 'rgba(168, 85, 247, 0.15)' : 'transparent',
                border: activeTab === 'energy' ? '1px solid #a855f7' : '1px solid transparent',
                color: activeTab === 'energy' ? '#fff' : 'var(--text-secondary)',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontFamily: 'var(--font-display)',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Zap size={14} color="#c084fc" />
              GridGuard (Anti-Dumsor)
            </button>

            <button
              onClick={() => { setActiveTab('eco'); setMapLayer('eco'); }}
              style={{
                background: activeTab === 'eco' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                border: activeTab === 'eco' ? '1px solid #10b981' : '1px solid transparent',
                color: activeTab === 'eco' ? '#fff' : 'var(--text-secondary)',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontFamily: 'var(--font-display)',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Wind size={14} color="#34d399" />
              EcoSense
            </button>

            <button
              onClick={() => setActiveTab('commander')}
              style={{
                background: activeTab === 'commander' ? 'rgba(0, 242, 254, 0.15)' : 'transparent',
                border: activeTab === 'commander' ? '1px solid var(--accent-cyan)' : '1px solid transparent',
                color: activeTab === 'commander' ? '#fff' : 'var(--text-secondary)',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontFamily: 'var(--font-display)',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Bot size={14} color="var(--accent-cyan)" />
              Commander Kofi
            </button>
          </div>

          {/* Right Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              <Clock size={13} />
              {currentTime}
            </div>

            <button
              onClick={() => setPitchModalOpen(true)}
              className="btn-primary"
              style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: '#000',
                boxShadow: '0 0 15px rgba(245, 158, 11, 0.4)',
                fontSize: '0.82rem',
                padding: '8px 14px'
              }}
            >
              <Trophy size={15} />
              DoraHacks Pitch Kit
            </button>
          </div>
        </div>
      </header>

      {/* Real-time Impact Metrics Ticker */}
      <section style={{
        background: 'rgba(10, 16, 28, 0.65)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '10px 24px'
      }}>
        <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Car size={16} color="#38bdf8" />
            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Avg Commuter Savings</div>
              <div style={{ fontSize: '0.92rem', fontWeight: 'bold', color: '#fff' }}>+18.5 mins / trip (44% speedup)</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Zap size={16} color="#c084fc" />
            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Anti-Dumsor Resilience</div>
              <div style={{ fontSize: '0.92rem', fontWeight: 'bold', color: '#fff' }}>19 Outages Averted (99.98% Uptime)</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Wind size={16} color="#34d399" />
            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>CO2 Emissions Avoided</div>
              <div style={{ fontSize: '0.92rem', fontWeight: 'bold', color: '#fff' }}>340.2 Metric Tons</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Activity size={16} color="var(--accent-cyan)" />
            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Active Multi-Modal Agents</div>
              <div style={{ fontSize: '0.92rem', fontWeight: 'bold', color: 'var(--accent-cyan)' }}>1,420 IoT Nodes Online</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Dynamic Workspace Area */}
      <main style={{ flex: 1, padding: '24px', maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
        {/* Layer Controls when viewing map */}
        {(activeTab === 'overview' || activeTab === 'traffic' || activeTab === 'energy' || activeTab === 'eco') && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Active Map Layer:</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                {['all', 'traffic', 'energy', 'eco'].map((l) => (
                  <button
                    key={l}
                    onClick={() => setMapLayer(l)}
                    style={{
                      background: mapLayer === l ? 'rgba(0, 242, 254, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                      border: mapLayer === l ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                      color: mapLayer === l ? '#fff' : 'var(--text-secondary)',
                      padding: '4px 12px',
                      borderRadius: '6px',
                      fontSize: '0.74rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      textTransform: 'uppercase'
                    }}
                  >
                    {l === 'all' ? 'All 3 Tracks' : l}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick CCTV button */}
            <button
              onClick={() => openVisionForNode(trafficNodes[0])}
              className="btn-secondary"
              style={{ fontSize: '0.78rem', padding: '6px 14px' }}
            >
              <Sparkles size={14} color="var(--accent-cyan)" />
              Inspect Gemini Vision Feed
            </button>
          </div>
        )}

        {/* Tab 1: Overview & Digital Twin Map Layout */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.9fr 1.1fr', gap: '24px', alignItems: 'start' }}>
            <div>
              <CityMap
                activeLayer={mapLayer}
                trafficNodes={trafficNodes}
                energyNodes={energyNodes}
                ecoNodes={ecoNodes}
                selectedNode={selectedNode}
                onSelectNode={setSelectedNode}
                onOpenVisionModal={openVisionForNode}
                activeCrisis={activeCrisis}
                onResolveCrisis={handleResolveCrisis}
              />
            </div>

            {/* Right Side Tactical Panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '620px' }}>
              <div style={{ flex: 1 }}>
                <IncidentCommanderChat
                  apiKey={apiKey}
                  cityState={{
                    trafficBottlenecks: trafficNodes.filter(n => n.congestion > 70).map(n => n.name).join(', '),
                    gridReserve: '68% (Achimota Substation monitored)',
                    avgAqi: '72 Moderate',
                    activeEmergencies: activeCrisis ? activeCrisis.title : 'None active'
                  }}
                  onTriggerScenario={handleTriggerScenario}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Traffic Sentinel */}
        {activeTab === 'traffic' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px' }}>
            <CityMap
              activeLayer="traffic"
              trafficNodes={trafficNodes}
              energyNodes={energyNodes}
              ecoNodes={ecoNodes}
              selectedNode={selectedNode}
              onSelectNode={setSelectedNode}
              onOpenVisionModal={openVisionForNode}
              activeCrisis={activeCrisis}
              onResolveCrisis={handleResolveCrisis}
            />
            <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <Car size={20} color="#38bdf8" />
                  <h3 style={{ fontSize: '1.2rem', color: '#fff' }}>Adaptive Signal Controller</h3>
                </div>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  Continuous real-time optimization of signal phase durations using Gemini Vision and vehicle flow telemetry.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {trafficNodes.map((node) => (
                    <div key={node.id} style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 'bold', color: '#fff' }}>{node.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Flow: {node.flowRate} v/h • {node.speedKmh} km/h</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          background: node.lightState === 'GREEN' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)',
                          color: node.lightState === 'GREEN' ? '#10b981' : '#f43f5e',
                          fontSize: '0.72rem',
                          fontFamily: 'var(--font-mono)'
                        }}>
                          {node.lightState} ({node.cycleRemainingSec}s)
                        </span>
                        <button
                          onClick={() => openVisionForNode(node)}
                          className="btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                        >
                          CCTV
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: GridGuard (Anti-Dumsor) */}
        {activeTab === 'energy' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px' }}>
            <CityMap
              activeLayer="energy"
              trafficNodes={trafficNodes}
              energyNodes={energyNodes}
              ecoNodes={ecoNodes}
              selectedNode={selectedNode}
              onSelectNode={setSelectedNode}
              onOpenVisionModal={openVisionForNode}
              activeCrisis={activeCrisis}
              onResolveCrisis={handleResolveCrisis}
            />
            <GridGuardOptimizer
              energyNodes={energyNodes}
              onBalanceGrid={handleBalanceGrid}
            />
          </div>
        )}

        {/* Tab 4: EcoSense */}
        {activeTab === 'eco' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px' }}>
            <CityMap
              activeLayer="eco"
              trafficNodes={trafficNodes}
              energyNodes={energyNodes}
              ecoNodes={ecoNodes}
              selectedNode={selectedNode}
              onSelectNode={setSelectedNode}
              onOpenVisionModal={openVisionForNode}
              activeCrisis={activeCrisis}
              onResolveCrisis={handleResolveCrisis}
            />
            <EcoSenseMonitor
              ecoNodes={ecoNodes}
              onDispatchWasteTruck={handleDispatchWasteTruck}
            />
          </div>
        )}

        {/* Tab 5: Incident Commander Full Terminal */}
        {activeTab === 'commander' && (
          <div style={{ height: '700px' }}>
            <IncidentCommanderChat
              apiKey={apiKey}
              cityState={{
                trafficBottlenecks: trafficNodes.filter(n => n.congestion > 70).map(n => n.name).join(', '),
                gridReserve: '68% (Achimota Substation monitored)',
                avgAqi: '72 Moderate',
                activeEmergencies: activeCrisis ? activeCrisis.title : 'None active'
              }}
              onTriggerScenario={handleTriggerScenario}
            />
          </div>
        )}
      </main>

      {/* Vision Modal */}
      {visionModalOpen && (
        <TrafficVisionModal
          selectedNode={visionModalNode}
          allTrafficNodes={trafficNodes}
          onClose={() => setVisionModalOpen(false)}
          onApplyOptimization={handleApplyTrafficOptimization}
          apiKey={apiKey}
          setApiKey={setApiKey}
        />
      )}

      {/* Hackathon Pitch Modal */}
      {pitchModalOpen && (
        <HackathonPitchModal onClose={() => setPitchModalOpen(false)} />
      )}
    </div>
  );
}
