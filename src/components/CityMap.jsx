import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  Car, Zap, Wind, Eye, Flame, Radio, Navigation, Activity, Siren, CheckCircle2 
} from 'lucide-react';
import { findOptimalEmergencyRoute, ACCRA_ROAD_GRAPH } from '../utils/roadGraphRouting';
import { playEmergencySirenSound } from '../utils/soundEffects';
import confetti from 'canvas-confetti';

export default function CityMap({
  activeLayer, // 'all', 'traffic', 'energy', 'eco'
  trafficNodes,
  energyNodes,
  ecoNodes,
  selectedNode,
  onSelectNode,
  onOpenVisionModal,
  activeCrisis,
  onResolveCrisis,
  onEmergencyWaveTriggered
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupsRef = useRef({
    traffic: null,
    energy: null,
    eco: null,
    lines: null,
    corridor: null,
    ambulance: null
  });

  const [emergencyActive, setEmergencyActive] = useState(false);
  const [activeRouteInfo, setActiveRouteInfo] = useState(null);
  const [originNodeId, setOriginNodeId] = useState("N-CIRCLE");
  const [destNodeId, setDestNodeId] = useState("N-37MIL");
  const [showRadarSweep, setShowRadarSweep] = useState(false);
  const ambulanceIntervalRef = useRef(null);

  // Initialize Leaflet Map once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center on Greater Accra
    const map = L.map(mapContainerRef.current, {
      center: [5.6037, -0.1870],
      zoom: 12,
      minZoom: 10,
      maxZoom: 16,
      zoomControl: false
    });

    // Place zoom controls at top-right with CSS offset below the top corridor HUD
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Esri World Dark Gray Base (Ultra-clean, crisp, zero-watermark tactical GIS)
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
      attribution: '&copy; Esri, HERE, Garmin, OpenStreetMap contributors',
      maxZoom: 16
    }).addTo(map);

    // Layer groups for dynamic visibility
    layerGroupsRef.current.lines = L.layerGroup().addTo(map);
    layerGroupsRef.current.traffic = L.layerGroup().addTo(map);
    layerGroupsRef.current.energy = L.layerGroup().addTo(map);
    layerGroupsRef.current.eco = L.layerGroup().addTo(map);
    layerGroupsRef.current.corridor = L.layerGroup().addTo(map);
    layerGroupsRef.current.ambulance = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    // Handle container resize & orientation changes
    const handleResize = () => {
      map.invalidateSize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (ambulanceIntervalRef.current) clearInterval(ambulanceIntervalRef.current);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Invalidate map size whenever active layer or tab changes to prevent blank tile artifacts
  useEffect(() => {
    if (mapInstanceRef.current) {
      const timer = setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [activeLayer]);

  // Handle Dynamic Emergency Green Wave Transit
  const handleTriggerAmbulance = () => {
    if (originNodeId === destNodeId) {
      alert("Please select different start and destination nodes for the green wave corridor.");
      return;
    }

    const route = findOptimalEmergencyRoute(originNodeId, destNodeId);
    if (!route.success) {
      alert(route.error || "No viable path found between selected nodes.");
      return;
    }

    playEmergencySirenSound();
    setActiveRouteInfo(route);
    setEmergencyActive(true);

    const { corridor, ambulance } = layerGroupsRef.current;
    corridor.clearLayers();
    ambulance.clearLayers();

    // 1. Draw Green Wave Corridor Polyline with dynamic laser flow animation
    L.polyline(route.gpsPath, {
      className: 'green-wave-animated-corridor',
      color: '#10b981',
      weight: 6,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round',
      dashArray: '14, 10'
    }).addTo(corridor);

    // 2. Add glowing transit beacons at each route waypoint
    route.gpsPath.forEach(([lat, lng]) => {
      const beaconIcon = L.divIcon({
        className: 'green-wave-beacon',
        html: `
          <div style="
            width: 14px;
            height: 14px;
            border-radius: 50%;
            background: #10b981;
            border: 2px solid #ffffff;
            box-shadow: 0 0 16px #10b981, 0 0 8px #ffffff;
            animation: pulse-ring 1.2s infinite ease-in-out;
          "></div>
        `,
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      });
      L.marker([lat, lng], { icon: beaconIcon }).addTo(corridor);
    });

    // 2. Animate Ambulance Moving along the GPS Path smoothly across all hops
    let step = 0;
    const totalSteps = 60;
    const numPoints = route.gpsPath.length;

    const ambIcon = L.divIcon({
      className: 'custom-ambulance-icon',
      html: `
        <div style="
          width: 36px;
          height: 36px;
          background: #10b981;
          border-radius: 50%;
          border: 2px solid #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 25px #10b981, 0 0 12px #fff;
          animation: pulse-ring 0.6s infinite;
        ">
          <span style="font-size: 18px;">🚑</span>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });

    const ambMarker = L.marker(route.gpsPath[0], { icon: ambIcon }).addTo(ambulance);

    if (ambulanceIntervalRef.current) clearInterval(ambulanceIntervalRef.current);

    ambulanceIntervalRef.current = setInterval(() => {
      step++;
      const t = step / totalSteps;

      if (numPoints >= 2) {
        const totalSegments = numPoints - 1;
        const segmentProgress = t * totalSegments;
        const currentSegmentIndex = Math.min(Math.floor(segmentProgress), totalSegments - 1);
        const subT = segmentProgress - currentSegmentIndex;

        const pA = route.gpsPath[currentSegmentIndex];
        const pB = route.gpsPath[currentSegmentIndex + 1];

        const currentLat = pA[0] + (pB[0] - pA[0]) * subT;
        const currentLng = pA[1] + (pB[1] - pA[1]) * subT;
        ambMarker.setLatLng([currentLat, currentLng]);
      }

      if (step >= totalSteps) {
        clearInterval(ambulanceIntervalRef.current);
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 }
        });
        setTimeout(() => {
          setEmergencyActive(false);
          corridor.clearLayers();
          ambulance.clearLayers();
        }, 6000);
      }
    }, 120);

    if (onEmergencyWaveTriggered) {
      onEmergencyWaveTriggered(route);
    }
  };

  // Update Layers & Polylines whenever state changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const { traffic, energy, eco, lines } = layerGroupsRef.current;
    lines.clearLayers();
    traffic.clearLayers();
    energy.clearLayers();
    eco.clearLayers();

    // 1. Render Transmission Lines (Energy Grid)
    if (activeLayer === 'all' || activeLayer === 'energy') {
      const transmissionPaths = [
        [[5.6120, -0.2310], [5.5780, -0.2850]], // Achimota -> Mallam
        [[5.6120, -0.2310], [5.5450, -0.2080]], // Achimota -> Accra Central
        [[5.6120, -0.2310], [5.6500, -0.1850]], // Achimota -> Legon Solar
        [[5.6500, -0.1850], [5.6680, 0.0080]],  // Legon Solar -> Tema Free Zone
        [[5.5450, -0.2080], [5.6680, 0.0080]]   // Accra Central -> Tema Free Zone
      ];

      transmissionPaths.forEach((path) => {
        L.polyline(path, {
          color: '#a855f7',
          weight: 2.5,
          opacity: 0.65,
          dashArray: '6, 8'
        }).addTo(lines);
      });
    }

    // 2. Render Traffic Arterial Corridors
    if (activeLayer === 'all' || activeLayer === 'traffic') {
      // Tema Motorway N1
      L.polyline([
        [5.5560, -0.1969],
        [5.6050, -0.1780],
        [5.6280, -0.1050],
        [5.6540, -0.0160]
      ], {
        color: '#00f2fe',
        weight: 3.5,
        opacity: 0.7,
        dashArray: '8, 6'
      }).addTo(lines);

      // Ring Road Central
      L.polyline([
        [5.5680, -0.2350],
        [5.5560, -0.1969],
        [5.5480, -0.1980],
        [5.5450, -0.2080]
      ], {
        color: '#f59e0b',
        weight: 3,
        opacity: 0.7
      }).addTo(lines);
    }

    // 3. Render Traffic Markers
    if (activeLayer === 'all' || activeLayer === 'traffic') {
      trafficNodes.forEach((node) => {
        const isCongested = node.congestion > 75;
        const color = isCongested ? '#f43f5e' : node.congestion > 50 ? '#f59e0b' : '#10b981';
        const lightColor = node.lightState === 'GREEN' ? '#10b981' : node.lightState === 'YELLOW' ? '#f59e0b' : '#f43f5e';

        const customHtml = `
          <div style="
            position: relative;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: #0c121d;
            border: 2px solid ${color};
            box-shadow: 0 0 14px ${color}88;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
          ">
            <div style="
              width: 10px;
              height: 10px;
              border-radius: 50%;
              background: ${lightColor};
              box-shadow: 0 0 6px ${lightColor};
            "></div>
            ${isCongested ? `
              <div style="
                position: absolute;
                inset: -6px;
                border-radius: 50%;
                border: 1px solid #f43f5e;
                animation: pulse-ring 1.4s infinite;
              "></div>
            ` : ''}
          </div>
        `;

        const icon = L.divIcon({
          className: 'custom-traffic-marker',
          html: customHtml,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const marker = L.marker([node.lat, node.lng], { icon });
        marker.on('click', () => onSelectNode({ ...node, category: 'traffic' }));
        marker.addTo(traffic);
      });
    }

    // 4. Render Energy Substation Markers
    if (activeLayer === 'all' || activeLayer === 'energy') {
      energyNodes.forEach((node) => {
        const isCritical = node.dumsorRisk > 70;
        const color = isCritical ? '#f43f5e' : node.dumsorRisk > 40 ? '#f59e0b' : '#a855f7';

        const customHtml = `
          <div style="
            width: 28px;
            height: 28px;
            background: #0d1117;
            border: 2px solid ${color};
            box-shadow: 0 0 16px ${color}99;
            transform: rotate(45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
          ">
            <div style="width: 8px; height: 8px; background: #fff; border-radius: 50%;"></div>
          </div>
        `;

        const icon = L.divIcon({
          className: 'custom-energy-marker',
          html: customHtml,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });

        const marker = L.marker([node.lat, node.lng], { icon });
        marker.on('click', () => onSelectNode({ ...node, category: 'energy' }));
        marker.addTo(energy);
      });
    }

    // 5. Render EcoSense Markers
    if (activeLayer === 'all' || activeLayer === 'eco') {
      ecoNodes.forEach((node) => {
        const isBad = node.aqi > 100;
        const color = isBad ? '#f43f5e' : node.aqi > 50 ? '#f59e0b' : '#10b981';

        const customHtml = `
          <div style="
            width: 26px;
            height: 26px;
            border-radius: 50%;
            background: #061a14;
            border: 2px solid ${color};
            box-shadow: 0 0 12px ${color}88;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
          ">
            <div style="width: 6px; height: 6px; border-radius: 50%; background: #10b981;"></div>
          </div>
        `;

        const icon = L.divIcon({
          className: 'custom-eco-marker',
          html: customHtml,
          iconSize: [26, 26],
          iconAnchor: [13, 13]
        });

        const marker = L.marker([node.lat, node.lng], { icon });
        marker.on('click', () => onSelectNode({ ...node, category: 'eco' }));
        marker.addTo(eco);
      });
    }

  }, [activeLayer, trafficNodes, energyNodes, ecoNodes]);

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '620px',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border-subtle)',
      overflow: 'hidden',
      boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
    }}>
      {/* Top Map HUD Controls */}
      <div style={{
        position: 'absolute',
        top: '16px',
        left: '20px',
        right: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 1000,
        pointerEvents: 'none',
      }}>
        <div className="notranslate" style={{ display: 'flex', alignItems: 'center', gap: '8px', pointerEvents: 'auto', flexWrap: 'wrap' }}>
          {/* Dynamic Origin & Destination Corridor Selector */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(8, 14, 24, 0.92)',
            backdropFilter: 'blur(14px)',
            border: '1px solid rgba(0, 242, 254, 0.3)',
            borderRadius: '10px',
            padding: '4px 10px',
            fontSize: '0.74rem',
            boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--accent-cyan)', fontWeight: '700' }}>
              <Navigation size={13} />
              <span>Corridor:</span>
            </div>
            <select
              value={originNodeId}
              onChange={(e) => setOriginNodeId(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#fff',
                fontSize: '0.72rem',
                borderRadius: '6px',
                padding: '3px 8px',
                outline: 'none',
                maxWidth: '120px',
                cursor: 'pointer'
              }}
            >
              {Object.entries(ACCRA_ROAD_GRAPH.nodes).map(([id, n]) => (
                <option key={id} value={id} style={{ background: '#0f172a', color: '#fff' }}>
                  {n.name.split(' ')[0]} {n.name.split(' ')[1] || ''}
                </option>
              ))}
            </select>

            <span style={{ color: '#64748b' }}>➔</span>

            <select
              value={destNodeId}
              onChange={(e) => setDestNodeId(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#fff',
                fontSize: '0.72rem',
                borderRadius: '6px',
                padding: '3px 8px',
                outline: 'none',
                maxWidth: '120px',
                cursor: 'pointer'
              }}
            >
              {Object.entries(ACCRA_ROAD_GRAPH.nodes).map(([id, n]) => (
                <option key={id} value={id} style={{ background: '#0f172a', color: '#fff' }}>
                  {n.name.split(' ')[0]} {n.name.split(' ')[1] || ''}
                </option>
              ))}
            </select>

            {/* Quick A* Ambulance Trigger Button */}
            <button
              onClick={handleTriggerAmbulance}
              disabled={emergencyActive}
              className="btn-primary"
              style={{
                padding: '4px 12px',
                fontSize: '0.72rem',
                borderRadius: '6px',
                background: emergencyActive ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                color: '#fff',
                boxShadow: emergencyActive ? '0 0 15px rgba(16, 185, 129, 0.5)' : '0 0 12px rgba(239, 68, 68, 0.4)'
              }}
            >
              <Siren size={13} className={emergencyActive ? 'animate-spin' : ''} />
              {emergencyActive ? 'Wave Active...' : 'Dispatch Green Wave'}
            </button>
          </div>
        </div>

        {/* Crisis Alert Banner if Active */}
        {activeCrisis && (
          <div style={{
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: 'rgba(244, 63, 94, 0.25)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(244, 63, 94, 0.6)',
            padding: '6px 16px',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 0 20px rgba(244, 63, 94, 0.4)',
          }}>
            <Flame size={18} color="#f43f5e" />
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#fff' }}>
                {activeCrisis.title}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#fca5a5' }}>
                Track: {activeCrisis.track} • Multi-Agency Response Active
              </div>
            </div>
            <button 
              onClick={onResolveCrisis}
              className="btn-primary"
              style={{
                padding: '4px 10px',
                fontSize: '0.75rem',
                background: '#10b981',
                boxShadow: '0 0 10px rgba(16, 185, 129, 0.5)'
              }}
            >
              Resolve
            </button>
          </div>
        )}
      </div>

      {/* Leaflet Map Div */}
      <div 
        ref={mapContainerRef} 
        style={{ width: '100%', height: '100%', background: '#0a0f18' }} 
      />

      {/* Active Route Telemetry Toast if Ambulance en route */}
      {emergencyActive && activeRouteInfo && (
        <div style={{
          position: 'absolute',
          top: '68px',
          left: '20px',
          background: 'rgba(16, 185, 129, 0.9)',
          backdropFilter: 'blur(12px)',
          color: '#022c22',
          padding: '8px 16px',
          borderRadius: '8px',
          fontSize: '0.78rem',
          fontFamily: 'var(--font-mono)',
          fontWeight: 'bold',
          zIndex: 1000,
          boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)'
        }}>
          CODE GREEN WAVE: {activeRouteInfo.pathNodeNames?.join(' ➔ ')} • ETA: {activeRouteInfo.estimatedTimeGreenWaveMin}m (was {activeRouteInfo.estimatedTimeNormalMin}m)
        </div>
      )}

      {/* Map Legend Overlay (Bottom Left) */}
      <div style={{
        position: 'absolute',
        bottom: '16px',
        left: '20px',
        background: 'rgba(10, 15, 25, 0.88)',
        backdropFilter: 'blur(12px)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        fontSize: '0.78rem',
        color: 'var(--text-secondary)',
        fontFamily: 'var(--font-mono)',
        zIndex: 1000
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00f2fe' }}></span>
          Traffic Node (Circle)
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '8px', height: '8px', background: '#a855f7', transform: 'rotate(45deg)' }}></span>
          Substation (Diamond)
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span>
          EcoSense Hub
        </div>
      </div>

      {/* Selected Node Quick HUD Drawer (Bottom Right) */}
      {selectedNode && (
        <div style={{
          position: 'absolute',
          bottom: '16px',
          right: '20px',
          width: '330px',
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(16px)',
          border: '1px solid var(--border-active)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.7), var(--shadow-glow-cyan)',
          zIndex: 1001,
          animation: 'fadeIn 0.2s ease',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
            <div>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                GPS: {selectedNode.lat.toFixed(4)}°N, {selectedNode.lng.toFixed(4)}°W
              </div>
              <h4 style={{ fontSize: '1rem', color: '#fff', marginTop: '2px' }}>
                {selectedNode.name}
              </h4>
            </div>
            <button 
              onClick={() => onSelectNode(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '1.2rem',
                padding: '0 4px',
              }}
            >
              ×
            </button>
          </div>

          {selectedNode.category === 'traffic' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                <div style={{ background: 'rgba(255,255,255,0.04)', padding: '8px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Congestion</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: selectedNode.congestion > 75 ? '#f43f5e' : '#10b981' }}>
                    {selectedNode.congestion}%
                  </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.04)', padding: '8px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Flow Rate</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#38bdf8' }}>
                    {selectedNode.flowRate} v/h
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                {selectedNode.alert}
              </div>

              <button 
                className="btn-primary" 
                style={{ width: '100%', fontSize: '0.82rem', padding: '8px' }}
                onClick={() => onOpenVisionModal(selectedNode)}
              >
                <Eye size={15} />
                Open Gemini CCTV Vision Feed
              </button>
            </div>
          )}

          {selectedNode.category === 'energy' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                <div style={{ background: 'rgba(255,255,255,0.04)', padding: '8px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Current Load</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 'bold', color: '#a855f7' }}>
                    {selectedNode.currentLoadMw} MW
                  </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.04)', padding: '8px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Dumsor Risk</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 'bold', color: selectedNode.dumsorRisk > 60 ? '#f43f5e' : '#10b981' }}>
                    {selectedNode.dumsorRisk}%
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                Capacity: {Math.round((selectedNode.currentLoadMw / selectedNode.capacityMw) * 100)}% • Solar: +{selectedNode.solarInputMw} MW
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Feeds: {selectedNode.connectedDistricts?.join(', ')}
              </div>
            </div>
          )}

          {selectedNode.category === 'eco' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                <div style={{ background: 'rgba(255,255,255,0.04)', padding: '8px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Air Quality</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 'bold', color: selectedNode.aqi > 100 ? '#f43f5e' : '#10b981' }}>
                    AQI {selectedNode.aqi}
                  </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.04)', padding: '8px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Waste Overflow</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 'bold', color: selectedNode.wasteLevelPct > 70 ? '#f59e0b' : '#38bdf8' }}>
                    {selectedNode.wasteLevelPct}%
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                {selectedNode.recommendation}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
