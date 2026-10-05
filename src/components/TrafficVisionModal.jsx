import React, { useState, useRef, useEffect } from 'react';
import { 
  Eye, Zap, AlertTriangle, CheckCircle, ShieldAlert, 
  Sparkles, RefreshCw, Sliders, Activity, Video, Key, 
  Upload, Camera, Calculator, Play, Pause, Disc, Gauge 
} from 'lucide-react';
import { analyzeTrafficVision } from '../services/geminiService';
import CctvTrafficCanvas from './CctvTrafficCanvas';
import confetti from 'canvas-confetti';

const SAMPLE_PREVIEWS = {
  "CAM-01": "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='640' height='400' viewBox='0 0 640 400'><rect width='640' height='400' fill='%23111827'/><path d='M0 160 L640 160 M0 240 L640 240' stroke='%23374151' stroke-width='4'/><line x1='0' y1='200' x2='640' y2='200' stroke='%23eab308' stroke-dasharray='15,10' stroke-width='3'/><rect x='140' y='170' width='80' height='45' fill='%233b82f6' rx='6'/><text x='145' y='198' fill='white' font-family='monospace' font-size='12'>TROTRO #14</text><rect x='260' y='172' width='70' height='40' fill='%23ef4444' rx='4'/><text x='265' y='196' fill='white' font-family='monospace' font-size='11'>TAXI CAB</text><rect x='380' y='165' width='130' height='55' fill='%23f97316' rx='8'/><text x='390' y='198' fill='white' font-family='monospace' font-size='13'>HAULAGE TRUCK</text><text x='30' y='50' fill='%2300f2fe' font-family='monospace' font-size='15'>FEED-01: KWAME NKRUMAH CIRCLE INTERCHANGE</text></svg>",
  "CAM-02": "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='640' height='400' viewBox='0 0 640 400'><rect width='640' height='400' fill='%230f172a'/><path d='M0 140 L640 140 M0 260 L640 260' stroke='%23334155' stroke-width='6'/><line x1='0' y1='200' x2='640' y2='200' stroke='%23f59e0b' stroke-dasharray='20,15' stroke-width='4'/><rect x='180' y='150' width='160' height='70' fill='%23dc2626' rx='6'/><text x='190' y='190' fill='white' font-family='monospace' font-size='14'>STALLED TRUCK (LANE 2)</text><rect x='440' y='160' width='90' height='50' fill='%2310b981' rx='6'/><text x='445' y='190' fill='white' font-family='monospace' font-size='12'>AMBULANCE</text><text x='30' y='50' fill='%23f43f5e' font-family='monospace' font-size='15'>FEED-02: TEMA MOTORWAY CORRIDOR [INCIDENT HAZARD]</text></svg>"
};

export default function TrafficVisionModal({
  selectedNode,
  allTrafficNodes,
  onClose,
  onApplyOptimization,
  apiKey,
  setApiKey
}) {
  const [activeCameraNode, setActiveCameraNode] = useState(selectedNode || allTrafficNodes[0]);
  
  // Stream mode: 'cctv_preset', 'webcam', 'uploaded_media'
  const [streamMode, setStreamMode] = useState('cctv_preset');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [customKey, setCustomKey] = useState(apiKey || '');
  const [applied, setApplied] = useState(false);

  // Video / Webcam Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const [uploadedVideoSrc, setUploadedVideoSrc] = useState(null);
  const [uploadedImageSrc, setUploadedImageSrc] = useState(null);
  const [webcamStream, setWebcamStream] = useState(null);
  const [webcamActive, setWebcamActive] = useState(false);
  const [webcamError, setWebcamError] = useState(null);

  // Telemetry Metrics
  const [fps, setFps] = useState(30);
  const [inferenceLatencyMs, setInferenceLatencyMs] = useState(28);

  const stopWebcam = () => {
    if (webcamStream) {
      webcamStream.getTracks().forEach((track) => track.stop());
      setWebcamStream(null);
    }
    setWebcamActive(false);
  };

  // Cleanup webcam stream on unmount
  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, [webcamStream]);

  const handleStartWebcam = async () => {
    setWebcamError(null);
    try {
      if (webcamStream) {
        stopWebcam();
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 400, facingMode: "user" }
      });
      setWebcamStream(stream);
      setWebcamActive(true);
      setStreamMode('webcam');
      setAnalysisResult(null);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.warn("Webcam access error:", err);
      setWebcamError("Could not access webcam. Please check browser permissions.");
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    stopWebcam();
    const fileUrl = URL.createObjectURL(file);

    if (file.type.startsWith('video/')) {
      setUploadedVideoSrc(fileUrl);
      setUploadedImageSrc(null);
      setStreamMode('uploaded_media');
      setAnalysisResult(null);
    } else if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedImageSrc(reader.result);
        setUploadedVideoSrc(null);
        setStreamMode('uploaded_media');
        setAnalysisResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // Draw bounding boxes on canvas whenever analysisResult changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (analysisResult?.detectedObjects) {
      analysisResult.detectedObjects.forEach((obj) => {
        const [ymin, xmin, ymax, xmax] = obj.box_2d || [0, 0, 0, 0];
        
        const x = (xmin / 1000) * canvas.width;
        const y = (ymin / 1000) * canvas.height;
        const w = ((xmax - xmin) / 1000) * canvas.width;
        const h = ((ymax - ymin) / 1000) * canvas.height;

        const isHazard = obj.isHazard || obj.label.toLowerCase().includes('hazard') || obj.label.toLowerCase().includes('stalled');
        const isAmbulance = obj.isAmbulance || obj.label.toLowerCase().includes('ambulance');
        const color = isHazard ? '#f43f5e' : isAmbulance ? '#10b981' : '#00f2fe';

        // Draw Bounding Box with rounded corners
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        ctx.strokeRect(x, y, w, h);
        ctx.shadowBlur = 0;

        // Label Tag Box
        ctx.fillStyle = color;
        const labelText = `${obj.label} (${Math.round(obj.confidence * 100)}%)`;
        ctx.font = '11px "JetBrains Mono", monospace';
        const textMetrics = ctx.measureText(labelText);
        ctx.fillRect(x, Math.max(0, y - 18), textMetrics.width + 10, 18);

        // Label Text
        ctx.fillStyle = '#000';
        ctx.fillText(labelText, x + 5, Math.max(12, y - 5));
      });
    }
  }, [analysisResult]);

  // Capture current video or canvas frame as Base64 for Gemini
  const captureFrameBase64 = () => {
    if (streamMode === 'webcam' && videoRef.current) {
      const captureCanvas = document.createElement('canvas');
      captureCanvas.width = 640;
      captureCanvas.height = 400;
      const ctx = captureCanvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, 640, 400);
      return captureCanvas.toDataURL('image/jpeg', 0.8);
    }
    if (uploadedImageSrc) {
      return uploadedImageSrc;
    }
    return null;
  };

  const handleRunAnalysis = async () => {
    setAnalyzing(true);
    setAnalysisResult(null);
    setApplied(false);
    const startTime = performance.now();

    try {
      const frameBase64 = captureFrameBase64();
      const result = await analyzeTrafficVision(
        apiKey,
        activeCameraNode.name,
        frameBase64,
        activeCameraNode.alert
      );
      setAnalysisResult(result);
      const elapsed = Math.round(performance.now() - startTime);
      setInferenceLatencyMs(elapsed);
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
    <div className="modal-backdrop" onClick={() => { stopWebcam(); onClose(); }}>
      <div 
        className="modal-card" 
        style={{
          maxWidth: '1020px',
          border: '1px solid var(--border-glow)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85), var(--shadow-glow-cyan)',
          padding: '24px'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'rgba(0, 242, 254, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(0, 242, 254, 0.35)'
            }}>
              <Video size={24} color="var(--accent-cyan)" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '1.25rem', color: '#fff' }}>Deep Vision & Live Stream Sentinel</h3>
                <span className="badge badge-cyan" style={{ fontSize: '0.68rem' }}>Phase 1 Engine</span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Multi-Modal Stream Inference • Live WebCam & MP4 Video Ingestion • Webster Formulation
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
              onClick={() => {
                stopWebcam();
                onClose();
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '1.6rem',
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
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid rgba(0, 242, 254, 0.3)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '16px',
            display: 'flex',
            gap: '10px',
            alignItems: 'center'
          }}>
            <input 
              type="password"
              placeholder="Paste Google AI Studio Gemini Key (Optional — intelligent neural computer vision fallback active)"
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

        {/* Input Mode Switcher: Presets, Live Webcam, or Video/Image Upload */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '14px',
          background: 'rgba(255, 255, 255, 0.03)',
          padding: '8px 12px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)'
        }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>STREAM SOURCE:</span>
            
            <button
              onClick={() => {
                stopWebcam();
                setUploadedVideoSrc(null);
                setUploadedImageSrc(null);
                setStreamMode('cctv_preset');
                setAnalysisResult(null);
              }}
              style={{
                background: streamMode === 'cctv_preset' ? 'rgba(0, 242, 254, 0.2)' : 'transparent',
                border: streamMode === 'cctv_preset' ? '1px solid var(--accent-cyan)' : '1px solid transparent',
                color: streamMode === 'cctv_preset' ? '#fff' : 'var(--text-secondary)',
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '0.74rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Accra CCTV Feeds
            </button>

            <button
              onClick={handleStartWebcam}
              style={{
                background: streamMode === 'webcam' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                border: streamMode === 'webcam' ? '1px solid #10b981' : '1px solid transparent',
                color: streamMode === 'webcam' ? '#34d399' : 'var(--text-secondary)',
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '0.74rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Camera size={13} />
              {webcamActive ? '● Live WebCam Active' : 'Connect WebCam'}
            </button>
          </div>

          {/* Upload File Button */}
          <div>
            <input 
              type="file" 
              ref={fileInputRef} 
              accept="image/*,video/*" 
              onChange={handleFileUpload} 
              style={{ display: 'none' }} 
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-secondary"
              style={{ padding: '5px 12px', fontSize: '0.74rem', gap: '6px' }}
            >
              <Upload size={13} />
              Upload Video / Photo
            </button>
          </div>
        </div>

        {webcamError && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.4)',
            color: '#fb7185',
            padding: '8px 14px',
            borderRadius: '6px',
            fontSize: '0.78rem',
            marginBottom: '12px'
          }}>
            {webcamError}
          </div>
        )}

        {/* CCTV Junction Preset Tabs (if in preset mode) */}
        {streamMode === 'cctv_preset' && (
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '14px', paddingBottom: '2px' }}>
            {allTrafficNodes.slice(0, 4).map((node) => {
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
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '0.74rem',
                    fontFamily: 'var(--font-display)',
                    fontWeight: '600',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {node.name.split(' (')[0]}
                </button>
              );
            })}
          </div>
        )}

        {/* Viewport and Inference Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: '20px' }}>
          {/* Main Visual Stream Viewport */}
          <div style={{
            position: 'relative',
            height: '370px',
            background: '#0a0f18',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'inset 0 0 50px rgba(0, 0, 0, 0.9)'
          }}>
            {/* 1. WebCam Mode */}
            {streamMode === 'webcam' && (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            )}

            {/* 2. Uploaded Video Mode */}
            {streamMode === 'uploaded_media' && uploadedVideoSrc && (
              <video
                src={uploadedVideoSrc}
                autoPlay
                loop
                muted
                playsInline
                controls
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            )}

            {/* 3. Live 30 FPS Animated Computer Vision Stream in Preset Mode */}
            {streamMode === 'cctv_preset' && (
              <CctvTrafficCanvas
                cameraName={activeCameraNode.name}
                lightState={activeCameraNode.lightState || 'GREEN'}
                isIncident={activeCameraNode.incidentActive || false}
              />
            )}

            {/* 4. Uploaded Static Image */}
            {streamMode === 'uploaded_media' && uploadedImageSrc && (
              <img 
                src={uploadedImageSrc} 
                alt="Traffic Stream"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            )}

            {/* Overlay HTML5 Canvas for Real Bounding Boxes */}
            <canvas 
              ref={canvasRef}
              width={640}
              height={400}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 10
              }}
            />

            {/* Visual Scanline Effect */}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.12) 0px, rgba(0,0,0,0.12) 1px, transparent 1px, transparent 2px)',
              pointerEvents: 'none',
              zIndex: 12
            }} />

            {/* Live Camera HUD Telemetry */}
            <div style={{
              position: 'absolute',
              top: '12px',
              left: '14px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              color: '#00f2fe',
              background: 'rgba(0,0,0,0.75)',
              padding: '4px 10px',
              borderRadius: '4px',
              zIndex: 15,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f43f5e' }} className="pulse-indicator" />
              LIVE // {streamMode === 'webcam' ? 'LAPTOP WEBCAM STREAM' : streamMode === 'uploaded_media' ? 'USER UPLOAD STREAM' : activeCameraNode.cameraFeed}
            </div>

            <div style={{
              position: 'absolute',
              bottom: '12px',
              right: '14px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
              background: 'rgba(0,0,0,0.75)',
              padding: '4px 10px',
              borderRadius: '4px',
              zIndex: 15
            }}>
              FPS: {fps} • INFERENCE: {inferenceLatencyMs}ms • RES: 640x400
            </div>
          </div>

          {/* Right Inference & Webster Calculation Console */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              {/* Arterial Context */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                marginBottom: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontSize: '0.95rem', color: '#fff' }}>
                    {activeCameraNode.name}
                  </h4>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    GPS: {activeCameraNode.lat}°N, {activeCameraNode.lng}°W
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '12px', fontSize: '0.76rem', fontFamily: 'var(--font-mono)', marginTop: '6px' }}>
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
                  padding: '14px',
                  animation: 'fadeIn 0.3s ease'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-cyan)', fontSize: '0.78rem', fontWeight: 'bold' }}>
                      <Sparkles size={14} />
                      GEMINI VISION DETECTIONS ({analysisResult.detectedObjects?.length || 0})
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      Confidence: {Math.round(analysisResult.confidenceScore * 100)}%
                    </span>
                  </div>

                  <p style={{ fontSize: '0.8rem', color: '#f1f5f9', lineHeight: '1.4', marginBottom: '10px' }}>
                    {analysisResult.recommendedAction}
                  </p>

                  {/* Mathematical Webster Optimization Box */}
                  {analysisResult.websterOptimization && (
                    <div style={{
                      background: 'rgba(0, 0, 0, 0.45)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      borderRadius: '8px',
                      padding: '10px',
                      marginBottom: '10px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: '#38bdf8', fontWeight: 'bold', marginBottom: '4px' }}>
                        <Calculator size={13} />
                        WEBSTER'S MATHEMATICAL OPTIMIZATION
                      </div>
                      <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                        Proof: {analysisResult.websterOptimization.mathProof.formulaValues}
                      </div>
                      <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: '#34d399', marginTop: '2px' }}>
                        Optimal Cycle C₀ = <strong>{analysisResult.websterOptimization.optimumCycleLengthSeconds}s</strong> • Green Phase = <strong>{analysisResult.greenLightDurationSeconds}s</strong>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '6px 8px', borderRadius: '6px' }}>
                      Delay Saved: <strong style={{ color: '#38bdf8' }}>-{analysisResult.estimatedDelaySavedMinutes} mins</strong>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '6px 8px', borderRadius: '6px' }}>
                      Priority Wave: <strong style={{ color: analysisResult.ambulanceDetected ? '#10b981' : 'var(--text-muted)' }}>{analysisResult.ambulanceDetected ? 'AMBULANCE DETECTED' : 'STANDARD'}</strong>
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
                  fontSize: '0.78rem'
                }}>
                  {streamMode === 'webcam' ? 'Point your webcam at an object or road, then click below to execute multi-modal inference.' : 'Click below to extract frame and run Gemini multi-modal detection.'}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
              <button
                onClick={handleRunAnalysis}
                disabled={analyzing}
                className="btn-primary"
                style={{ flex: 1 }}
              >
                {analyzing ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" />
                    Inferencing Frame ({inferenceLatencyMs}ms)...
                  </>
                ) : (
                  <>
                    <Sparkles size={15} />
                    Run Frame Analysis
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
                      <CheckCircle size={15} color="#10b981" />
                      Webster Cycle Applied
                    </>
                  ) : (
                    <>
                      <Sliders size={15} />
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
