import React, { useState } from 'react';
import { Phone, MessageSquare, Radio, Shield, Send, ArrowLeft, RefreshCw, CheckCircle2, Volume2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function CitizenUssdModal({ isOpen, onClose, trafficNodes, energyNodes, ecoNodes, onReportIncident }) {
  const [ussdStep, setUssdStep] = useState('DIALER'); // 'DIALER', 'MENU', 'TRAFFIC', 'DUMSOR', 'FLOOD', 'REPORT', 'REPORT_CONFIRM'
  const [dialNumber, setDialNumber] = useState('*920*26#');
  const [reportText, setReportText] = useState('');
  const [lastTicketId, setLastTicketId] = useState('');
  const [activeSession, setActiveSession] = useState(false);
  const [lang, setLang] = useState('EN'); // 'EN' | 'TWI'

  if (!isOpen) return null;

  const playBeep = (freq = 800) => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.09);
    } catch {
      // Audio fallback
    }
  };

  const handleDial = () => {
    playBeep(1200);
    if (dialNumber.trim() === '*920*26#' || dialNumber.trim() === '*920#') {
      setActiveSession(true);
      setUssdStep('MENU');
    } else {
      alert("Invalid MMI code. Dial *920*26# for PulseCity Accra.");
    }
  };

  const handleKeyPress = (num) => {
    playBeep(900 + parseInt(num === '*' ? 10 : num === '#' ? 12 : num, 10) * 40);
    if (ussdStep === 'DIALER') {
      setDialNumber(prev => prev + num);
    } else if (ussdStep === 'MENU') {
      if (num === '1') setUssdStep('TRAFFIC');
      else if (num === '2') setUssdStep('DUMSOR');
      else if (num === '3') setUssdStep('FLOOD');
      else if (num === '4') setUssdStep('REPORT');
    }
  };

  const handleReportSubmit = (e) => {
    e.preventDefault();
    if (!reportText.trim()) return;
    playBeep(1500);

    const ticketId = 'AMA-' + Math.floor(1000 + Math.random() * 9000);
    setLastTicketId(ticketId);
    setUssdStep('REPORT_CONFIRM');
    confetti({ particleCount: 35, spread: 50, origin: { y: 0.7 } });

    const payload = {
      nodeId: "ECO-01",
      incidentDetected: true,
      incidentDetails: `USSD Citizen Alert [Ticket #${ticketId}]: ${reportText.trim()}`,
      drainageChokeDetected: true,
      waterLevelMeters: 2.85,
      wasteFillPercentage: 94
    };

    // 1. Dispatch real HTTP POST to /api/telemetry/ingest
    fetch('/api/telemetry/ingest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sensor-Token': 'afri-pulse-live-2026'
      },
      body: JSON.stringify(payload)
    }).catch(() => {});

    // 2. Direct callback into App state for instantaneous citywide reaction
    if (onReportIncident) {
      onReportIncident(payload);
    }

    setTimeout(() => {
      setReportText('');
    }, 4000);
  };

  const resetSession = () => {
    setUssdStep('DIALER');
    setDialNumber('*920*26#');
    setActiveSession(false);
  };

  const circleNode = trafficNodes?.find(n => n.id === 'TR-01') || { name: 'Kwame Nkrumah Circle', congestionLevel: 'HIGH', avgSpeedKmh: 12 };
  const kaneshieNode = trafficNodes?.find(n => n.id === 'TR-02') || { name: 'Kaneshie First Light', congestionLevel: 'MEDIUM', avgSpeedKmh: 24 };
  const achimotaSub = energyNodes?.find(n => n.id === 'EN-01') || { name: 'Achimota BSP', dumsorRisk: 14, currentLoadMw: 198 };
  const korleNode = ecoNodes?.find(n => n.id === 'ECO-01') || { name: 'Korle Lagoon / Odaw Basin', floodRisk: 'LOW', waterLevelMeters: 1.4 };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="ussd-modal-title">
      <div 
        className="modal-card" 
        style={{ maxWidth: '440px', background: '#090e17', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: '24px', boxShadow: '0 25px 70px rgba(0,0,0,0.9), 0 0 30px rgba(16, 185, 129, 0.2)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header" style={{ background: 'rgba(6, 20, 14, 0.8)', borderBottom: '1px solid rgba(16, 185, 129, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#34d399'
            }}>
              <Phone size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 id="ussd-modal-title" style={{ fontSize: '0.95rem', fontWeight: '700', color: '#fff' }}>
                  {lang === 'EN' ? 'Citizen USSD Terminal' : 'Nkran Amanneɛbɔ USSD'}
                </h3>
                <span style={{
                  fontSize: '0.68rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: '700',
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#34d399',
                  padding: '2px 6px',
                  borderRadius: '6px',
                  border: '1px solid rgba(16, 185, 129, 0.4)'
                }}>*920*26#</span>
              </div>
              <p style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                {lang === 'EN' ? 'Offline GSM Telco service for all phones in Ghana' : 'Offline GSM dwumadie a ɛho nhia intanɛt'}
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close USSD Terminal">✕</button>
        </div>

        {/* Feature Phone Body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          
          {/* LCD Screen */}
          <div style={{
            width: '100%',
            maxWidth: '340px',
            minHeight: '210px',
            background: '#04170d',
            border: '2px solid #10b981',
            borderRadius: '16px',
            padding: '14px',
            fontFamily: 'var(--font-mono)',
            color: '#34d399',
            fontSize: '0.78rem',
            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8), 0 0 15px rgba(16, 185, 129, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            {/* Carrier Status */}
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.68rem',
                color: '#059669',
                borderBottom: '1px solid rgba(16, 185, 129, 0.2)',
                paddingBottom: '4px',
                marginBottom: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>MTN GH // 2G/EDGE</span>
                  <button 
                    onClick={() => { playBeep(1400); setLang(lang === 'EN' ? 'TWI' : 'EN'); }}
                    style={{
                      background: 'rgba(16, 185, 129, 0.25)',
                      border: '1px solid #10b981',
                      color: '#a7f3d0',
                      borderRadius: '4px',
                      fontSize: '0.6rem',
                      fontWeight: '700',
                      padding: '1px 5px',
                      cursor: 'pointer'
                    }}
                    title="Toggle Language: English / Akan Twi"
                  >
                    {lang === 'EN' ? '🌐 TWI' : '🌐 ENG'}
                  </button>
                </div>
                <span>{new Date().toLocaleTimeString().slice(0, 5)} GMT</span>
              </div>

                  <div style={{ fontSize: '0.64rem', color: '#34d399', background: 'rgba(16, 185, 129, 0.15)', padding: '3px 6px', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.3)', marginBottom: '8px' }}>
                    TOLL-FREE // SPONSORED BY WORLD BANK GARID COMPONENT 2 // REVERSE-BILLED
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
                    {lang === 'EN' ? 'Dial MMI Code' : 'Bɔ USSD Kood No'}
                  </div>
                  <div style={{
                    fontSize: '1.4rem',
                    fontWeight: '700',
                    letterSpacing: '0.05em',
                    color: '#6ee7b7',
                    background: 'rgba(6, 44, 25, 0.6)',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    marginBottom: '8px'
                  }}>
                    {dialNumber || "_"}
                  </div>
                  <div style={{ fontSize: '0.66rem', color: '#a7f3d0' }}>
                    {lang === 'EN' ? '✓ Zero Airtime Deducted • +2.00 GHS Bounty for Verified Hazard Alerts' : '✓ Wontua hwee • Wonya 2.00 GHS Airtime sɛ wobɔ amanneɛ'}
                  </div>

              {ussdStep === 'MENU' && (
                <div>
                  <div style={{ fontWeight: '700', color: '#a7f3d0', borderBottom: '1px solid rgba(16, 185, 129, 0.3)', paddingBottom: '4px', marginBottom: '8px' }}>
                    {lang === 'EN' ? '=== PULSECITY ACCRA ===' : '=== NKRAN PULSECITY USSD ==='}
                  </div>
                  <div style={{ lineHeight: '1.5', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <div>{lang === 'EN' ? '1. Live Traffic (Circle/Kaneshie)' : '1. Akwan Mu Tebea (Circle/Kaneshie)'}</div>
                    <div>{lang === 'EN' ? '2. ECG Dumsor Grid Status' : '2. ECG Dumsor Amanneɛbɔ'}</div>
                    <div>{lang === 'EN' ? '3. Odaw River Flood Risk' : '3. Odaw Asubɔnten Nsuyiri'}</div>
                    <div>{lang === 'EN' ? '4. Report Choked Drain (SMS)' : '4. Bɔ Kakyerɛ Asɔremma (SMS)'}</div>
                  </div>
                  <div style={{ marginTop: '10px', fontSize: '0.68rem', color: '#6ee7b7' }}>
                    {lang === 'EN' ? 'Press 1-4 on keypad below:' : 'Mia 1-4 wɔ keypad no so:'}
                  </div>
                </div>
              )}

              {ussdStep === 'TRAFFIC' && (
                <div style={{ lineHeight: '1.4' }}>
                  <div style={{ fontWeight: '700', color: '#a7f3d0', borderBottom: '1px solid rgba(16, 185, 129, 0.3)', paddingBottom: '4px', marginBottom: '6px' }}>
                    {lang === 'EN' ? '🚦 GAMA TRAFFIC ADVISORY' : '🚦 NKRAN AKWAN MU TEBEA'}
                  </div>
                  <div>• {circleNode.name.split(' ')[0]}: {circleNode.congestionLevel} ({circleNode.avgSpeedKmh} km/h)</div>
                  <div>• {kaneshieNode.name.split(' ')[0]}: {kaneshieNode.congestionLevel} ({kaneshieNode.avgSpeedKmh} km/h)</div>
                  <div style={{ marginTop: '6px', color: '#34d399', fontSize: '0.7rem' }}>
                    {lang === 'EN' ? 'Tip: Danquah to 37 Military route clear.' : 'Afotu: Danquah de kɔ 37 kwan no mu da hɔ.'}
                  </div>
                </div>
              )}

              {ussdStep === 'DUMSOR' && (
                <div style={{ lineHeight: '1.4' }}>
                  <div style={{ fontWeight: '700', color: '#a7f3d0', borderBottom: '1px solid rgba(16, 185, 129, 0.3)', paddingBottom: '4px', marginBottom: '6px' }}>
                    {lang === 'EN' ? '⚡ ECG DUMSOR FORECAST' : '⚡ ECG DUMSOR AMANNEƐBƆ'}
                  </div>
                  <div>• {achimotaSub.name}: {lang === 'EN' ? 'Nominal' : 'Bɔkɔɔ'}</div>
                  <div>• Frequency: 50.02 Hz ({lang === 'EN' ? 'Stable' : 'Pegyee'})</div>
                  <div>• 6-hr Risk: {achimotaSub.dumsorRisk}% ({lang === 'EN' ? 'LOW' : 'KETEE'})</div>
                  <div style={{ marginTop: '6px', color: '#6ee7b7', fontSize: '0.7rem' }}>
                    {lang === 'EN' ? 'No planned load-shedding for your sector.' : 'Dumsor biara nni hɔ mprempren.'}
                  </div>
                </div>
              )}

              {ussdStep === 'FLOOD' && (
                <div style={{ lineHeight: '1.4' }}>
                  <div style={{ fontWeight: '700', color: '#a7f3d0', borderBottom: '1px solid rgba(16, 185, 129, 0.3)', paddingBottom: '4px', marginBottom: '6px' }}>
                    {lang === 'EN' ? '🌊 ODAW FLOOD EARLY WARNING' : '🌊 ODAW NSUYIRI AMANNEƐBƆ'}
                  </div>
                  <div>• Sluice Gate: NORMAL (Open 35%)</div>
                  <div>• Water Level: {korleNode.waterLevelMeters} m ({lang === 'EN' ? 'Safe < 3.0m' : 'Bɔkɔɔ < 3.0m'})</div>
                  <div>• 24h Rain: 4.2 mm ({lang === 'EN' ? 'No surge' : 'Asorɔkye nni hɔ'})</div>
                  <div style={{ marginTop: '6px', color: '#6ee7b7', fontSize: '0.7rem' }}>
                    {lang === 'EN' ? 'Alajo & Circle drainage flow nominal.' : 'Alajo ne Circle nsuo kwan no yɛ.'}
                  </div>
                </div>
              )}

              {ussdStep === 'REPORT' && (
                <div>
                  <div style={{ fontWeight: '700', color: '#a7f3d0', borderBottom: '1px solid rgba(16, 185, 129, 0.3)', paddingBottom: '4px', marginBottom: '6px' }}>
                    {lang === 'EN' ? '📢 REPORT CHOKED DRAIN / CRISIS' : '📢 BƆ AMANNEƐ / NSUYIRI'}
                  </div>
                  <form onSubmit={handleReportSubmit}>
                    <input
                      type="text"
                      value={reportText}
                      onChange={(e) => setReportText(e.target.value)}
                      placeholder={lang === 'EN' ? 'e.g. Odaw basin trash pileup' : 'e.g. Odaw asubɔnten sumii'}
                      autoFocus
                      style={{
                        width: '100%',
                        background: 'rgba(6, 44, 25, 0.8)',
                        border: '1px solid #10b981',
                        borderRadius: '6px',
                        color: '#6ee7b7',
                        padding: '6px 8px',
                        fontFamily: 'inherit',
                        fontSize: '0.75rem',
                        outline: 'none',
                        marginBottom: '6px'
                      }}
                    />
                    <button
                      type="submit"
                      style={{
                        width: '100%',
                        padding: '5px',
                        background: '#10b981',
                        color: '#022c22',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: '700',
                        fontSize: '0.75rem',
                        cursor: 'pointer'
                      }}
                    >
                      {lang === 'EN' ? 'Send Report via SMS' : 'Fa SMS Mane Asɔremma'}
                    </button>
                  </form>
                </div>
              )}

              {ussdStep === 'REPORT_CONFIRM' && (
                <div style={{ textAlign: 'center', padding: '12px 0' }}>
                  <div style={{ color: '#6ee7b7', fontWeight: '700', marginBottom: '6px' }}>
                    {lang === 'EN' ? '✓ REPORT LOGGED & BROADCAST' : '✓ YƐAGYE WO AMANNEƐBƆ'}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#34d399', lineHeight: '1.4', marginBottom: '10px' }}>
                    {lang === 'EN' 
                      ? `Ticket #${lastTicketId || 'AMA-8492'} ingested to GAMA Digital Twin. Rapid Taskforce alerted.` 
                      : `Krataa #${lastTicketId || 'AMA-8492'} akɔ GAMA Digital Twin no mu ntɛm ara.`}
                  </div>
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.65)',
                    border: '1px dashed #10b981',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    textAlign: 'left',
                    fontSize: '0.66rem',
                    color: '#e2e8f0',
                    lineHeight: '1.3',
                    marginBottom: '8px'
                  }}>
                    <div style={{ color: '#fbbf24', fontWeight: '700', marginBottom: '2px', display: 'flex', justifyContent: 'space-between' }}>
                      <span>💬 INCOMING SMS: AMA-ALERT</span>
                      <span style={{ fontSize: '0.58rem', color: '#94a3b8' }}>Just Now</span>
                    </div>
                    "Your report for Odaw Basin (Ref: {lastTicketId || 'AMA-8492'}) has triggered automated sluice gate winch & MTTD unit alert. Medaase pa ara!"
                  </div>

                  <div style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid #10b981',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    textAlign: 'left',
                    fontSize: '0.65rem',
                    color: '#34d399'
                  }}>
                    <span style={{ fontWeight: 'bold' }}>🎁 INCENTIVE BOUNTY: </span>
                    +2.00 GHS Airtime credited to MSISDN 0244****** via MTN MoMo API (World Bank GARID Fund).
                  </div>
                </div>
              )}
            </div>

            {/* Screen Bottom Controls */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid rgba(16, 185, 129, 0.2)',
              paddingTop: '6px',
              marginTop: '8px',
              fontSize: '0.7rem'
            }}>
              {ussdStep !== 'DIALER' ? (
                <button
                  onClick={() => setUssdStep('MENU')}
                  style={{ background: 'none', border: 'none', color: '#6ee7b7', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  &lt; Menu
                </button>
              ) : <span>Emergency: 112</span>}

              {activeSession ? (
                <button
                  onClick={resetSession}
                  style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  End Call [X]
                </button>
              ) : (
                <span style={{ color: '#059669' }}>Signal: Strong</span>
              )}
            </div>
          </div>

          {/* Tactical Hardware Keypad */}
          <div style={{
            width: '100%',
            maxWidth: '300px',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
            marginTop: '4px'
          }}>
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((key) => (
              <button
                key={key}
                onClick={() => handleKeyPress(key)}
                style={{
                  height: '42px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  color: '#f8fafc',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '1rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.1s ease',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.4)'
                }}
                onMouseDown={e => e.currentTarget.style.transform = 'scale(0.94)'}
                onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                {key}
              </button>
            ))}
          </div>

          {/* Action Dial Buttons */}
          <div style={{ width: '100%', maxWidth: '300px', display: 'flex', gap: '10px' }}>
            <button
              onClick={handleDial}
              style={{
                flex: 1,
                padding: '10px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                fontWeight: '700',
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)'
              }}
            >
              <Phone size={15} />
              Dial *920*26#
            </button>
            <button
              onClick={resetSession}
              style={{
                padding: '10px 16px',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#f87171',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                borderRadius: '12px',
                fontWeight: '600',
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              Clear
            </button>
          </div>

          {/* Municipal Partnership Note */}
          <div style={{ fontSize: '0.68rem', color: '#64748b', textAlign: 'center', marginTop: '4px' }}>
            NCA Ghana Approved Service • Zero-Rated Bandwidth Protocol
          </div>
        </div>
      </div>
    </div>
  );
}
