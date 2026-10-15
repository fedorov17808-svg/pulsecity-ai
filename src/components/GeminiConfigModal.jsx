import React, { useState } from 'react';
import { 
  Sparkles, Key, CheckCircle2, AlertTriangle, ShieldCheck, 
  ExternalLink, Trash2, RefreshCw, Cpu, Activity 
} from 'lucide-react';

export default function GeminiConfigModal({ isOpen, onClose, apiKey, setApiKey }) {
  const [inputKey, setInputKey] = useState(apiKey || '');
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null); // { success: boolean, message: string, latencyMs?: number }

  if (!isOpen) return null;

  const handleSave = () => {
    const trimmed = inputKey.trim();
    setApiKey(trimmed);
    try {
      if (trimmed) {
        localStorage.setItem('pulsecity_gemini_key', trimmed);
      } else {
        localStorage.removeItem('pulsecity_gemini_key');
      }
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }


    setTestResult({
      success: true,
      message: trimmed ? "Gemini API key saved in this browser (localStorage)." : "Key removed. Assistant will use rule-based mode (AI offline)."
    });
  };

  const handleTestConnection = async () => {
    const keyToTest = inputKey.trim() || apiKey.trim();
    if (!keyToTest) {
      setTestResult({
        success: false,
        message: "Please enter an API Key before testing."
      });
      return;
    }

    setTesting(true);
    setTestResult(null);
    const startTime = performance.now();

    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${keyToTest}`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Ping. Respond with one word: Online." }] }]
        })
      });

      const latencyMs = Math.round(performance.now() - startTime);

      if (response.ok) {
        const data = await response.json();
        const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "Online";
        setTestResult({
          success: true,
          message: `Connection Verified: Gemini 1.5 Flash responded ("${replyText}").`,
          latencyMs
        });
      } else {
        const errData = await response.json().catch(() => ({}));
        setTestResult({
          success: false,
          message: `API Error (${response.status}): ${errData.error?.message || "Invalid or quota-exceeded key."}`,
          latencyMs
        });
      }
    } catch (err) {
      setTestResult({
        success: false,
        message: `Network Error: ${err.message}. (PulseCity fallback to synthetic engine is active).`
      });
    } finally {
      setTesting(false);
    }
  };

  const handleClear = () => {
    setInputKey('');
    setApiKey('');
    localStorage.removeItem('pulsecity_gemini_key');
    setTestResult({
      success: true,
      message: "API Key cleared. Switched to offline deterministic municipal engine."
    });
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="gemini-config-title">
      <div 
        className="modal-card" 
        style={{ maxWidth: '640px', border: '1px solid rgba(0, 242, 254, 0.4)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header" style={{ background: 'rgba(9, 14, 24, 0.8)', borderBottom: '1px solid rgba(0, 242, 254, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'rgba(0, 242, 254, 0.12)',
              border: '1px solid rgba(0, 242, 254, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-cyan)'
            }}>
              <Sparkles size={22} />
            </div>
            <div>
              <h3 id="gemini-config-title" style={{ fontSize: '1.15rem', color: '#fff' }}>Gemini Neural Engine Hub</h3>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Multi-Modal Computer Vision & Incident Commander Dispatch Configuration
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="modal-close-btn"
            aria-label="Close Gemini configuration modal"
          >
            ×
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Status Banner */}
          <div style={{
            background: apiKey ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
            border: apiKey ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(245, 158, 11, 0.35)',
            borderRadius: '10px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: apiKey ? '#10b981' : '#f59e0b',
                boxShadow: apiKey ? '0 0 10px #10b981' : '0 0 10px #f59e0b'
              }} />
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#fff' }}>
                  {apiKey ? 'Live Gemini 1.5 Flash Connected' : 'Autonomous Local Heuristics Active'}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                  {apiKey 
                    ? 'Real-time multi-modal traffic frame inference and AI commander live.' 
                    : 'No key: Webster maths and COCO-SSD run locally; the assistant uses rule-based mode.'}
                </div>
              </div>
            </div>
            <span className={`badge ${apiKey ? 'badge-emerald' : 'badge-amber'}`} style={{ fontSize: '0.7rem' }}>
              {apiKey ? 'API KEY ONLINE' : 'OFFLINE SIMULATOR'}
            </span>
          </div>

          {/* Key Input */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#e2e8f0', marginBottom: '8px' }}>
              Google Gemini API Key:
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <input
                  type={showKey ? 'text' : 'password'}
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  placeholder="AIzaSy..."
                  style={{
                    width: '100%',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '8px',
                    padding: '10px 40px 10px 14px',
                    color: '#fff',
                    fontSize: '0.85rem',
                    fontFamily: 'var(--font-mono)',
                    outline: 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    fontSize: '0.75rem'
                  }}
                  title={showKey ? 'Hide key' : 'Show key'}
                >
                  {showKey ? 'Hide' : 'Show'}
                </button>
              </div>

              <button
                type="button"
                onClick={handleSave}
                className="btn-primary"
                style={{ padding: '8px 18px', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
              >
                <CheckCircle2 size={15} />
                Save Key
              </button>

              {apiKey && (
                <button
                  type="button"
                  onClick={handleClear}
                  style={{
                    background: 'rgba(244, 63, 94, 0.15)',
                    border: '1px solid rgba(244, 63, 94, 0.3)',
                    color: '#f87171',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.8rem'
                  }}
                  title="Remove saved API key and revert to simulation mode"
                >
                  <Trash2 size={14} />
                  Clear
                </button>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', fontSize: '0.72rem', color: '#64748b' }}>
              <span>Stored locally in browser `localStorage`. Never sent to third parties.</span>
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noreferrer"
                style={{ color: 'var(--accent-cyan)', display: 'inline-flex', alignItems: 'center', gap: '3px', textDecoration: 'none' }}
              >
                Get Gemini API Key <ExternalLink size={11} />
              </a>
            </div>
          </div>

          {/* Test Connection Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handleTestConnection}
              disabled={testing}
              className="btn-secondary"
              style={{ padding: '8px 16px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <RefreshCw size={14} className={testing ? 'animate-spin' : ''} />
              {testing ? 'Testing Gemini API...' : 'Test Connection Latency'}
            </button>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
              Verifies endpoint connectivity and token quota
            </span>
          </div>

          {/* Test Result Feedback */}
          {testResult && (
            <div style={{
              background: testResult.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: testResult.success ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              fontSize: '0.8rem',
              color: testResult.success ? '#34d399' : '#f87171'
            }}>
              {testResult.success ? <ShieldCheck size={18} /> : <AlertTriangle size={18} />}
              <div style={{ flex: 1 }}>
                <div>{testResult.message}</div>
                {testResult.latencyMs && (
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                    Round-trip latency: {testResult.latencyMs}ms
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Architecture Guarantee Note */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '10px',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 'bold', color: '#fff' }}>
              <Cpu size={15} color="var(--accent-cyan)" />
              Offline Autonomy by Design:
            </div>
            <p style={{ fontSize: '0.74rem', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
              Webster signal timing and COCO-SSD vehicle detection run in your browser without any key. A Gemini API key only enables the optional Gemini image analysis and the AI mode of the assistant; without it the assistant runs in a clearly labelled rule-based mode.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(9, 14, 24, 0.6)',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            className="btn-secondary"
            style={{ padding: '6px 18px', fontSize: '0.8rem' }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
