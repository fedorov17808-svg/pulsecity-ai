import React, { useState, useEffect } from 'react';
import { 
  Activity, Car, Zap, Wind, Bot, Shield, Trophy, 
  Sparkles, Radio, RefreshCw, Key, AlertTriangle, Layers, Clock, Terminal, Code2,
  Phone, BarChart3, FileText
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
import SensorIngestGateway from './components/SensorIngestGateway';
import HardwareHubModal from './components/HardwareHubModal';
import FieldOfficerHUD from './components/FieldOfficerHUD';
import CitizenUssdModal from './components/CitizenUssdModal';
import BenchmarkModal from './components/BenchmarkModal';
import ExecutiveDossierModal from './components/ExecutiveDossierModal';

export default function App() {
  // Navigation & View State
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'traffic', 'energy', 'eco', 'gateway', 'commander'
  const [mapLayer, setMapLayer] = useState('all'); // 'all', 'traffic', 'energy', 'eco'
  
  // Real-time Interactive Node States with LocalStorage Persistence
  const [trafficNodes, setTrafficNodes] = useState(() => {
    try {
      const saved = localStorage.getItem('pulsecity_traffic_nodes');
      return saved ? JSON.parse(saved) : TRAFFIC_NODES;
    } catch { return TRAFFIC_NODES; }
  });

  const [energyNodes, setEnergyNodes] = useState(() => {
    try {
      const saved = localStorage.getItem('pulsecity_energy_nodes');
      return saved ? JSON.parse(saved) : ENERGY_NODES;
    } catch { return ENERGY_NODES; }
  });

  const [ecoNodes, setEcoNodes] = useState(() => {
    try {
      const saved = localStorage.getItem('pulsecity_eco_nodes');
      return saved ? JSON.parse(saved) : ECO_NODES;
    } catch { return ECO_NODES; }
  });

  const [selectedNode, setSelectedNode] = useState(null);

  // Modals
  const [visionModalOpen, setVisionModalOpen] = useState(false);
  const [visionModalNode, setVisionModalNode] = useState(null);
  const [pitchModalOpen, setPitchModalOpen] = useState(false);
  const [hardwareModalOpen, setHardwareModalOpen] = useState(false);
  const [fieldHudOpen, setFieldHudOpen] = useState(false);
  const [ussdModalOpen, setUssdModalOpen] = useState(false);
  const [benchmarkModalOpen, setBenchmarkModalOpen] = useState(false);
  const [dossierModalOpen, setDossierModalOpen] = useState(false);
  const [opsMenuOpen, setOpsMenuOpen] = useState(false);

  // Crisis state
  const [activeCrisis, setActiveCrisis] = useState(null);

  // Gemini API Key from localStorage
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem('pulsecity_gemini_key') || '';
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('pulsecity_traffic_nodes', JSON.stringify(trafficNodes));
    } catch (e) { console.error('Failed to sync trafficNodes to localStorage', e); }
  }, [trafficNodes]);

  useEffect(() => {
    try {
      localStorage.setItem('pulsecity_energy_nodes', JSON.stringify(energyNodes));
    } catch (e) { console.error('Failed to sync energyNodes to localStorage', e); }
  }, [energyNodes]);

  useEffect(() => {
    try {
      localStorage.setItem('pulsecity_eco_nodes', JSON.stringify(ecoNodes));
    } catch (e) { console.error('Failed to sync ecoNodes to localStorage', e); }
  }, [ecoNodes]);

  // GMT Clock (Accra Local Time)
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

  // Real Ingest API handler (for cURL and live sensor streams)
  const handleIngestTelemetry = (payload) => {
    const { nodeId } = payload;
    if (!nodeId) return;

    if (nodeId.startsWith('TR')) {
      setTrafficNodes((prev) =>
        prev.map((n) => {
          if (n.id === nodeId) {
            return {
              ...n,
              flowRate: payload.flowRateVehiclesPerHour || n.flowRate,
              congestion: payload.congestionPercentage ?? n.congestion,
              incidentActive: payload.incidentDetected ?? n.incidentActive,
              alert: payload.incidentDetails || n.alert,
              ambulancePriority: payload.emergencyTransitActive ?? n.ambulancePriority
            };
          }
          return n;
        })
      );
    } else if (nodeId.startsWith('EN')) {
      setEnergyNodes((prev) =>
        prev.map((n) => {
          if (n.id === nodeId) {
            return {
              ...n,
              currentLoadMw: payload.currentLoadMw ?? n.currentLoadMw,
              dumsorRisk: payload.dumsorRiskScore ?? n.dumsorRisk,
              solarInputMw: payload.solarInputMw ?? n.solarInputMw,
              status: (payload.dumsorRiskScore > 75 || payload.currentLoadMw > 230) ? 'CRITICAL' : 'NOMINAL'
            };
          }
          return n;
        })
      );
    } else if (nodeId.startsWith('ECO')) {
      setEcoNodes((prev) =>
        prev.map((n) => {
          if (n.id === nodeId) {
            return {
              ...n,
              aqi: payload.aqiScore ?? n.aqi,
              pm25: payload.pm25UgM3 ?? n.pm25,
              wasteLevelPct: payload.wasteFillPercentage ?? n.wasteLevelPct,
              status: payload.drainageChokeDetected ? 'CRITICAL' : n.status
            };
          }
          return n;
        })
      );
    }
  };

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
            alert: 'Webster Signal Timing Active: Optimum phase split applied'
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
          return {
            ...n,
            currentLoadMw: 188,
            status: 'NOMINAL',
            dumsorRisk: 14,
            batteryReservePct: 82
          };
        }
        if (n.id === 'EN-03') {
          return {
            ...n,
            currentLoadMw: 162,
            status: 'NOMINAL',
            dumsorRisk: 16
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
      handleApplyTrafficOptimization('TR-02', 65);
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
      {/* World-Class Command Center Header */}
      <header 
        className="notranslate"
        translate="no"
        style={{
        background: 'rgba(6, 10, 18, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        padding: '10px 20px'
      }}>
        <div style={{
          maxWidth: '1600px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap'
        }}>
          {/* Brand Identity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.2) 0%, rgba(14, 165, 233, 0.08) 100%)',
              border: '1px solid rgba(0, 242, 254, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(0, 242, 254, 0.25)'
            }}>
              <Activity size={22} color="var(--accent-cyan)" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.15rem', fontWeight: '800', letterSpacing: '-0.02em', color: '#fff', fontFamily: 'var(--font-display)' }}>
                  PulseCity <span style={{ color: 'var(--accent-cyan)' }}>AI</span>
                </span>
                <span className="badge badge-cyan" style={{ fontSize: '0.62rem', padding: '2px 8px', letterSpacing: '0.05em' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00f2fe', boxShadow: '0 0 8px #00f2fe' }}></span>
                  GAMA MUNICIPAL OS
                </span>
              </div>
              <div style={{ fontSize: '0.68rem', color: '#64748b', letterSpacing: '0.04em', fontFamily: 'var(--font-mono)' }}>
                GREATER ACCRA METROPOLIS // 1,420 EDGE NODES ACTIVE
              </div>
            </div>
          </div>

          {/* Subsystem Navigation Pills */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '4px',
            borderRadius: '12px',
            gap: '4px'
          }}>
            <button
              onClick={() => setActiveTab('overview')}
              className={`pill-tab ${activeTab === 'overview' ? 'active' : ''}`}
            >
              <Layers size={14} />
              GIS Digital Twin
            </button>

            <button
              onClick={() => { setActiveTab('traffic'); setMapLayer('traffic'); }}
              className={`pill-tab ${activeTab === 'traffic' ? 'active' : ''}`}
            >
              <Car size={14} />
              Traffic Sentinel
            </button>

            <button
              onClick={() => { setActiveTab('energy'); setMapLayer('energy'); }}
              className={`pill-tab ${activeTab === 'energy' ? 'active' : ''}`}
            >
              <Zap size={14} />
              GridGuard (Dumsor)
            </button>

            <button
              onClick={() => { setActiveTab('eco'); setMapLayer('eco'); }}
              className={`pill-tab ${activeTab === 'eco' ? 'active' : ''}`}
            >
              <Wind size={14} />
              EcoSense Basin
            </button>

            <button
              onClick={() => setActiveTab('gateway')}
              className={`pill-tab ${activeTab === 'gateway' ? 'active' : ''}`}
            >
              <Terminal size={14} />
              IoT Gateway
            </button>

            <button
              onClick={() => setActiveTab('commander')}
              className={`pill-tab ${activeTab === 'commander' ? 'active' : ''}`}
            >
              <Bot size={14} />
              Commander Kofi
            </button>
          </div>

          {/* Tactical Action Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#64748b', fontFamily: 'var(--font-mono)', marginRight: '4px' }}>
              <Clock size={13} />
              {currentTime}
            </div>

            {/* Public USSD Dialer Button */}
            <button
              onClick={() => setUssdModalOpen(true)}
              style={{
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                color: '#34d399',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontFamily: 'var(--font-display)',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease',
                boxShadow: '0 0 12px rgba(16, 185, 129, 0.15)'
              }}
              title="Citizen GSM USSD (*920*26#) for feature phones & offline SMS"
            >
              <Phone size={13} />
              USSD (*920*26#)
            </button>

            {/* Municipal Operations & Engineering Suite Dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setOpsMenuOpen(!opsMenuOpen)}
                className="btn-secondary"
                style={{
                  padding: '6px 12px',
                  fontSize: '0.78rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: opsMenuOpen ? 'rgba(0, 242, 254, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                  borderColor: opsMenuOpen ? 'var(--accent-cyan)' : 'rgba(255, 255, 255, 0.1)',
                  whiteSpace: 'nowrap'
                }}
                title="Open Municipal Engineering, Firmware, TCO Audit & Executive Dossier"
              >
                <Layers size={13} color="var(--accent-cyan)" />
                Ops Suite ▾
              </button>

              {opsMenuOpen && (
                <div 
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '280px',
                    background: '#090e18',
                    border: '1px solid rgba(0, 242, 254, 0.35)',
                    borderRadius: '14px',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.85), 0 0 25px rgba(0, 242, 254, 0.15)',
                    padding: '8px',
                    zIndex: 2500,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <button
                    onClick={() => { setHardwareModalOpen(true); setOpsMenuOpen(false); }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#e2e8f0',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <Zap size={15} color="#34d399" />
                    <div>
                      <div style={{ fontWeight: '600', color: '#fff' }}>IoT Hardware Suite</div>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>ESP32 C++ & RPi Python ($13.05 BOM)</div>
                    </div>
                  </button>

                  <button
                    onClick={() => { setFieldHudOpen(true); setOpsMenuOpen(false); }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#e2e8f0',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <Shield size={15} color="#fbbf24" />
                    <div>
                      <div style={{ fontWeight: '600', color: '#fff' }}>Field Officer Tactical HUD</div>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Ghana Police MTTD & ECG overrides</div>
                    </div>
                  </button>

                  <button
                    onClick={() => { setBenchmarkModalOpen(true); setOpsMenuOpen(false); }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#e2e8f0',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <BarChart3 size={15} color="#38bdf8" />
                    <div>
                      <div style={{ fontWeight: '600', color: '#fff' }}>TCO & Vendor Benchmark</div>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>PulseCity vs Siemens & SCATS matrix</div>
                    </div>
                  </button>

                  <button
                    onClick={() => { setDossierModalOpen(true); setOpsMenuOpen(false); }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#e2e8f0',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <FileText size={15} color="#c084fc" />
                    <div>
                      <div style={{ fontWeight: '600', color: '#fff' }}>Accra Executive Dossier</div>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Official Municipal Brief (PDF export)</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* DoraHacks Pitch Kit (Hero CTA) */}
            <button
              onClick={() => setPitchModalOpen(true)}
              className="btn-primary"
              style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: '#000',
                boxShadow: '0 0 15px rgba(245, 158, 11, 0.4)',
                fontSize: '0.78rem',
                padding: '6px 14px',
                fontWeight: '700'
              }}
            >
              <Trophy size={14} />
              Pitch Kit
            </button>
          </div>
        </div>
      </header>

      {/* Real-time Impact Metrics Ticker */}
      <section 
        className="notranslate"
        translate="no"
        style={{
        background: 'rgba(10, 16, 28, 0.75)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '8px 24px'
      }}>
        <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Car size={16} color="#38bdf8" />
            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Avg Commuter Savings</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#fff' }}>+18.5 mins / trip (Webster Signal Sync)</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Zap size={16} color="#c084fc" />
            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Anti-Dumsor Resilience</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#fff' }}>19 Outages Averted (Knapsack LP)</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Wind size={16} color="#34d399" />
            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>CO2 Emissions Avoided</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#fff' }}>340.2 Metric Tons</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Activity size={16} color="var(--accent-cyan)" />
            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Active Multi-Modal Agents</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--accent-cyan)' }}>1,420 IoT Nodes Online</div>
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
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Active GIS Layer:</span>
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
                  <h3 style={{ fontSize: '1.2rem', color: '#fff' }}>Webster Adaptive Signal Controller</h3>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  Real-time mathematical Webster formulation (C₀, Saturation Flow, Green Splits) paired with Gemini Multi-Modal Bounding Box Detection.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {trafficNodes.map((node) => (
                    <div key={node.id} style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ fontSize: '0.86rem', fontWeight: 'bold', color: '#fff' }}>{node.name}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Flow: {node.flowRate} v/h • {node.speedKmh} km/h</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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

        {/* Tab 5: Sensor Ingestion API Gateway */}
        {activeTab === 'gateway' && (
          <SensorIngestGateway
            trafficNodes={trafficNodes}
            energyNodes={energyNodes}
            ecoNodes={ecoNodes}
            onIngestTelemetry={handleIngestTelemetry}
          />
        )}

        {/* Tab 6: Incident Commander Full Terminal */}
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

      {/* Institutional Compliance & Standards Strip */}
      <footer style={{
        background: 'rgba(6, 10, 18, 0.95)',
        borderTop: '1px solid var(--border-subtle)',
        padding: '12px 24px',
        fontSize: '0.72rem',
        color: 'var(--text-muted)'
      }}>
        <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
              <strong style={{ color: '#fff' }}>ECG Grid Code 2020:</strong> Compliant (Underfrequency Load Shedding Part 4.2)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#38bdf8', display: 'inline-block' }}></span>
              <strong style={{ color: '#fff' }}>AMA Urban Drainage:</strong> Bylaw 2018 (Odaw Catchment Sluice Standard)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fbbf24', display: 'inline-block' }}></span>
              <strong style={{ color: '#fff' }}>MTTD Act 683:</strong> Emergency Medical Vehicle Priority Protocol
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontFamily: 'var(--font-mono)' }}>
            <span style={{ color: 'var(--accent-cyan)' }}>Vercel Edge API: 200 OK</span>
            <span>•</span>
            <span>DoraHacks AI & Smart City 2026 Submission</span>
          </div>
        </div>
      </footer>

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

      {/* IoT Hardware & Firmware Suite Modal */}
      <HardwareHubModal
        isOpen={hardwareModalOpen}
        onClose={() => setHardwareModalOpen(false)}
      />

      {/* Mobile Field Officer Tactical HUD */}
      <FieldOfficerHUD
        isOpen={fieldHudOpen}
        onClose={() => setFieldHudOpen(false)}
        onSignalOverride={(type) => {
          if (type === 'GREEN_WAVE') {
            setTrafficNodes((prev) =>
              prev.map((n) => (n.id === 'TR-01' || n.id === 'TR-02' ? { ...n, lightState: 'GREEN', ambulancePriority: true } : n))
            );
          }
        }}
        onBreakerToggle={(circuitId) => {
          setEnergyNodes((prev) =>
            prev.map((n) => n.id === 'EN-01' ? { ...n, currentLoadMw: Math.max(140, n.currentLoadMw - 25), dumsorRisk: 12 } : n)
          );
        }}
      />

      {/* Citizen USSD Simulator (*920*26#) */}
      <CitizenUssdModal
        isOpen={ussdModalOpen}
        onClose={() => setUssdModalOpen(false)}
        trafficNodes={trafficNodes}
        energyNodes={energyNodes}
        ecoNodes={ecoNodes}
      />

      {/* Competitive Benchmark & TCO Matrix */}
      <BenchmarkModal
        isOpen={benchmarkModalOpen}
        onClose={() => setBenchmarkModalOpen(false)}
      />

      {/* Official Accra Municipal Assembly Executive Dossier */}
      <ExecutiveDossierModal
        isOpen={dossierModalOpen}
        onClose={() => setDossierModalOpen(false)}
      />
    </div>
  );
}
