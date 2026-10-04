import React, { useState } from 'react';
import { 
  Wind, Trash2, Droplets, AlertCircle, Truck, 
  CheckCircle, Send, Sparkles, Navigation, ShieldCheck, 
  Waves, Gauge, ShieldAlert, CloudRain, Sliders 
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function EcoSenseMonitor({
  ecoNodes,
  onDispatchWasteTruck
}) {
  const [dispatchedTrucks, setDispatchedTrucks] = useState([]);
  const [reportedIncident, setReportedIncident] = useState('');
  const [reportSuccess, setReportSuccess] = useState(false);

  // Phase 4: Hydrological Flood Model for Odaw River & Korle Lagoon
  const [rainfallRateMmH, setRainfallRateMmH] = useState(35); // mm/hour tropical downpour
  const [sluiceGatesOpenPct, setSluiceGatesOpenPct] = useState(40);

  // Water level calculation based on rain and sluice gate opening
  const computedWaterLevelM = Number(Math.max(1.2, 1.2 + (rainfallRateMmH * 0.05) - (sluiceGatesOpenPct * 0.025)).toFixed(2));
  const isFloodImminent = computedWaterLevelM >= 3.0;

  const handleAutomateSluice = () => {
    setSluiceGatesOpenPct(90);
    confetti({
      particleCount: 40,
      spread: 50,
      origin: { y: 0.6 }
    });
  };

  const handleDispatch = (nodeId) => {
    onDispatchWasteTruck(nodeId);
    setDispatchedTrucks((prev) => [...prev, nodeId]);
    confetti({
      particleCount: 35,
      spread: 45,
      origin: { y: 0.6 }
    });
  };

  const handleSubmitReport = (e) => {
    e.preventDefault();
    if (!reportedIncident.trim()) return;
    setReportSuccess(true);
    setTimeout(() => {
      setReportedIncident('');
      setReportSuccess(false);
    }, 3500);
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'rgba(16, 185, 129, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(16, 185, 129, 0.3)'
          }}>
            <Wind size={20} color="#34d399" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', color: '#fff' }}>EcoSense Urban Environmental Watch</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Track 3: Odaw Hydrological Flood Model & Smart Waste Fleet Dispatch
            </p>
          </div>
        </div>

        <div className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>
          5 SENSOR CLUSTERS ONLINE
        </div>
      </div>

      {/* Hydrological Odaw River Basin & Flood Prevention Card */}
      <div style={{
        background: isFloodImminent ? 'rgba(244, 63, 94, 0.12)' : 'rgba(6, 182, 212, 0.08)',
        border: isFloodImminent ? '1px solid rgba(244, 63, 94, 0.45)' : '1px solid rgba(6, 182, 212, 0.3)',
        borderRadius: 'var(--radius-md)',
        padding: '14px',
        marginBottom: '14px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Waves size={16} color={isFloodImminent ? '#f43f5e' : '#38bdf8'} />
            <span style={{ fontSize: '0.84rem', fontWeight: 'bold', color: '#fff' }}>
              Odaw River & Korle Basin Hydro-Telemetry
            </span>
          </div>
          <span className={`badge ${isFloodImminent ? 'badge-rose' : 'badge-cyan'}`} style={{ fontSize: '0.65rem' }}>
            {isFloodImminent ? 'CRITICAL FLOOD RISK' : 'NORMAL BASIN FLOW'}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              <span>Water Elevation: <strong style={{ color: isFloodImminent ? '#f43f5e' : '#38bdf8' }}>{computedWaterLevelM}m</strong> (Danger: 3.0m)</span>
              <span>Sluice Gates: <strong style={{ color: '#fff' }}>{sluiceGatesOpenPct}% Open</strong></span>
            </div>
            
            {/* Elevation Bar */}
            <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${Math.min(100, (computedWaterLevelM / 4.0) * 100)}%`,
                background: isFloodImminent ? 'linear-gradient(90deg, #f59e0b, #f43f5e)' : 'linear-gradient(90deg, #10b981, #06b6d4)',
                transition: 'width 0.3s ease'
              }} />
            </div>

            {/* Rainfall & Discharge stats */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.70rem', color: 'var(--text-muted)' }}>
              <span>Rainfall: <strong style={{ color: '#38bdf8' }}>{rainfallRateMmH} mm/h</strong></span>
              <span>Discharge Rate: <strong style={{ color: '#10b981' }}>{Math.round(45 + sluiceGatesOpenPct * 1.8)} m³/s</strong> (Gulf of Guinea Outflow)</span>
            </div>

            {/* Rainfall slider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              <CloudRain size={13} color="#38bdf8" />
              <span>Simulate Downpour:</span>
              <input 
                type="range" 
                min="5" 
                max="85" 
                value={rainfallRateMmH} 
                onChange={(e) => setRainfallRateMmH(Number(e.target.value))}
                style={{ flex: 1, accentColor: '#38bdf8' }}
              />
              <span style={{ fontFamily: 'var(--font-mono)', color: '#fff' }}>{rainfallRateMmH} mm/h</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
            <button
              onClick={handleAutomateSluice}
              className="btn-primary"
              style={{
                fontSize: '0.74rem',
                padding: '6px 12px',
                background: isFloodImminent ? 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)' : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: '#fff',
                width: '100%',
                maxWidth: '220px'
              }}
            >
              <Sliders size={13} />
              Open Emergency Sluices (90%)
            </button>

            <button
              onClick={() => {
                setRainfallRateMmH(15);
                setSluiceGatesOpenPct(45);
              }}
              className="btn-secondary"
              style={{ fontSize: '0.70rem', padding: '4px 10px', width: '100%', maxWidth: '220px' }}
            >
              Reset to Base Flow (15 mm/h)
            </button>
          </div>
        </div>
      </div>

      {/* Environmental Nodes & Waste Levels */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
        {ecoNodes.map((node) => {
          const isCritical = node.wasteLevelPct > 80 || node.aqi > 120;
          const isDispatched = dispatchedTrucks.includes(node.id);

          return (
            <div
              key={node.id}
              style={{
                background: isCritical ? 'rgba(244, 63, 94, 0.06)' : 'rgba(255, 255, 255, 0.02)',
                border: isCritical ? '1px solid rgba(244, 63, 94, 0.35)' : '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 12px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                <div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 'bold', color: '#fff' }}>
                    {node.name}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                    PM2.5: <strong style={{ color: node.pm25 > 50 ? '#f43f5e' : '#34d399' }}>{node.pm25} µg/m³</strong> • NO2: {node.no2} ppb
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span className={`badge ${node.aqi > 100 ? 'badge-rose' : node.aqi > 50 ? 'badge-amber' : 'badge-emerald'}`} style={{ fontSize: '0.68rem' }}>
                    AQI {node.aqi}
                  </span>
                </div>
              </div>

              {/* Waste Bar & Action */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginTop: '6px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
                    <span>Waste Hub Level</span>
                    <span style={{ color: node.wasteLevelPct > 75 ? '#f43f5e' : '#38bdf8', fontWeight: 'bold' }}>
                      {node.wasteLevelPct}%
                    </span>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${node.wasteLevelPct}%`,
                      background: node.wasteLevelPct > 75 ? '#f43f5e' : '#10b981'
                    }} />
                  </div>
                </div>

                {node.wasteLevelPct > 65 && (
                  <button
                    onClick={() => handleDispatch(node.id)}
                    disabled={isDispatched}
                    className="btn-secondary"
                    style={{
                      padding: '4px 10px',
                      fontSize: '0.7rem',
                      background: isDispatched ? 'rgba(16, 185, 129, 0.2)' : 'rgba(56, 189, 248, 0.15)',
                      borderColor: isDispatched ? '#10b981' : '#38bdf8',
                      color: isDispatched ? '#34d399' : '#fff'
                    }}
                  >
                    <Truck size={12} />
                    {isDispatched ? 'AMA Truck En Route' : 'Dispatch AMA Compactor'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Citizen AI Waste & Flood Reporter Form */}
      <form onSubmit={handleSubmitReport} style={{
        background: 'rgba(0, 0, 0, 0.25)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '0.76rem', color: 'var(--accent-cyan)', fontWeight: 'bold' }}>
          <Sparkles size={14} />
          Citizen Smart Report Ingestion (AI Classification)
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input 
            type="text"
            placeholder="e.g. Floating plastic bottles choking Odaw basin grating at Circle..."
            value={reportedIncident}
            onChange={(e) => setReportedIncident(e.target.value)}
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid var(--border-subtle)',
              color: '#fff',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '0.78rem'
            }}
          />
          <button type="submit" className="btn-primary" style={{ padding: '6px 14px', fontSize: '0.76rem' }}>
            <Send size={13} />
            Submit
          </button>
        </div>
        {reportSuccess && (
          <div style={{ marginTop: '8px', fontSize: '0.72rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle size={13} />
            Gemini verified: Priority 1 Canal Grate Choke. Municipal dredging crew dispatched via green-wave corridor.
          </div>
        )}
      </form>
    </div>
  );
}
