import React, { useState, useEffect, useRef } from 'react';
import {
  Activity, Car, Bot, Shield, Sparkles, Clock, Terminal, BarChart3, Volume2, VolumeX, AlertTriangle, Siren
} from 'lucide-react';
import { TRAFFIC_NODES, PRESET_CRISES } from './data/mockCityData';
import CityMap from './components/CityMap';
import TrafficVisionModal from './components/TrafficVisionModal';
import SensorIngestGateway from './components/SensorIngestGateway';
import FieldOfficerHUD from './components/FieldOfficerHUD';
import GeminiConfigModal from './components/GeminiConfigModal';
import CyberGridBackdrop from './components/CyberGridBackdrop';
import QuickIngestModal from './components/QuickIngestModal';
import IntersectionOptimizerPanel from './components/IntersectionOptimizerPanel';
import TrotroFlowHeroWidget from './components/TrotroFlowHeroWidget';
import AssistantChat from './components/AssistantChat';
import { calculateWebsterSignalTiming, compareFixedVsWebster } from './utils/websterAlgorithm';

// Two-phase model of an intersection: the measured approach plus a cross street.
// The cross-street share (42 %) is an assumption until per-approach counts exist.
const CROSS_FLOW_SHARE = 0.42;
function signalPhasesFor(node) {
  const flow = node.flowRate || 0;
  const sat = node.saturationFlow || 1800;
  return [
    { name: `${node.name} main approach`, flowRate: flow, saturationFlow: sat },
    { name: `${node.name} cross street`, flowRate: Math.round(flow * CROSS_FLOW_SHARE), saturationFlow: sat }
  ];
}

const formatDelay = (sec) => (sec === null ? 'oversaturated' : `${sec.toFixed(1)} s/veh`);
import { recordTelemetryPacket } from './services/telemetryStore';
import { sfx } from './utils/soundEffects';
import gsap from 'gsap';

export default function App() {
  // Navigation & View State
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'traffic' | 'gateway' | 'assistant'
  const [mapLayer, setMapLayer] = useState('traffic'); // 'traffic' | 'all'
  
  // Real-time Interactive Node States with LocalStorage Persistence
  const [trafficNodes, setTrafficNodes] = useState(() => {
    try {
      const saved = localStorage.getItem('pulsecity_traffic_nodes');
      return saved ? JSON.parse(saved) : TRAFFIC_NODES;
    } catch { return TRAFFIC_NODES; }
  });

  const [selectedNode, setSelectedNode] = useState(null);

  // Modals
  const [visionModalOpen, setVisionModalOpen] = useState(false);
  const [visionModalNode, setVisionModalNode] = useState(null);
  const [fieldHudOpen, setFieldHudOpen] = useState(false);
  const [geminiModalOpen, setGeminiModalOpen] = useState(false);
  const [quickIngestModalOpen, setQuickIngestModalOpen] = useState(false);
  const [sfxMuted, setSfxMuted] = useState(() => sfx.muted);

  // Layout & Animation Refs
  const workspaceRef = useRef(null);
  const crisisBannerRef = useRef(null);
  const processedPktIdsRef = useRef(new Set());

  const toggleAudio = () => {
    const nextMuted = sfx.toggleMute();
    setSfxMuted(nextMuted);
    if (!nextMuted) {
      sfx.click();
    }
  };

  // Crisis state
  const [activeCrisis, setActiveCrisis] = useState(null);

  // Gemini API Key from localStorage
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem('pulsecity_gemini_key') || '';
  });

  // Autonomous Actuator & External Hardware Telemetry State
  const [externalWaveTrigger, setExternalWaveTrigger] = useState(null);
  const [lastExternalIngestToast, setLastExternalIngestToast] = useState(null);
  const [ingestPacketCount, setIngestPacketCount] = useState(0);

  // Telemetry sync: process events stored by /api/telemetry/ingest
  useEffect(() => {
    let isMounted = true;
    let eventSource = null;

    const processPacket = (newest, silent = false) => {
      if (!newest) return;
      const key = newest.id || `${newest.receivedAt}_${newest.nodeId}`;
      if (processedPktIdsRef.current.has(key)) return;
      processedPktIdsRef.current.add(key);

      // Shared actions (e.g. a green wave started in another browser); old ones are not replayed
      if (newest.nodeId === 'GLOBAL_ACTION' && newest.actionType) {
        if (silent) return;
        if (newest.actionType === 'DISPATCH_GREEN_WAVE') {
          setExternalWaveTrigger({
            origin: newest.actionPayload?.origin || 'N-CIRCLE',
            dest: newest.actionPayload?.dest || 'N-37MIL',
            id: Date.now()
          });
          handleApplyTrafficOptimization('TR-01', 90);
        } else if (newest.actionType === 'CRISIS_TRIGGER') {
          handleTriggerScenario(newest.actionPayload?.scenarioId || 'crisis-motorway-pileup');
        }
        return;
      }

      handleIngestTelemetry(newest);
      if (silent) return;
      setIngestPacketCount((c) => c + 1);
      sfx.alert();
      setLastExternalIngestToast({
        nodeId: newest.nodeId,
        summary: newest.incidentDetails || `Live Ingest: ${newest.congestionPercentage !== undefined ? newest.congestionPercentage + '% Congestion' : 'Telemetry Packet Received'}`,
        receivedAt: newest.receivedAt || new Date().toISOString()
      });

      setTimeout(() => {
        if (isMounted) setLastExternalIngestToast(null);
      }, 6000);
    };

    // Poll the latest stored events every 3 s. Events already in the database when
    // the page opens update the map silently; only new ones count as "received".
    let isFirstPoll = true;
    const pollTelemetry = async () => {
      try {
        const res = await fetch('/api/telemetry/ingest');
        if (!res.ok) return;
        const data = await res.json();
        (data.recentEvents || []).forEach((evt) => processPacket(evt, isFirstPoll));
        isFirstPoll = false;
      } catch {
        // offline or storage not configured; try again on the next tick
      }
    };

    pollTelemetry();
    const interval = setInterval(pollTelemetry, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // GSAP: Animate workspace on activeTab changes
  useEffect(() => {
    if (workspaceRef.current) {
      gsap.fromTo(
        workspaceRef.current,
        { opacity: 0.35, y: 12 },
        { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }
      );
    }
  }, [activeTab]);

  // GSAP: Animate crisis banner & play alarm on activeCrisis
  useEffect(() => {
    if (activeCrisis) {
      sfx.alarm();
      if (crisisBannerRef.current) {
        gsap.fromTo(
          crisisBannerRef.current,
          { scale: 0.95, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.45, ease: 'back.out(1.7)' }
        );
      }
    }
  }, [activeCrisis]);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('pulsecity_traffic_nodes', JSON.stringify(trafficNodes));
    } catch (e) { console.error('Failed to sync trafficNodes to localStorage', e); }
  }, [trafficNodes]);

  // Global ESC key listener to close modals & menus
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setFieldHudOpen(false);
        setQuickIngestModalOpen(false);
        setGeminiModalOpen(false);
        setVisionModalOpen(false);
        setVisionModalNode(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  // Webster-Synchronized Real-Time Traffic Light Cycle
  useEffect(() => {
    const interval = setInterval(() => {
      setTrafficNodes((prev) => 
        prev.map((node) => {
          let nextRem = node.cycleRemainingSec - 1;
          let nextLight = node.lightState;
          let websterMeta = node.websterTiming;

          if (nextRem <= 0) {
            const webster = calculateWebsterSignalTiming({
              phases: signalPhasesFor(node),
              lostTimePerPhase: 4,
              maxCycleLength: 120,
              minCycleLength: 40
            });

            websterMeta = {
              optimalCycle: webster.optimumCycleLengthSeconds,
              effectiveGreen: webster.phases[0].effectiveGreenSeconds,
              totalFlowRatioY: webster.totalFlowRatio_Y,
              estimatedDelaySec: webster.phases[0].estimatedDelaySecPerVehicle
            };

            const greenSec = websterMeta.effectiveGreen;
            const redSec = Math.max(16, websterMeta.optimalCycle - greenSec - 4);

            if (node.lightState === 'GREEN') {
              nextLight = 'YELLOW';
              nextRem = 4;
            } else if (node.lightState === 'YELLOW') {
              nextLight = 'RED';
              nextRem = redSec;
            } else {
              nextLight = 'GREEN';
              nextRem = greenSec;
            }
          }

          return {
            ...node,
            lightState: nextLight,
            cycleRemainingSec: nextRem,
            websterTiming: websterMeta
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
    recordTelemetryPacket(payload);
    sfx.scan();

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
              ambulancePriority: payload.emergencyTransitActive ?? n.ambulancePriority,
              simulated: false
            };
          }
          return n;
        })
      );
    }
  };

  // Actions
  // Applies a signal plan to the simulated controller. It does not invent an effect
  // on congestion or speed; the expected benefit is the computed delay comparison.
  const handleApplyTrafficOptimization = (nodeId, newGreenDuration) => {
    sfx.success();
    setTrafficNodes((prev) =>
      prev.map((n) => {
        if (n.id === nodeId) {
          return {
            ...n,
            lightState: 'GREEN',
            cycleRemainingSec: newGreenDuration || 45,
            alert: 'Webster plan applied (simulated controller)'
          };
        }
        return n;
      })
    );
  };

  const handleTriggerScenario = (scenarioId) => {
    const crisis = PRESET_CRISES.find((c) => c.id === scenarioId);
    if (!crisis) return;
    sfx.alarm();
    setActiveCrisis(crisis);

    if (scenarioId === 'crisis-motorway-pileup') {
      setTrafficNodes((prev) =>
        prev.map((n) => n.id === 'TR-02' ? { ...n, congestion: 98, speedKmh: 4, incidentActive: true } : n)
      );
      setMapLayer('traffic');
    }
  };

  // Clean startup without intrusive countdowns
  useEffect(() => {
    // Grounded TOC mode ready
  }, []);

  const handleResolveCrisis = () => {
    if (!activeCrisis) return;
    sfx.success();
    if (activeCrisis.id === 'crisis-motorway-pileup') {
      handleApplyTrafficOptimization('TR-02', 65);
    }
    setActiveCrisis(null);
  };

  // Autonomous Agent Actuator Execution Handler
  const handleExecuteAgentTool = (toolCall) => {
    if (!toolCall) return;

    if (toolCall.name === 'DISPATCH_GREEN_WAVE') {
      sfx.alarm();
      setActiveTab('overview');
      setExternalWaveTrigger({
        origin: toolCall.params?.origin || 'N-CIRCLE',
        dest: toolCall.params?.dest || 'N-37MIL',
        id: Date.now()
      });
      handleApplyTrafficOptimization('TR-01', 90);
    } else if (toolCall.name === 'OVERRIDE_TRAFFIC_LIGHT') {
      const targetId = toolCall.params?.nodeId || 'TR-01';
      handleApplyTrafficOptimization(targetId, toolCall.params?.durationSec || 75);
    }
  };

  const handleLaunchGreenWave = () => {
    sfx.alarm();
    setActiveTab('overview');
    setMapLayer('traffic');
    setExternalWaveTrigger({
      origin: 'N-CIRCLE',
      dest: 'N-37MIL',
      id: Date.now()
    });
    handleApplyTrafficOptimization('TR-01', 90);
  };

  const openVisionForNode = (node) => {
    setVisionModalNode(node);
    setVisionModalOpen(true);
  };

  const ribbonNode = trafficNodes[0];
  const ribbonComparison = compareFixedVsWebster({ phases: signalPhasesFor(ribbonNode) });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Sci-Fi Global Interactive Grid Backdrop */}
      <CyberGridBackdrop />

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
                  ADAPTIVE TRAFFIC OS
                </span>
              </div>
              <div style={{ fontSize: '0.68rem', color: '#64748b', letterSpacing: '0.04em', fontFamily: 'var(--font-mono)' }}>
                GREATER ACCRA // {trafficNodes.length} INTERSECTIONS // SIGNAL CONTROLLERS SIMULATED
              </div>
            </div>
          </div>

          {/* Core Navigation Pills */}
          <div className="tab-nav-container">
            <button
              onClick={() => { sfx.click(); setActiveTab('overview'); setMapLayer('traffic'); }}
              onMouseEnter={() => sfx.hover()}
              className={`pill-tab ${activeTab === 'overview' ? 'active' : ''}`}
            >
              <Car size={14} />
              Arterial Corridor Map
            </button>

            <button
              onClick={() => { sfx.click(); openVisionForNode(selectedNode || trafficNodes[0]); }}
              onMouseEnter={() => sfx.hover()}
              className="pill-tab"
              title="Open 4K Edge Computer Vision Diagnostics & PCU Flow"
            >
              <Sparkles size={14} color="var(--accent-cyan)" />
              Edge Vision Sentinel
            </button>

            <button
              onClick={() => { sfx.click(); setActiveTab('gateway'); }}
              onMouseEnter={() => sfx.hover()}
              className={`pill-tab ${activeTab === 'gateway' ? 'active' : ''}`}
            >
              <Terminal size={14} />
              IoT Gateway & Bench
            </button>
            <button
              onClick={() => { sfx.click(); setActiveTab('assistant'); }}
              onMouseEnter={() => sfx.hover()}
              className={`pill-tab ${activeTab === 'assistant' ? 'active' : ''}`}
            >
              <Bot size={14} />
              Assistant
            </button>

          </div>

          {/* Tactical Action Bar */}
          <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* High-Impact Tactical Preemption Button */}
            <button
              onClick={handleLaunchGreenWave}
              className="btn-emergency-pulse"
              style={{
                fontSize: '0.76rem',
                padding: '7px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              title="Preempt traffic lights along Kwame Nkrumah Circle to 37 Military Hospital for emergency vehicles"
            >
              <Siren size={14} />
              <span>🚨 Green Wave Preemption</span>
            </button>

            {/* Accra GMT Clock */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.74rem', color: '#64748b', fontFamily: 'var(--font-mono)', padding: '0 4px' }}>
              <Clock size={13} />
              <span>{currentTime}</span>
            </div>

            {/* Audio Feedback Toggle */}
            <button
              onClick={toggleAudio}
              style={{
                background: sfxMuted ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 242, 254, 0.12)',
                border: sfxMuted ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 242, 254, 0.35)',
                color: sfxMuted ? '#64748b' : 'var(--accent-cyan)',
                padding: '6px 10px',
                borderRadius: '8px',
                fontSize: '0.74rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              title={sfxMuted ? 'Unmute Audio HUD' : 'Mute Audio HUD'}
            >
              {sfxMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
              <span style={{ fontSize: '0.68rem', fontWeight: '600' }}>{sfxMuted ? 'SFX Off' : 'SFX On'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Real-World Traffic Performance Ribbon */}
      <section 
        className="notranslate"
        translate="no"
        style={{
          background: 'rgba(8, 13, 24, 0.88)',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '6px 20px',
          backdropFilter: 'blur(10px)'
        }}
      >
        <div style={{
          maxWidth: '1600px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>TELEMETRY:</span>
            <span style={{ fontSize: '0.74rem', fontWeight: '700', color: '#34d399', fontFamily: 'var(--font-mono)' }}>
              {ingestPacketCount} packets received this session
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Car size={13} color="#38bdf8" />
              <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{ribbonNode.id} Webster cycle:</span>
              <span style={{ fontSize: '0.74rem', fontWeight: '700', color: '#fff' }}>{ribbonComparison.webster.cycleSec}s</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} title="Webster average delay per vehicle, fixed 120 s equal-split cycle vs Webster optimum, same flows. See the vision panel for the full formula.">
              <BarChart3 size={13} color="#34d399" />
              <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Avg delay (fixed 120s → Webster):</span>
              <span style={{ fontSize: '0.74rem', fontWeight: '700', color: '#34d399' }}>
                {formatDelay(ribbonComparison.fixed.avgDelaySec)} → {formatDelay(ribbonComparison.webster.avgDelaySec)}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Shield size={13} color="#fbbf24" />
              <span style={{ fontSize: '0.74rem', fontWeight: '700', color: '#fbbf24' }}>
                {ribbonNode.simulated ? 'Simulated input data' : 'Input from telemetry'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Dynamic Workspace Area */}
      <main ref={workspaceRef} style={{ flex: 1, padding: '16px 20px', maxWidth: '1600px', margin: '0 auto', width: '100%', position: 'relative', zIndex: 1 }}>
        {/* PRIMARY FOCAL PRODUCT: TrotroFlow Live Slipway Sentinel & Closed-Loop SCADA Queue Clearance */}
        <TrotroFlowHeroWidget
          onOpenFullVisionModal={() => openVisionForNode(trafficNodes[0])}
          onApplyOptimization={handleApplyTrafficOptimization}
          activeTrafficNode={trafficNodes[0]}
        />

        {/* Active Crisis Command Banner */}
        {activeCrisis && (
          <div
            ref={crisisBannerRef}
            style={{
              marginBottom: '20px',
              padding: '16px 20px',
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.22) 0%, rgba(185, 28, 28, 0.3) 100%)',
              border: '1px solid rgba(239, 68, 68, 0.65)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              boxShadow: '0 0 30px rgba(239, 68, 68, 0.35)',
              backdropFilter: 'blur(10px)',
              flexWrap: 'wrap'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #ef4444'
              }}>
                <AlertTriangle size={22} color="#fca5a5" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: '800', color: '#fff', fontSize: '0.95rem', letterSpacing: '0.02em' }}>
                    CRITICAL INCIDENT ACTIVE: {activeCrisis.title}
                  </span>
                  <span style={{
                    fontSize: '0.65rem',
                    background: '#ef4444',
                    color: '#fff',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontWeight: '700'
                  }}>
                    SEV-1 ALERT
                  </span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#fca5a5', marginTop: '2px' }}>
                  {activeCrisis.desc} // Impact: <strong style={{ color: '#fff' }}>{activeCrisis.severity}</strong>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleResolveCrisis}
                className="btn-primary"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#fff',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontWeight: '700',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)'
                }}
              >
                Execute Autonomous Remediation
              </button>
              <button
                onClick={() => { sfx.click(); setActiveCrisis(null); }}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#e2e8f0',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Layer Controls when viewing map */}
        {(activeTab === 'overview' || activeTab === 'traffic') && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>GIS Viewport:</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => { sfx.click(); setMapLayer('traffic'); }}
                  style={{
                    background: mapLayer === 'traffic' ? 'rgba(0, 242, 254, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                    border: mapLayer === 'traffic' ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                    color: mapLayer === 'traffic' ? '#fff' : 'var(--text-secondary)',
                    padding: '4px 12px',
                    borderRadius: '6px',
                    fontSize: '0.74rem',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Traffic Arterials (Armed)
                </button>
                <button
                  onClick={() => { sfx.click(); setMapLayer('all'); }}
                  style={{
                    background: mapLayer === 'all' ? 'rgba(0, 242, 254, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                    border: mapLayer === 'all' ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                    color: mapLayer === 'all' ? '#fff' : 'var(--text-secondary)',
                    padding: '4px 12px',
                    borderRadius: '6px',
                    fontSize: '0.74rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  All Municipal Sensors
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {/* Quick Engineering Rigor Suite button */}

              {/* Quick CCTV button */}
              <button
                onClick={() => { sfx.click(); openVisionForNode(trafficNodes[0]); }}
                onMouseEnter={() => sfx.hover()}
                className="btn-secondary"
                style={{ fontSize: '0.78rem', padding: '6px 14px' }}
              >
                <Sparkles size={14} color="var(--accent-cyan)" />
                Inspect 4K CCTV Feed
              </button>
            </div>
          </div>
        )}

        {/* Tab 1: Overview & Arterial Signal Optimizer */}
        {activeTab === 'overview' && (
          <div className="overview-grid">
            <div>
              <CityMap
                activeLayer={mapLayer}
                trafficNodes={trafficNodes}
                selectedNode={selectedNode}
                onSelectNode={setSelectedNode}
                onOpenVisionModal={openVisionForNode}
                activeCrisis={activeCrisis}
                onResolveCrisis={handleResolveCrisis}
                externalWaveTrigger={externalWaveTrigger}
              />
            </div>

            {/* Right Side Intersection Signal Optimizer & Edge CV Panel */}
            <div style={{ height: 'clamp(560px, 70vh, 780px)' }}>
              <IntersectionOptimizerPanel
                selectedNode={selectedNode}
                allTrafficNodes={trafficNodes}
                onSelectNode={setSelectedNode}
                onOpenVisionModal={openVisionForNode}
                onApplyOptimization={handleApplyTrafficOptimization}
                onLaunchGreenWave={handleLaunchGreenWave}
                onOpenGateway={() => setActiveTab('gateway')}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Traffic Sentinel */}
        {activeTab === 'traffic' && (
          <div className="traffic-grid">
            <CityMap
              activeLayer="traffic"
              trafficNodes={trafficNodes}
              selectedNode={selectedNode}
              onSelectNode={setSelectedNode}
              onOpenVisionModal={openVisionForNode}
              activeCrisis={activeCrisis}
              onResolveCrisis={handleResolveCrisis}
              externalWaveTrigger={externalWaveTrigger}
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

        {activeTab === 'assistant' && (
          <div style={{ height: '640px' }}>
            <AssistantChat
              apiKey={apiKey}
              trafficNodes={trafficNodes}
              activeCrisis={activeCrisis}
              onExecuteAgentTool={handleExecuteAgentTool}
            />
          </div>
        )}

        {/* Tab 5: Sensor Ingestion API Gateway */}
        {activeTab === 'gateway' && (
          <SensorIngestGateway
            trafficNodes={trafficNodes}
            onIngestTelemetry={handleIngestTelemetry}
          />
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
        <div style={{ maxWidth: '1600px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <span>Prototype. Signal controllers are simulated; vehicle detection (COCO-SSD) runs in your browser.</span>
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
      />

      {/* Gemini Neural Engine Hub */}
      <GeminiConfigModal
        isOpen={geminiModalOpen}
        onClose={() => setGeminiModalOpen(false)}
        apiKey={apiKey}
        setApiKey={setApiKey}
      />

      {/* Live External Telemetry Ingestion Alert Toast */}
      {lastExternalIngestToast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          background: 'rgba(6, 15, 25, 0.96)',
          backdropFilter: 'blur(16px)',
          border: '1px solid #00f2fe',
          boxShadow: '0 0 30px rgba(0, 242, 254, 0.45)',
          borderRadius: '14px',
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px'
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'rgba(0, 242, 254, 0.15)',
            border: '1px solid #00f2fe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px'
          }}>
            📡
          </div>
          <div>
            <div style={{ color: '#00f2fe', fontWeight: '700', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>EXTERNAL INGEST VERIFIED: {lastExternalIngestToast.nodeId}</span>
              <span style={{ fontSize: '0.65rem', background: '#10b981', color: '#022c22', padding: '1px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                HTTP 201 CREATED
              </span>
            </div>
            <div style={{ color: '#94a3b8', fontSize: '0.74rem', marginTop: '2px' }}>
              {lastExternalIngestToast.summary}
            </div>
            <div style={{ color: '#64748b', fontSize: '0.66rem', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
              Received at: {new Date(lastExternalIngestToast.receivedAt).toLocaleTimeString()} • Authenticated via X-Sensor-Token
            </div>
          </div>
        </div>
      )}

      {/* Quick IoT Ingestion & Terminal cURL Modal */}
      <QuickIngestModal
        isOpen={quickIngestModalOpen}
        onClose={() => setQuickIngestModalOpen(false)}
        onIngestTelemetry={handleIngestTelemetry}
        ingestPacketCount={ingestPacketCount}
      />

    </div>
  );
}
