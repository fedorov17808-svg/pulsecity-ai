import React, { useState } from 'react';
import { 
  Wind, Trash2, Droplets, AlertCircle, Truck, 
  CheckCircle, Send, Sparkles, Navigation, ShieldCheck 
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function EcoSenseMonitor({
  ecoNodes,
  onDispatchWasteTruck
}) {
  const [dispatchedTrucks, setDispatchedTrucks] = useState([]);
  const [reportedIncident, setReportedIncident] = useState('');
  const [reportSuccess, setReportSuccess] = useState(false);

  const handleDispatch = (nodeId, nodeName) => {
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
    }, 3000);
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
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
              Track 3: Air Quality Telemetry & Smart Municipal Waste Dispatch
            </p>
          </div>
        </div>

        <div className="badge badge-emerald" style={{ fontSize: '0.72rem' }}>
          5 SENSOR CLUSTERS ONLINE
        </div>
      </div>

      {/* Environmental Nodes & Waste Levels */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
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
                padding: '12px 14px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 'bold', color: '#fff' }}>
                    {node.name}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                    PM2.5: <strong style={{ color: node.pm25 > 50 ? '#f43f5e' : '#34d399' }}>{node.pm25} µg/m³</strong> • NO2: {node.no2} ppb
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span className={`badge ${node.aqi > 100 ? 'badge-rose' : node.aqi > 50 ? 'badge-amber' : 'badge-emerald'}`} style={{ fontSize: '0.7rem' }}>
                    AQI {node.aqi}
                  </span>
                </div>
              </div>

              {/* Waste Bar & Action */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginTop: '8px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
                    <span>Waste Hub Capacity</span>
                    <span style={{ color: node.wasteLevelPct > 75 ? '#f43f5e' : '#38bdf8', fontWeight: 'bold' }}>
                      {node.wasteLevelPct}% Full
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

                {node.wasteLevelPct > 70 && (
                  <button
                    onClick={() => handleDispatch(node.id, node.name)}
                    disabled={isDispatched}
                    className="btn-secondary"
                    style={{
                      padding: '4px 10px',
                      fontSize: '0.72rem',
                      background: isDispatched ? 'rgba(16, 185, 129, 0.2)' : 'rgba(56, 189, 248, 0.15)',
                      borderColor: isDispatched ? '#10b981' : '#38bdf8',
                      color: isDispatched ? '#34d399' : '#fff'
                    }}
                  >
                    {isDispatched ? (
                      <>
                        <Truck size={12} />
                        En Route
                      </>
                    ) : (
                      <>
                        <Truck size={12} />
                        Dispatch AMA Truck
                      </>
                    )}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '0.78rem', color: 'var(--accent-cyan)', fontWeight: 'bold' }}>
          <Sparkles size={14} />
          Citizen Smart Report Ingestion (AI Classification)
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input 
            type="text"
            placeholder="e.g. Clogged drain near Kaneshie Market causing backflow..."
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
          <button type="submit" className="btn-primary" style={{ padding: '6px 14px', fontSize: '0.78rem' }}>
            <Send size={13} />
            Submit
          </button>
        </div>
        {reportSuccess && (
          <div style={{ marginTop: '8px', fontSize: '0.74rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle size={13} />
            Gemini verified report severity: Priority Level 2. Municipal team scheduled.
          </div>
        )}
      </form>
    </div>
  );
}
