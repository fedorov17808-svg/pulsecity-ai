import React, { useState } from 'react';
import { 
  Terminal, Send, CheckCircle2, Copy, Radio, 
  Wifi, Cpu, Code2, Sparkles, RefreshCw, Download, FileSpreadsheet
} from 'lucide-react';
import { downloadTelemetryCsv } from '../services/telemetryStore';
import { getSensorToken, setSensorToken, postTelemetry } from '../services/ingestClient';

export default function SensorIngestGateway({
  trafficNodes,
  onIngestTelemetry
}) {
  const [selectedTarget, setSelectedTarget] = useState('TR-01');
  const [payloadJson, setPayloadJson] = useState(`{
  "nodeId": "TR-01",
  "flowRateVehiclesPerHour": 4450,
  "congestionPercentage": 89,
  "incidentDetected": true,
  "incidentDetails": "Overturned trotro blocking left slip-road",
  "emergencyTransitActive": false
}`);
  const [ingestLogs, setIngestLogs] = useState([]);
  const [sensorToken, setSensorTokenInput] = useState(getSensorToken);
  const [copiedCurl, setCopiedCurl] = useState(false);

  const hostUrl = typeof window !== 'undefined' ? window.location.origin : 'https://pulsecity-ai.vercel.app';
  const curlSnippet = `curl -X POST ${hostUrl}/api/v1/telemetry/ingest \\
  -H "Content-Type: application/json" \\
  -H "X-Sensor-Token: $PULSECITY_SENSOR_TOKEN" \\
  -d '${payloadJson.replace(/\n/g, '').replace(/\s+/g, ' ')}'`;

  const handleSendPayload = async () => {
    try {
      const parsed = JSON.parse(payloadJson);

      // 1. Real HTTP POST to the backend API endpoint (round-trip time measured in postTelemetry)
      const { ok, status, data: responseData, roundTripMs } = await postTelemetry(payloadJson);

      if (!ok) {
        throw new Error(responseData.message || responseData.error || `HTTP ${status}`);
      }

      // 2. Synchronize with React Application State
      onIngestTelemetry(parsed);

      const newLog = {
        id: Date.now(),
        time: new Date().toLocaleTimeString(),
        status: `${status} CREATED`,
        msg: `HTTP POST /api/v1/telemetry/ingest [${parsed.nodeId}] accepted (round trip ${roundTripMs} ms)`
      };

      setIngestLogs((prev) => [newLog, ...prev.slice(0, 8)]);
    } catch (err) {
      alert("Ingest Error: " + err.message);
    }
  };

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(curlSnippet);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2500);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', height: 'clamp(460px, 58vh, 560px)' }}>
      {/* Left: Interactive Ingest Editor */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(0, 242, 254, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(0, 242, 254, 0.3)'
            }}>
              <Terminal size={20} color="var(--accent-cyan)" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', color: '#fff' }}>Sensor Ingest & Edge Gateway</h3>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                MQTT / HTTP Telemetry Injection Console for Field Testing
              </p>
            </div>
          </div>

          <div className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>
            <Radio size={12} className="pulse-indicator" /> GATEWAY READY
          </div>
        </div>

        {/* Quick Node Template Selection */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Target Sensor:</span>
            <select
              value={selectedTarget}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedTarget(val);
                if (val.startsWith('TR')) {
                  setPayloadJson(`{\n  "nodeId": "${val}",\n  "flowRateVehiclesPerHour": 4450,\n  "congestionPercentage": 89,\n  "incidentDetected": true,\n  "incidentDetails": "Overturned trotro blocking left slip-road",\n  "emergencyTransitActive": false,\n  "protocol": "MQTT_V5_EDGE"\n}`);
                }
              }}
              style={{
                flex: 1,
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                color: '#fff',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontFamily: 'var(--font-mono)'
              }}
            >
              <option value="TR-01">TR-01: Kwame Nkrumah Circle (Traffic Vision)</option>
              <option value="TR-02">TR-02: Tema Motorway (Traffic Vision)</option>
            </select>
          </div>

          {/* Quick Industrial Protocol Payload Presets */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', alignSelf: 'center' }}>Presets:</span>
            <button
              onClick={() => {
                setSelectedTarget('TR-01');
                setPayloadJson(`{\n  "nodeId": "TR-01",\n  "protocol": "MQTT_V5_TLS13",\n  "flowRateVehiclesPerHour": 4450,\n  "congestionPercentage": 89,\n  "incidentDetected": true,\n  "incidentDetails": "Overturned trotro blocking left slip-road",\n  "pcuWeighting": { "trotro": 2.5, "car": 1.0, "truck": 3.0 }\n}`);
              }}
              style={{
                background: 'rgba(168, 85, 247, 0.15)',
                border: '1px solid rgba(168, 85, 247, 0.35)',
                color: '#c084fc',
                padding: '3px 8px',
                borderRadius: '4px',
                fontSize: '0.68rem',
                fontFamily: 'var(--font-mono)',
                cursor: 'pointer'
              }}
            >
              👁️ Edge YOLOv8
            </button>
          </div>
        </div>

        {/* JSON Editor Textarea */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginBottom: '14px' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>
            PAYLOAD_BODY (JSON)
          </div>
          <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', gap: '8px', alignItems: 'center' }}>
            X-Sensor-Token
            <input
              type="password"
              value={sensorToken}
              onChange={(e) => { setSensorTokenInput(e.target.value); setSensorToken(e.target.value.trim()); }}
              placeholder="paste PULSECITY_SENSOR_TOKEN (kept in this browser only)"
              style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: '#fff', padding: '4px 8px', fontFamily: 'var(--font-mono)', fontSize: '0.74rem' }}
            />
          </label>
          <textarea
            value={payloadJson}
            onChange={(e) => setPayloadJson(e.target.value)}
            style={{
              flex: 1,
              width: '100%',
              background: '#090d16',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '12px',
              color: '#38bdf8',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              lineHeight: '1.5',
              resize: 'none',
              outline: 'none'
            }}
          />
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleSendPayload}
            className="btn-primary"
            style={{ flex: 1 }}
          >
            <Send size={15} />
            Transmit Ingest Telemetry
          </button>
        </div>
      </div>

      {/* Right: cURL Snippet & Ingestion Event Logs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* cURL integration box */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f59e0b', fontSize: '0.82rem', fontWeight: 'bold' }}>
              <Code2 size={16} />
              PRODUCTION REST API & CLI BENCH
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => downloadTelemetryCsv()}
                className="btn-secondary"
                style={{ padding: '4px 10px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '5px' }}
                title="Download full ingested telemetry dataset as CSV"
              >
                <Download size={13} color="#34d399" />
                Export CSV
              </button>
              <button
                onClick={handleCopyCurl}
                className="btn-secondary"
                style={{ padding: '4px 10px', fontSize: '0.72rem' }}
              >
                {copiedCurl ? <CheckCircle2 size={13} color="#10b981" /> : <Copy size={13} />}
                {copiedCurl ? 'Copied!' : 'Copy cURL'}
              </button>
            </div>
          </div>
          <pre style={{
            background: 'rgba(0,0,0,0.5)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '12px',
            fontSize: '0.74rem',
            fontFamily: 'var(--font-mono)',
            color: '#a5f3fc',
            overflowX: 'auto',
            whiteSpace: 'pre-wrap'
          }}>
            {curlSnippet}
          </pre>
          <div style={{ marginTop: '8px', fontSize: '0.68rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
            💻 Test from terminal: <span style={{ color: '#38bdf8' }}>python3 hardware/simulate_esp32_node.py --node TR-01 --interval 3</span>
          </div>
        </div>

        {/* Live Ingestion Logs */}
        <div className="glass-panel" style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Wifi size={16} color="var(--accent-cyan)" />
              <h4 style={{ fontSize: '0.92rem', color: '#fff' }}>Gateway Ingestion Event Log (Persistent)</h4>
            </div>
            <button 
              onClick={() => downloadTelemetryCsv()}
              style={{
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                color: '#34d399',
                borderRadius: '6px',
                padding: '2px 8px',
                fontSize: '0.68rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <FileSpreadsheet size={11} /> Audit CSV
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {ingestLogs.map((log) => (
              <div
                key={log.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontSize: '0.74rem',
                  fontFamily: 'var(--font-mono)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>[{log.time}]</span>{' '}
                  <span style={{ color: '#f1f5f9' }}>{log.msg}</span>
                </div>
                <span style={{ color: '#10b981', fontWeight: 'bold' }}>{log.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
