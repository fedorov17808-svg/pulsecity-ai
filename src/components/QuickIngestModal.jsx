import React, { useState } from 'react';
import { postTelemetry } from '../services/ingestClient';
import { Terminal, Send, CheckCircle2, Copy, Radio, Wifi, Code2, Sparkles, X, ChevronRight, Play } from 'lucide-react';

export default function QuickIngestModal({
  isOpen,
  onClose,
  onIngestTelemetry,
  ingestPacketCount
}) {
  const [selectedSnippet, setSelectedSnippet] = useState('curl'); // 'curl', 'python', 'node', 'esp32'
  const [activePreset, setActivePreset] = useState('TR-01');
  const [copied, setCopied] = useState(false);
  const [probeLoading, setProbeLoading] = useState(false);
  const [probeResult, setProbeResult] = useState(null);

  if (!isOpen) return null;

  const hostUrl = typeof window !== 'undefined' ? window.location.origin : 'https://pulsecity-ai.vercel.app';

  const presets = {
    'TR-01': {
      title: 'Traffic Vision (Kwame Nkrumah Circle)',
      payload: {
        nodeId: 'TR-01',
        flowRateVehiclesPerHour: 4850,
        congestionPercentage: 92,
        incidentDetected: true,
        incidentDetails: 'Trotro breakdown blocking circle flyover slip-road',
        emergencyTransitActive: false,
        protocol: 'MQTT_V5_EDGE'
      }
    }
  };

  const currentPayload = presets[activePreset].payload;
  const jsonString = JSON.stringify(currentPayload, null, 2);
  const minifiedJson = JSON.stringify(currentPayload);

  const snippets = {
    curl: `curl -X POST "${hostUrl}/api/v1/telemetry/ingest" \\
  -H "Content-Type: application/json" \\
  -H "X-Sensor-Token: $PULSECITY_SENSOR_TOKEN" \\
  -d '${minifiedJson}'`,
    python: `import os
import requests

url = "${hostUrl}/api/v1/telemetry/ingest"
headers = {
    "Content-Type": "application/json",
    "X-Sensor-Token": os.environ["PULSECITY_SENSOR_TOKEN"]
}
payload = ${jsonString}

res = requests.post(url, json=payload, headers=headers)
print("Status:", res.status_code, res.json())`,
    node: `const res = await fetch("${hostUrl}/api/v1/telemetry/ingest", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Sensor-Token": process.env.PULSECITY_SENSOR_TOKEN
  },
  body: JSON.stringify(${jsonString})
});
const data = await res.json();
console.log("Telemetry ACKs:", data);`,
    esp32: `// ESP32 Arduino HTTPClient
HTTPClient http;
http.begin("${hostUrl}/api/v1/telemetry/ingest");
http.addHeader("Content-Type", "application/json");
http.addHeader("X-Sensor-Token", SENSOR_TOKEN); // from secrets.h
int code = http.POST("${minifiedJson.replace(/"/g, '\\"')}");
Serial.printf("Server Response: %d\\n", code);
http.end();`
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(snippets[selectedSnippet]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleSendLiveProbe = async () => {
    setProbeLoading(true);
    setProbeResult(null);
    const start = performance.now();

    try {
      const { ok, status, data } = await postTelemetry(currentPayload);
      const elapsed = Math.round(performance.now() - start);

      if (!ok) {
        throw new Error(data.message || data.error || `HTTP ${status}`);
      }

      setProbeResult({
        success: true,
        status,
        latencyMs: elapsed,
        data
      });

      if (onIngestTelemetry) {
        onIngestTelemetry(currentPayload);
      }

    } catch (err) {
      setProbeResult({
        success: false,
        error: err.message
      });
    } finally {
      setProbeLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="quick-ingest-title">
      <div 
        className="modal-card" 
        style={{ 
          maxWidth: '780px', 
          background: '#070b14', 
          border: '1px solid rgba(0, 242, 254, 0.4)', 
          borderRadius: '20px',
          boxShadow: '0 25px 80px rgba(0,0,0,0.9), 0 0 35px rgba(0, 242, 254, 0.15)'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header" style={{ background: 'rgba(10, 18, 32, 0.85)', borderBottom: '1px solid rgba(0, 242, 254, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'rgba(0, 242, 254, 0.15)',
              border: '1px solid rgba(0, 242, 254, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-cyan)'
            }}>
              <Terminal size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 id="quick-ingest-title" style={{ fontSize: '1.05rem', fontWeight: '700', color: '#fff' }}>
                  Live IoT Ingest Gateway
                </h3>
                <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>
                  REST / cURL Bridge
                </span>
              </div>
              <p style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                Inject simulated or hardware telemetry straight from your terminal into the Accra Digital Twin
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close Ingest Modal">✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Preset Selector */}
          <div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '8px', fontFamily: 'var(--font-mono)' }}>
              1. SELECT TARGET TELEMETRY NODE
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px' }}>
              {Object.entries(presets).map(([id, p]) => (
                <button
                  key={id}
                  onClick={() => { setActivePreset(id); setProbeResult(null); }}
                  style={{
                    background: activePreset === id ? 'rgba(0, 242, 254, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                    border: activePreset === id ? '1px solid var(--accent-cyan)' : '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: '700', color: activePreset === id ? 'var(--accent-cyan)' : '#fff', fontFamily: 'var(--font-mono)' }}>
                      {id}
                    </span>
                    <span style={{ fontSize: '0.64rem', color: '#64748b' }}>
                      {p.payload.protocol}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', lineHeight: '1.3' }}>
                    {p.title}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Snippet Language Selector & Copy */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                2. LIVE COMMAND LINE INJECTION
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {['curl', 'python', 'node', 'esp32'].map(lang => (
                  <button
                    key={lang}
                    onClick={() => setSelectedSnippet(lang)}
                    style={{
                      background: selectedSnippet === lang ? 'rgba(0, 242, 254, 0.2)' : 'transparent',
                      border: selectedSnippet === lang ? '1px solid var(--accent-cyan)' : '1px solid rgba(255,255,255,0.08)',
                      color: selectedSnippet === lang ? 'var(--accent-cyan)' : '#64748b',
                      borderRadius: '6px',
                      padding: '2px 8px',
                      fontSize: '0.68rem',
                      fontFamily: 'var(--font-mono)',
                      cursor: 'pointer'
                    }}
                  >
                    {lang.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ position: 'relative' }}>
              <pre style={{
                background: '#030712',
                border: '1px solid rgba(0, 242, 254, 0.25)',
                borderRadius: '10px',
                padding: '14px',
                fontSize: '0.74rem',
                fontFamily: 'var(--font-mono)',
                color: '#38bdf8',
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
                margin: 0,
                lineHeight: '1.45',
                maxHeight: '180px'
              }}>
                {snippets[selectedSnippet]}
              </pre>

              <button
                onClick={handleCopy}
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  background: copied ? 'rgba(16, 185, 129, 0.25)' : 'rgba(15, 23, 42, 0.85)',
                  border: copied ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.15)',
                  color: copied ? '#34d399' : '#fff',
                  borderRadius: '6px',
                  padding: '5px 10px',
                  fontSize: '0.7rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-mono)'
                }}
              >
                {copied ? <CheckCircle2 size={13} color="#10b981" /> : <Copy size={13} />}
                {copied ? 'Copied to Clipboard!' : 'Copy Command'}
              </button>
            </div>
          </div>

          {/* Action Row: Send Live Probe from UI */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={handleSendLiveProbe}
              disabled={probeLoading}
              className="btn-primary"
              style={{
                flex: 1,
                minWidth: '220px',
                padding: '10px 16px',
                fontSize: '0.84rem',
                justifyContent: 'center',
                boxShadow: '0 0 20px rgba(0, 242, 254, 0.25)'
              }}
            >
              {probeLoading ? (
                <span>Dispatching HTTP Probe...</span>
              ) : (
                <>
                  <Play size={15} fill="currentColor" />
                  <span>Execute Real HTTP POST Probe Now</span>
                </>
              )}
            </button>

            <div style={{ fontSize: '0.72rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
              Total Packets Ingested: <strong style={{ color: '#fff' }}>{ingestPacketCount}</strong>
            </div>
          </div>

          {/* Live Result Feedback Banner */}
          {probeResult && (
            <div style={{
              background: probeResult.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: probeResult.success ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '10px',
              padding: '12px 14px',
              fontSize: '0.75rem',
              fontFamily: 'var(--font-mono)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '8px'
            }}>
              <div>
                <span style={{ color: probeResult.success ? '#34d399' : '#f87171', fontWeight: '700' }}>
                  {probeResult.success ? `✓ HTTP ${probeResult.status} CREATED` : '✕ ERROR'}
                </span>
                <span style={{ color: '#94a3b8', marginLeft: '10px' }}>
                  {probeResult.success 
                    ? `Node ${activePreset} synced to Digital Twin in ${probeResult.latencyMs}ms` 
                    : probeResult.error}
                </span>
              </div>
              <span className="badge badge-green" style={{ fontSize: '0.68rem' }}>
                DIGITAL TWIN REFLECTED
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
