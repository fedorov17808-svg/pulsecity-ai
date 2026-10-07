import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, Car, Zap, Wind, Bot, Shield, Trophy, 
  Sparkles, Layers, Clock, Terminal,
  Phone, BarChart3, FileText, Volume2, VolumeX, AlertTriangle,
  Copy, Play
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  TRAFFIC_NODES, ENERGY_NODES, 
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
import GeminiConfigModal from './components/GeminiConfigModal';
import CyberGridBackdrop from './components/CyberGridBackdrop';
import GuidedPitchTour from './components/GuidedPitchTour';
import QuickIngestModal from './components/QuickIngestModal';
import HackathonJuryProofBanner from './components/HackathonJuryProofBanner';
import { calculateWebsterSignalTiming } from './utils/websterAlgorithm';
import { sfx } from './utils/soundEffects';
import gsap from 'gsap';

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
  const [geminiModalOpen, setGeminiModalOpen] = useState(false);
  const [opsMenuOpen, setOpsMenuOpen] = useState(false);
  const [pitchTourOpen, setPitchTourOpen] = useState(false);
  const [quickIngestModalOpen, setQuickIngestModalOpen] = useState(false);
  const [sfxMuted, setSfxMuted] = useState(() => sfx.muted);

  // Layout & Animation Refs
  const workspaceRef = useRef(null);
  const crisisBannerRef = useRef(null);
  const processedPktIdsRef = useRef(new Set());
  const cascadeTimerRef = useRef([]);

  // Triple-Cascade Crisis State
  const [tripleCascadeState, setTripleCascadeState] = useState({
    active: false,
    step: 0,
    stepTitle: '',
    stepDesc: '',
    progress: 0,
    metrics: null
  });

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
  const [ingestLiveConnected, setIngestLiveConnected] = useState(true);
  const [copiedCurlStrip, setCopiedCurlStrip] = useState(false);

  // Send live telemetry probe via REST API from the Dashboard Quick Strip
  const handleSendTestTerminalPing = async () => {
    sfx.click();
    try {
      const payload = {
        nodeId: 'TR-01',
        flowRateVehiclesPerHour: 4920,
        congestionPercentage: 94,
        incidentDetected: true,
        incidentDetails: 'Hardware sensor burst injected via Terminal Quick Strip',
        protocol: 'MQTT_V5_EDGE'
      };

      const res = await fetch('/api/v1/telemetry/ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Sensor-Token': 'afri-pulse-live-2026'
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        handleIngestTelemetry(payload);
        confetti({ particleCount: 32, spread: 55, origin: { y: 0.6 } });
      }
    } catch (e) {
      console.error('Terminal ping error:', e);
    }
  };

  // Live External Ingest Synchronization (cURL / Hardware Terminal Ingest Bridge)
  useEffect(() => {
    let isMounted = true;
    const checkExternalIngest = async () => {
      try {
        const res = await fetch('/api/telemetry/ingest');
        if (!res.ok) {
          if (isMounted) setIngestLiveConnected(false);
          return;
        }
        if (isMounted) setIngestLiveConnected(true);
        const data = await res.json();
        
        if (data.recentEvents && data.recentEvents.length > 0) {
          const freshEvents = data.recentEvents.filter((e) => {
            const key = e.id || `${e.receivedAt}_${e.nodeId}`;
            return !processedPktIdsRef.current.has(key);
          });

          if (freshEvents.length > 0) {
            freshEvents.forEach((newest) => {
              const key = newest.id || `${newest.receivedAt}_${newest.nodeId}`;
              processedPktIdsRef.current.add(key);
              handleIngestTelemetry(newest);
            });

            setIngestPacketCount((c) => c + freshEvents.length);
            const latest = freshEvents[freshEvents.length - 1];
            sfx.alert();
            setLastExternalIngestToast({
              nodeId: latest.nodeId,
              summary: latest.incidentDetails || `Live Ingest: ${latest.congestionPercentage !== undefined ? latest.congestionPercentage + '% Congestion' : 'Telemetry Packet Received'}`,
              receivedAt: latest.receivedAt || new Date().toISOString()
            });

            setTimeout(() => {
              if (isMounted) setLastExternalIngestToast(null);
            }, 6000);
          }
        }
      } catch (err) {
        if (isMounted) setIngestLiveConnected(false);
      }
    };

    checkExternalIngest();
    const interval = setInterval(checkExternalIngest, 2000); // Fast 2s poll for instant curl response
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

  // Ops Menu ref for click-outside dismissal
  const opsMenuRef = useRef(null);

  // Close Ops Menu on click outside
  useEffect(() => {
    if (!opsMenuOpen) return;
    const handleClickOutside = (e) => {
      if (opsMenuRef.current && !opsMenuRef.current.contains(e.target)) {
        setOpsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [opsMenuOpen]);

  // Global ESC key listener to close modals & menus
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setOpsMenuOpen(false);
        setHardwareModalOpen(false);
        setFieldHudOpen(false);
        setUssdModalOpen(false);
        setBenchmarkModalOpen(false);
        setDossierModalOpen(false);
        setPitchModalOpen(false);
        setPitchTourOpen(false);
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
            // Compute real F.V. Webster optimal split based on current node saturation and flow
            const flow = node.flowRate || Math.max(800, node.congestion * 45);
            const sat = node.saturationFlow || 3800;
            const webster = calculateWebsterSignalTiming({
              phases: [
                { name: `${node.name} Primary Approach`, flowRate: flow, saturationFlow: sat, minGreen: 20 },
                { name: `${node.name} Cross-Turn Approach`, flowRate: Math.round(flow * 0.42), saturationFlow: sat, minGreen: 12 }
              ],
              lostTimePerPhase: 4,
              maxCycleLength: 120,
              minCycleLength: 40
            });

            websterMeta = {
              optimalCycle: webster.optimumCycleLengthSeconds,
              effectiveGreen: webster.phases[0]?.effectiveGreenSeconds || 45,
              totalFlowRatioY: webster.totalFlowRatio_Y,
              estimatedDelaySec: webster.phases[0]?.estimatedDelaySecPerVehicle || 15
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
    sfx.success();
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
    sfx.success();
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
    sfx.success();
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

  const handleUssdIncidentReport = (payload) => {
    sfx.alarm();
    handleIngestTelemetry(payload);
    setActiveCrisis({
      id: "crisis-ussd-flood",
      title: "CITIZEN USSD FLASH ALERT (*920*26#)",
      location: "Odaw Basin / Circle Sluice Gate (ECO-01)",
      description: payload.incidentDetails,
      severity: "CRITICAL",
      impact: "Blocked drainage grating threatens low-lying Circle market under torrential rain."
    });
    setMapLayer('eco');
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

  // Cleanup cascade timers on unmount
  useEffect(() => {
    return () => {
      cascadeTimerRef.current.forEach((t) => clearTimeout(t));
    };
  }, []);

  const handleStopTripleCascade = () => {
    cascadeTimerRef.current.forEach((t) => clearTimeout(t));
    cascadeTimerRef.current = [];
    setTripleCascadeState({
      active: false,
      step: 0,
      stepTitle: '',
      stepDesc: '',
      progress: 0,
      metrics: null
    });
    setActiveCrisis(null);
    sfx.click();
  };

  const handleSimulateTripleCascade = () => {
    sfx.alarm();
    setActiveTab('overview');
    cascadeTimerRef.current.forEach((t) => clearTimeout(t));
    cascadeTimerRef.current = [];

    // Phase 1 (t = 0s): Odaw Flash Flood
    setTripleCascadeState({
      active: true,
      step: 1,
      stepTitle: 'PHASE 1/4: ODAW RIVER BASIN FLASH FLOOD',
      stepDesc: 'Torrential downpour causes Odaw canal gauge to surge to 3.42m (+1.8m/hr). Sluice intake clogged with plastic debris.',
      progress: 20,
      metrics: { odawLevel: '3.42m', gridFreq: '50.01Hz', circleCongestion: '82%' }
    });
    setActiveCrisis({
      id: 'crisis-triple-cascade',
      title: 'ACCRA TRIPLE CASCADE: FLOOD + DUMSOR + CIRCLE GRIDLOCK',
      location: 'Odaw Basin → Achimota Substation → Kwame Nkrumah Circle',
      desc: 'Simultaneous flash flood, high-voltage frequency drop, and arterial gridlock across Greater Accra.',
      severity: 'CATASTROPHIC (SEV-1)',
      impact: 'Potential $4.2M economic disruption, transformer burnout, and road drowning.'
    });
    setEcoNodes((prev) =>
      prev.map((n) => (n.id === 'ECO-01' ? { ...n, wasteLevelPct: 98, aqi: 185, status: 'CRITICAL' } : n))
    );
    setMapLayer('eco');

    // Phase 2 (t = 3.5s): Achimota Grid Surge & Frequency Dip
    const t2 = setTimeout(() => {
      sfx.alarm();
      setTripleCascadeState({
        active: true,
        step: 2,
        stepTitle: 'PHASE 2/4: ACHIMOTA BULK GRID COLLAPSE THREAT',
        stepDesc: 'Surging storm load drops grid frequency to 49.18Hz (trip threshold: 49.50Hz). Dumsor cascade imminent.',
        progress: 45,
        metrics: { odawLevel: '3.50m', gridFreq: '49.18Hz', circleCongestion: '88%' }
      });
      setEnergyNodes((prev) =>
        prev.map((n) => (n.id === 'EN-01' ? { ...n, currentLoadMw: 248, dumsorRisk: 98, status: 'CRITICAL' } : n))
      );
      setMapLayer('energy');
    }, 3500);
    cascadeTimerRef.current.push(t2);

    // Phase 3 (t = 7s): Circle Gridlock & Trapped Ambulance
    const t3 = setTimeout(() => {
      sfx.alarm();
      setTripleCascadeState({
        active: true,
        step: 3,
        stepTitle: 'PHASE 3/4: CIRCLE ARTERIAL GRIDLOCK & AMBULANCE TRAPPED',
        stepDesc: 'Kwame Nkrumah Circle locks at 99% congestion. Ambulance #EMS-04 from Ridge Hospital trapped with critical trauma patient.',
        progress: 70,
        metrics: { odawLevel: '3.52m', gridFreq: '49.16Hz', circleCongestion: '99%' }
      });
      setTrafficNodes((prev) =>
        prev.map((n) =>
          n.id === 'TR-01'
            ? { ...n, congestion: 99, speedKmh: 2, incidentActive: true, alert: 'CRITICAL GRIDLOCK: 84 Trotros blocked at Circle Overpass' }
            : n
        )
      );
      setMapLayer('traffic');
    }, 7000);
    cascadeTimerRef.current.push(t3);

    // Phase 4 (t = 10.5s): Autonomous Multi-Agent Intervention
    const t4 = setTimeout(() => {
      sfx.success();
      setTripleCascadeState({
        active: true,
        step: 4,
        stepTitle: 'PHASE 4/4: AUTONOMOUS URBAN NERVOUS SYSTEM INTERVENTION',
        stepDesc: 'Cross-pillar actuators firing: Korle sluice opened 75%, SCADA soft-sheds Feeder 4 (10% inrush safe), Green Wave corridor engaged.',
        progress: 90,
        metrics: { odawLevel: '1.45m', gridFreq: '50.02Hz', circleCongestion: '28%' }
      });
      // 1. Eco Actuation
      setEcoNodes((prev) =>
        prev.map((n) =>
          n.id === 'ECO-01'
            ? { ...n, wasteLevelPct: 22, aqi: 48, status: 'GOOD', recommendation: 'Automated sluice flush complete. Odaw gauge safe at 1.45m.' }
            : n
        )
      );
      // 2. Grid Actuation
      setEnergyNodes((prev) =>
        prev.map((n) =>
          n.id === 'EN-01' ? { ...n, currentLoadMw: 174, dumsorRisk: 12, status: 'NOMINAL', batteryReservePct: 88 } : n
        )
      );
      // 3. Traffic Actuation & Preemption Corridor
      setTrafficNodes((prev) =>
        prev.map((n) =>
          n.id === 'TR-01'
            ? {
                ...n,
                congestion: 28,
                speedKmh: 46,
                incidentActive: false,
                lightState: 'GREEN',
                cycleRemainingSec: 85,
                alert: 'Green Wave Active: Emergency corridor cleared'
              }
            : n
        )
      );
      setExternalWaveTrigger({ origin: 'N-CIRCLE', dest: 'N-37MIL', id: Date.now() });
      setMapLayer('all');
    }, 10500);
    cascadeTimerRef.current.push(t4);

    // Phase 5 (t = 14s): Complete Victory & Resolution
    const t5 = setTimeout(() => {
      sfx.success();
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
      setTripleCascadeState({
        active: false,
        step: 5,
        stepTitle: 'VICTORY: TRIPLE CASCADE AVERTED AUTONOMOUSLY',
        stepDesc: '14.2s autonomous multi-agent response saved $250k transformer, averted canal inundation, and delivered ambulance with 0 stops.',
        progress: 100,
        metrics: { odawLevel: '1.38m', gridFreq: '50.02Hz', circleCongestion: '24%' }
      });
      setActiveCrisis(null);
    }, 14000);
    cascadeTimerRef.current.push(t5);
  };

  const handleResolveCrisis = () => {
    if (!activeCrisis) return;
    sfx.success();
    if (activeCrisis.id === 'crisis-triple-cascade') {
      cascadeTimerRef.current.forEach((t) => clearTimeout(t));
      cascadeTimerRef.current = [];
      setEcoNodes((prev) =>
        prev.map((n) =>
          n.id === 'ECO-01'
            ? { ...n, wasteLevelPct: 22, aqi: 48, status: 'GOOD', recommendation: 'Automated sluice flush complete. Odaw gauge safe at 1.45m.' }
            : n
        )
      );
      setEnergyNodes((prev) =>
        prev.map((n) =>
          n.id === 'EN-01' ? { ...n, currentLoadMw: 174, dumsorRisk: 12, status: 'NOMINAL', batteryReservePct: 88 } : n
        )
      );
      setTrafficNodes((prev) =>
        prev.map((n) =>
          n.id === 'TR-01'
            ? {
                ...n,
                congestion: 28,
                speedKmh: 46,
                incidentActive: false,
                lightState: 'GREEN',
                cycleRemainingSec: 85,
                alert: 'Green Wave Active: Emergency corridor cleared'
              }
            : n
        )
      );
      setExternalWaveTrigger({ origin: 'N-CIRCLE', dest: 'N-37MIL', id: Date.now() });
      setMapLayer('all');
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
      setTripleCascadeState({
        active: false,
        step: 5,
        stepTitle: 'VICTORY: TRIPLE CASCADE AVERTED AUTONOMOUSLY',
        stepDesc: '14.2s autonomous multi-agent response saved $250k transformer, averted canal inundation, and delivered ambulance with 0 stops.',
        progress: 100,
        metrics: { odawLevel: '1.38m', gridFreq: '50.02Hz', circleCongestion: '24%' }
      });
      setActiveCrisis(null);
      return;
    }
    if (activeCrisis.id === 'crisis-motorway-pileup') {
      handleApplyTrafficOptimization('TR-02', 65);
    } else if (activeCrisis.id === 'crisis-achimota-dumsor') {
      handleBalanceGrid();
    } else if (activeCrisis.id === 'crisis-makola-waste-flood') {
      handleDispatchWasteTruck('ECO-03');
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
    } else if (toolCall.name === 'BALANCE_GRID_SHED') {
      handleBalanceGrid();
    } else if (toolCall.name === 'DRAIN_SLUICE_GATES') {
      handleDispatchWasteTruck('ECO-01');
    }
  };

  const openVisionForNode = (node) => {
    setVisionModalNode(node);
    setVisionModalOpen(true);
  };

  // 90-Second Guided Pitch Tour Step Handler
  const handleTourStepChange = (stepObj) => {
    if (!stepObj) return;
    sfx.click();
    if (stepObj.tab) {
      setActiveTab(stepObj.tab);
    }
    if (stepObj.layer) {
      setMapLayer(stepObj.layer);
    }
    if (stepObj.openVision) {
      openVisionForNode(trafficNodes[0]);
    } else {
      setVisionModalOpen(false);
    }
    if (stepObj.triggerWave) {
      handleExecuteAgentTool({
        name: 'DISPATCH_GREEN_WAVE',
        params: { origin: 'N-CIRCLE', dest: 'N-37MIL' }
      });
    }
    if (stepObj.openUssd) {
      setUssdModalOpen(true);
    } else {
      setUssdModalOpen(false);
    }
    if (stepObj.openBenchmark) {
      setBenchmarkModalOpen(true);
    } else {
      setBenchmarkModalOpen(false);
    }
  };

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
                  GAMA MUNICIPAL OS
                </span>
              </div>
              <div style={{ fontSize: '0.68rem', color: '#64748b', letterSpacing: '0.04em', fontFamily: 'var(--font-mono)' }}>
                GREATER ACCRA METROPOLIS // 1,420 EDGE NODES ACTIVE
              </div>
            </div>
          </div>

          {/* Subsystem Navigation Pills */}
          <div className="tab-nav-container">
            <button
              onClick={() => { sfx.click(); setActiveTab('overview'); }}
              onMouseEnter={() => sfx.hover()}
              className={`pill-tab ${activeTab === 'overview' ? 'active' : ''}`}
            >
              <Layers size={14} />
              GIS Digital Twin
            </button>

            <button
              onClick={() => { sfx.click(); setActiveTab('traffic'); setMapLayer('traffic'); }}
              onMouseEnter={() => sfx.hover()}
              className={`pill-tab ${activeTab === 'traffic' ? 'active' : ''}`}
            >
              <Car size={14} />
              Traffic Sentinel
            </button>

            <button
              onClick={() => { sfx.click(); setActiveTab('energy'); setMapLayer('energy'); }}
              onMouseEnter={() => sfx.hover()}
              className={`pill-tab ${activeTab === 'energy' ? 'active' : ''}`}
            >
              <Zap size={14} />
              GridGuard (Dumsor)
            </button>

            <button
              onClick={() => { sfx.click(); setActiveTab('eco'); setMapLayer('eco'); }}
              onMouseEnter={() => sfx.hover()}
              className={`pill-tab ${activeTab === 'eco' ? 'active' : ''}`}
            >
              <Wind size={14} />
              EcoSense Basin
            </button>

            <button
              onClick={() => { sfx.click(); setActiveTab('gateway'); }}
              onMouseEnter={() => sfx.hover()}
              className={`pill-tab ${activeTab === 'gateway' ? 'active' : ''}`}
            >
              <Terminal size={14} />
              IoT Gateway
            </button>

            <button
              onClick={() => { sfx.click(); setActiveTab('commander'); }}
              onMouseEnter={() => sfx.hover()}
              className={`pill-tab ${activeTab === 'commander' ? 'active' : ''}`}
            >
              <Bot size={14} />
              Commander Kofi
            </button>
          </div>

          {/* Tactical Action Bar */}
          <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#64748b', fontFamily: 'var(--font-mono)', marginRight: '4px' }}>
              <Clock size={13} />
              {currentTime}
            </div>

            {/* Audio Feedback Toggle with Sci-Fi Equalizer */}
            <button
              onClick={toggleAudio}
              style={{
                background: sfxMuted ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 242, 254, 0.12)',
                border: sfxMuted ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 242, 254, 0.35)',
                color: sfxMuted ? '#64748b' : 'var(--accent-cyan)',
                padding: '6px 10px',
                borderRadius: '8px',
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                transition: 'all 0.2s ease'
              }}
              title={sfxMuted ? 'Enable Sci-Fi Audio HUD' : 'Mute Sci-Fi Audio HUD'}
            >
              {sfxMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
              <span style={{ fontSize: '0.7rem', fontWeight: '600' }}>{sfxMuted ? 'SFX OFF' : 'SFX ON'}</span>
              <div className="audio-equalizer">
                <span className={`audio-bar ${sfxMuted ? 'muted' : 'animating'}`}></span>
                <span className={`audio-bar ${sfxMuted ? 'muted' : 'animating'}`}></span>
                <span className={`audio-bar ${sfxMuted ? 'muted' : 'animating'}`}></span>
                <span className={`audio-bar ${sfxMuted ? 'muted' : 'animating'}`}></span>
              </div>
            </button>

            {/* Public USSD Dialer Button */}
            <button
              onClick={() => { sfx.click(); setUssdModalOpen(true); }}
              onMouseEnter={() => sfx.hover()}
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
            <div ref={opsMenuRef} style={{ position: 'relative' }}>
              <button
                onClick={() => { sfx.click(); setOpsMenuOpen(!opsMenuOpen); }}
                onMouseEnter={() => sfx.hover()}
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
                    onClick={() => { sfx.click(); setHardwareModalOpen(true); setOpsMenuOpen(false); }}
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
                    onMouseEnter={e => { sfx.hover(); e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <Zap size={15} color="#34d399" />
                    <div>
                      <div style={{ fontWeight: '600', color: '#fff' }}>IoT Hardware Suite</div>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>ESP32 C++ & RPi Python ($13.05 BOM)</div>
                    </div>
                  </button>

                  <button
                    onClick={() => { sfx.click(); setFieldHudOpen(true); setOpsMenuOpen(false); }}
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
                    onMouseEnter={e => { sfx.hover(); e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <Shield size={15} color="#fbbf24" />
                    <div>
                      <div style={{ fontWeight: '600', color: '#fff' }}>Field Officer Tactical HUD</div>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Ghana Police MTTD & ECG overrides</div>
                    </div>
                  </button>

                  <button
                    onClick={() => { sfx.click(); setBenchmarkModalOpen(true); setOpsMenuOpen(false); }}
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
                    onMouseEnter={e => { sfx.hover(); e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <BarChart3 size={15} color="#38bdf8" />
                    <div>
                      <div style={{ fontWeight: '600', color: '#fff' }}>TCO & Vendor Benchmark</div>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>PulseCity vs Siemens & SCATS matrix</div>
                    </div>
                  </button>

                  <button
                    onClick={() => { sfx.click(); setDossierModalOpen(true); setOpsMenuOpen(false); }}
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
                    onMouseEnter={e => { sfx.hover(); e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <FileText size={15} color="#c084fc" />
                    <div>
                      <div style={{ fontWeight: '600', color: '#fff' }}>Accra Executive Dossier</div>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Official Municipal Brief (PDF export)</div>
                    </div>
                  </button>

                  <button
                    onClick={() => { sfx.click(); setGeminiModalOpen(true); setOpsMenuOpen(false); }}
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
                    onMouseEnter={e => { sfx.hover(); e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <Sparkles size={15} color="var(--accent-cyan)" />
                    <div>
                      <div style={{ fontWeight: '600', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        Gemini Neural Engine
                        <span style={{
                          fontSize: '0.62rem',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: apiKey ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                          color: apiKey ? '#34d399' : '#fbbf24',
                          fontFamily: 'var(--font-mono)'
                        }}>
                          {apiKey ? 'API Online' : 'Simulated'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Multi-modal vision & agentic dispatch key</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Live IoT Ingestion Bridge Status & Quick Terminal Launcher */}
            <button
              onClick={() => { sfx.click(); setQuickIngestModalOpen(true); }}
              onMouseEnter={() => sfx.hover()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: ingestLiveConnected ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                border: ingestLiveConnected ? '1px solid rgba(16, 185, 129, 0.45)' : '1px solid rgba(239, 68, 68, 0.45)',
                padding: '5px 10px',
                borderRadius: '8px',
                fontSize: '0.72rem',
                fontFamily: 'var(--font-mono)',
                color: ingestLiveConnected ? '#34d399' : '#f87171',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: ingestLiveConnected ? '0 0 12px rgba(16, 185, 129, 0.2)' : 'none'
              }}
              title="Click to launch Terminal cURL Telemetry Injector (/api/v1/telemetry/ingest)"
            >
              <span className="pulse-indicator" style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: ingestLiveConnected ? '#10b981' : '#ef4444',
                boxShadow: ingestLiveConnected ? '0 0 8px #10b981' : '0 0 8px #ef4444'
              }} />
              <Terminal size={12} style={{ marginRight: '-2px' }} />
              <span>INGEST BRIDGE</span>
              {ingestPacketCount > 0 ? (
                <span style={{
                  background: '#059669',
                  color: '#fff',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  fontSize: '0.65rem',
                  fontWeight: '700'
                }}>
                  {ingestPacketCount} PKTS
                </span>
              ) : (
                <span style={{
                  background: 'rgba(255,255,255,0.08)',
                  color: '#94a3b8',
                  padding: '1px 5px',
                  borderRadius: '6px',
                  fontSize: '0.62rem'
                }}>
                  cURL
                </span>
              )}
            </button>

            {/* 1-Click Triple Cascade Crisis Simulator Button */}
            <button
              onClick={() => {
                sfx.alarm();
                handleSimulateTripleCascade();
              }}
              onMouseEnter={() => sfx.hover()}
              style={{
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(220, 38, 38, 0.35) 100%)',
                border: '1px solid rgba(239, 68, 68, 0.75)',
                color: '#fca5a5',
                boxShadow: '0 0 16px rgba(239, 68, 68, 0.35)',
                fontSize: '0.78rem',
                padding: '6px 14px',
                fontWeight: '800',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Run 1-click 14-second Triple-Cascade Crisis: Flood + Dumsor + Circle Gridlock"
            >
              <AlertTriangle size={14} color="#ef4444" />
              <span>🚨 SIMULATE CRISIS (14s)</span>
            </button>

            {/* 3-Minute Hackathon Jury Guided Tour Button */}
            <button
              onClick={() => { sfx.click(); setPitchTourOpen(true); }}
              onMouseEnter={() => sfx.hover()}
              style={{
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(0, 242, 254, 0.2) 100%)',
                border: '1px solid rgba(245, 158, 11, 0.75)',
                color: '#fbbf24',
                boxShadow: '0 0 16px rgba(245, 158, 11, 0.3)',
                fontSize: '0.78rem',
                padding: '6px 14px',
                fontWeight: '800',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Launch guided interactive hackathon pitch walkthrough for judges"
            >
              <Trophy size={14} color="#fbbf24" />
              <span>⭐ JURY TOUR (3-MIN)</span>
            </button>

            {/* DoraHacks Pitch Kit (Hero CTA) */}
            <button
              onClick={() => { sfx.click(); setPitchModalOpen(true); }}
              onMouseEnter={() => sfx.hover()}
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
        <div className="metrics-grid">
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
      <main ref={workspaceRef} style={{ flex: 1, padding: '24px', maxWidth: '1440px', margin: '0 auto', width: '100%', position: 'relative', zIndex: 1 }}>
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

        {/* 1st-Place Hackathon Executive Jury Proof Banner */}
        <HackathonJuryProofBanner
          onLaunchGreenWave={() => {
            sfx.alarm();
            handleExecuteAgentTool({
              name: 'DISPATCH_GREEN_WAVE',
              params: { origin: 'N-CIRCLE', dest: 'N-37MIL' }
            });
          }}
          onOpenQuickIngest={() => {
            sfx.click();
            setQuickIngestModalOpen(true);
          }}
          onOpenHardwareHub={() => {
            sfx.click();
            setHardwareModalOpen(true);
          }}
          onOpenUssdModal={() => {
            sfx.click();
            setUssdModalOpen(true);
          }}
        />

        {/* Layer Controls when viewing map */}
        {(activeTab === 'overview' || activeTab === 'traffic' || activeTab === 'energy' || activeTab === 'eco') && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Active GIS Layer:</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                {['all', 'traffic', 'energy', 'eco'].map((l) => (
                  <button
                    key={l}
                    onClick={() => { sfx.click(); setMapLayer(l); }}
                    onMouseEnter={() => sfx.hover()}
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

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Hero Emergency Preemption Action */}
              <button
                onClick={() => {
                  sfx.alarm();
                  handleExecuteAgentTool({
                    name: 'DISPATCH_GREEN_WAVE',
                    params: { origin: 'N-CIRCLE', dest: 'N-37MIL' }
                  });
                  confetti({ particleCount: 40, spread: 60, origin: { y: 0.5 } });
                }}
                className="btn-emergency-pulse"
                title="Instant Preemption Corridor: Kwame Nkrumah Circle → 37 Military Hospital"
              >
                <span>🚑</span>
                <span>LAUNCH GREEN WAVE (CIRCLE → 37 MIL)</span>
              </button>

              {/* Quick CCTV button */}
              <button
                onClick={() => { sfx.click(); openVisionForNode(trafficNodes[0]); }}
                onMouseEnter={() => sfx.hover()}
                className="btn-secondary"
                style={{ fontSize: '0.78rem', padding: '6px 14px' }}
              >
                <Sparkles size={14} color="var(--accent-cyan)" />
                Inspect Gemini Vision Feed
              </button>
            </div>
          </div>
        )}

        {/* Live Terminal cURL Injection Strip */}
        <div className="terminal-quick-strip">
          <div className="terminal-strip-prompt">
            <span style={{ color: '#10b981', fontWeight: '800' }}>$</span>
            <span style={{ color: '#94a3b8' }}>
              curl -X POST &quot;https://pulsecity-ai.vercel.app/api/v1/telemetry/ingest&quot; -H &quot;X-Sensor-Token: afri-pulse-live-2026&quot; -d &#39;&#123;&quot;nodeId&quot;:&quot;TR-01&quot;,&quot;congestionPercentage&quot;:95&#125;&#39;
            </span>
          </div>
          <div className="terminal-strip-actions">
            <button
              onClick={() => {
                sfx.click();
                navigator.clipboard.writeText(`curl -X POST "https://pulsecity-ai.vercel.app/api/v1/telemetry/ingest" -H "Content-Type: application/json" -H "X-Sensor-Token: afri-pulse-live-2026" -d '{"nodeId":"TR-01","congestionPercentage":95,"incidentDetected":true}'`);
                setCopiedCurlStrip(true);
                setTimeout(() => setCopiedCurlStrip(false), 2000);
              }}
              className="btn-secondary"
              style={{ fontSize: '0.7rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}
              title="Copy ready-to-run terminal cURL command"
            >
              <Copy size={12} />
              <span>{copiedCurlStrip ? 'Copied!' : 'Copy cURL'}</span>
            </button>
            <button
              onClick={handleSendTestTerminalPing}
              className="btn-primary"
              style={{ fontSize: '0.7rem', padding: '4px 12px', display: 'flex', alignItems: 'center', gap: '5px', background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' }}
              title="Execute live hardware HTTP POST probe directly to /api/v1/telemetry/ingest"
            >
              <Play size={12} fill="currentColor" />
              <span>Test Ingest (HTTP POST)</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Overview & Digital Twin Map Layout */}
        {activeTab === 'overview' && (
          <div className="overview-grid">
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
                externalWaveTrigger={externalWaveTrigger}
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
                  onExecuteAgentTool={handleExecuteAgentTool}
                  onSimulateTripleCascade={handleSimulateTripleCascade}
                  tripleCascadeState={tripleCascadeState}
                  onStopTripleCascade={handleStopTripleCascade}
                  onOpenVisionModal={openVisionForNode}
                  onOpenUssdModal={() => setUssdModalOpen(true)}
                  onOpenHardwareModal={() => setHardwareModalOpen(true)}
                  trafficNodes={trafficNodes}
                  energyNodes={energyNodes}
                  ecoNodes={ecoNodes}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Traffic Sentinel */}
        {activeTab === 'traffic' && (
          <div className="traffic-grid">
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
              onExecuteAgentTool={handleExecuteAgentTool}
              onSimulateTripleCascade={handleSimulateTripleCascade}
              tripleCascadeState={tripleCascadeState}
              onStopTripleCascade={handleStopTripleCascade}
              onOpenVisionModal={openVisionForNode}
              onOpenUssdModal={() => setUssdModalOpen(true)}
              onOpenHardwareModal={() => setHardwareModalOpen(true)}
              trafficNodes={trafficNodes}
              energyNodes={energyNodes}
              ecoNodes={ecoNodes}
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
            prev.map((n) => (n.id === (circuitId || 'EN-01')) ? { ...n, currentLoadMw: Math.max(140, n.currentLoadMw - 25), dumsorRisk: 12 } : n)
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
        onReportIncident={handleUssdIncidentReport}
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

      {/* 90-Second Interactive Guided Pitch Tour for Hackathon Judges */}
      <GuidedPitchTour
        isOpen={pitchTourOpen}
        onClose={() => setPitchTourOpen(false)}
        onStepChange={handleTourStepChange}
      />

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
