import React, { useState } from 'react';
import { 
  Eye, Zap, AlertTriangle, CheckCircle, ShieldAlert, 
  Sparkles, RefreshCw, Sliders, Activity, Video, Key 
} from 'lucide-react';
import { analyzeTrafficVision } from '../services/geminiService';
import confetti from 'canvas-confetti';

export default function TrafficVisionModal({
  selectedNode,
  allTrafficNodes,
  onClose,
  onApplyOptimization,
  apiKey,
  setApiKey
}) {
  const [activeCameraNode, setActiveCameraNode] = useState(selectedNode || allTrafficNodes[0]);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [customKey, setCustomKey] = useState(apiKey || '');
  const [applied, setApplied] = useState(false);

  const handleRunAnalysis = async () => {
    setAnalyzing(true);
    setAnalysisResult(null);
    setApplied(false);

    try {
      const result = await analyzeTrafficVision(
        apiKey,
        activeCameraNode.name,
        null,
        activeCameraNode.alert
      );
      setAnalysisResult(result);
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleApply = () => {
    if (analysisResult) {
      onApplyOptimization(activeCameraNode.id, analysisResult.greenLightDurationSeconds);
      setApplied(true);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 }
      });
    }
  };

  const handleSaveKey = () => {
    setApiKey(customKey);
    localStorage.setItem('pulsecity_gemini_key', customKey);
    setShowKeyInput(false);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(3, 7, 18, 0.85)',
      backdropFilter: 'blur(16px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '20px'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '920px',
        maxHeight: '90vh',
        overflowY: 'auto',
        border: '1px solid var(--border-glow)',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), var(--shadow-glow-cyan)',
        padding: '24px'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(0, 242, 254, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(0, 242, 254, 0.3)'
            }}>
              <Video size={22} color="var(--accent-cyan)" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '1.25rem', color: '#fff' }}>Gemini CCTV Traffic Sentinel</h3>
                <span className="badge badge-cyan" style={{ fontSize: '0.68rem' }}>Multi-Modal Vision</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Real-time visual stream inference for bottleneck alleviation & emergency wave priority
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button 
              onClick={() => setShowKeyInput(!showKeyInput)}
              className="btn-secondary"
              style={{ fontSize: '0.78rem', padding: '6px 12px' }}
            >
              <Key size={14} />
              {apiKey ? 'API Key Active' : 'Configure Gemini Key'}
            </button>
            <button 
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '1.5rem',
                cursor: 'pointer',
                padding: '0 8px'
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* API Key Drawer */}
        {showKeyInput && (
          <div style={{
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(0, 242, 254, 0.25)',
            padding: '14px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '16px',
            display: 'flex',
            gap: '10px',
            alignItems: 'center'
          }}>
            <input 
              type="password"
              placeholder="Paste Google AI Studio Gemini API Key (Optional — intelligent neural fallback included)"
              value={customKey}
              onChange={(e) => setCustomKey(e.target.value)}
              style={{
                flex: 1,
                background: 'rgba(0,0,0,0.5)',
                border: '1px solid var(--border-subtle)',
                color: '#fff',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '0.82rem',
                fontFamily: 'var(--font-mono)'
              }}
            />
            <button onClick={handleSaveKey} className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.82rem' }}>
              Save
            </button>
          </div>
        )}

        {/* Camera Selector Tabs */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '16px', paddingBottom: '4px' }}>
          {allTrafficNodes.map((node) => {
            const isActive = activeCameraNode.id === node.id;
            return (
              <button
                key={node.id}
                onClick={() => {
                  setActiveCameraNode(node);
                  setAnalysisResult(null);
                  setApplied(false);
                }}
                style={{
                  background: isActive ? 'rgba(0, 242, 254, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                  border: isActive ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                  color: isActive ? '#fff' : 'var(--text-secondary)',
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.78rem',
                  fontFamily: 'var(--font-display)',
                  fontWeight: '600',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span style={{ 
                  width: '6px', 
                  height: '6px', 
                  borderRadius: '50%', 
                  background: node.congestion > 75 ? '#f43f5e' : '#10b981' 
                }} />
                {node.name.split(' (')[0]}
              </button>
            );
          })}
        </div>

        {/* CCTV Viewport & Inference Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
          {/* Simulated CCTV Camera Feed with Bounding Box overlays */}
          <div style={{
            position: 'relative',
            height: '340px',
            background: 'linear-gradient(180deg, #0a1120 0%, #03060c 100%)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'inset 0 0 40px rgba(0, 0, 0, 0.9)'
          }}>
            {/* Visual Scanline Effect */}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 1px, transparent 1px, transparent 2px)',
              pointerEvents: 'none',
              zIndex: 10
            }} />

            {/* Simulated Junction Visualization */}
            <svg viewBox="0 0 400 300" style={{ width: '100%', height: '100%' }}>
              {/* Road Geometry */}
              <rect x="0" y="110" width="400" height="90" fill="#151e2e" />
              <rect x="155" y="0" width="90" height="300" fill="#151e2e" />

              {/* Lane Markings */}
              <line x1="0" y1="155" x2="400" y2="155" stroke="#f59e0b" strokeWidth="2" strokeDasharray="10 8" />
              <line x1="200" y1="0" x2="200" y2="300" stroke="#f59e0b" strokeWidth="2" strokeDasharray="10 8" />

              {/* Bounding Boxes for Vehicles */}
              <g id="detected-objects">
                {/* Vehicle 1 */}
                <rect x="70" y="125" width="45" height="25" fill="none" stroke="#00f2fe" strokeWidth="1.5" />
                <text x="70" y="120" fill="#00f2fe" fontSize="9" fontFamily="var(--font-mono)">SUV (98%)</text>

                {/* Trotro / Minibus 2 */}
                <rect x="130" y="122" width="60" height="30" fill="none" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="130" y="117" fill="#38bdf8" fontSize="9" fontFamily="var(--font-mono)">TroTro #12</text>

                {/* Stalled Truck if high congestion */}
                {activeCameraNode.congestion > 75 && (
                  <g>
                    <rect x="230" y="130" width="75" height="35" fill="rgba(244, 63, 94, 0.2)" stroke="#f43f5e" strokeWidth="2" />
                    <text x="230" y="124" fill="#f43f5e" fontSize="9" fontFamily="var(--font-mono)" fontWeight="bold">
                      HAZARD: STALLED TRUCK
                    </text>
                  </g>
                )}

                {/* Approaching Ambulance */}
                <rect x="180" y="220" width="35" height="50" fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="4 2" />
                <text x="220" y="245" fill="#10b981" fontSize="9" fontFamily="var(--font-mono)" fontWeight="bold">
                  AMB-04 (PRIORITY)
                </text>
              </g>
            </svg>

            {/* Camera Info HUD */}
            <div style={{
              position: 'absolute',
              top: '12px',
              left: '14px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              color: '#00f2fe',
              background: 'rgba(0,0,0,0.65)',
              padding: '4px 8px',
              borderRadius: '4px',
              zIndex: 15
            }}>
              ● REC [FEED-0{activeCameraNode.id.split('-')[1]}] // {activeCameraNode.cameraFeed}
            </div>

            <div style={{
              position: 'absolute',
              bottom: '12px',
              right: '14px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
              background: 'rgba(0,0,0,0.65)',
              padding: '4px 8px',
              borderRadius: '4px',
              zIndex: 15
            }}>
              FPS: 30.0 // RES: 1080p // LATENCY: 24ms
            </div>
          </div>

          {/* AI Analysis and Dispatch Recommendation Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                marginBottom: '16px'
              }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Observed Arterial Status
                </div>
                <h4 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '8px' }}>
                  {activeCameraNode.name}
                </h4>
                <div style={{ display: 'flex', gap: '16px', fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }}>
                  <div>Congestion: <span style={{ color: activeCameraNode.congestion > 70 ? '#f43f5e' : '#10b981', fontWeight: 'bold' }}>{activeCameraNode.congestion}%</span></div>
                  <div>Flow: <span style={{ color: '#38bdf8' }}>{activeCameraNode.flowRate} v/h</span></div>
                  <div>Light: <span style={{ color: activeCameraNode.lightState === 'GREEN' ? '#10b981' : '#f43f5e' }}>{activeCameraNode.lightState}</span></div>
                </div>
              </div>

              {/* Analysis Result Display */}
              {analysisResult ? (
                <div style={{
                  background: 'rgba(0, 242, 254, 0.05)',
                  border: '1px solid rgba(0, 242, 254, 0.3)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  animation: 'fadeIn 0.3s ease'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-cyan)', fontSize: '0.8rem', fontWeight: 'bold' }}>
                      <Sparkles size={15} />
                      GEMINI INFERENCE READY
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      Conf: {Math.round(analysisResult.confidenceScore * 100)}%
                    </span>
                  </div>

                  <p style={{ fontSize: '0.84rem', color: '#f1f5f9', lineHeight: '1.4', marginBottom: '10px' }}>
                    {analysisResult.recommendedAction}
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '6px 8px', borderRadius: '6px' }}>
                      Optimal Green: <strong style={{ color: '#10b981' }}>{analysisResult.greenLightDurationSeconds}s</strong>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '6px 8px', borderRadius: '6px' }}>
                      Delay Saved: <strong style={{ color: '#38bdf8' }}>{analysisResult.estimatedDelaySavedMinutes}m</strong>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: '24px',
                  border: '1px dashed var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-muted)',
                  fontSize: '0.82rem'
                }}>
                  Click below to run computer vision inference with Gemini Multi-Modal model.
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button
                onClick={handleRunAnalysis}
                disabled={analyzing}
                className="btn-primary"
                style={{ flex: 1 }}
              >
                {analyzing ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Analyzing Feed...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Run Gemini Vision
                  </>
                )}
              </button>

              {analysisResult && (
                <button
                  onClick={handleApply}
                  disabled={applied}
                  className="btn-secondary"
                  style={{
                    background: applied ? 'rgba(16, 185, 129, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                    borderColor: applied ? '#10b981' : '#38bdf8',
                    color: '#fff'
                  }}
                >
                  {applied ? (
                    <>
                      <CheckCircle size={16} color="#10b981" />
                      Signal Updated
                    </>
                  ) : (
                    <>
                      <Sliders size={16} />
                      Deploy Green-Wave
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
