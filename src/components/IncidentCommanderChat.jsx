import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, Send, Sparkles, Terminal, Flame, ShieldAlert, 
  CornerDownLeft, RefreshCw, Zap, Siren 
} from 'lucide-react';
import { queryIncidentCommander } from '../services/geminiService';

export default function IncidentCommanderChat({
  apiKey,
  cityState,
  onTriggerScenario
}) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'agent',
      text: `Hello Operator. I am **Kofi**, the PulseCity Autonomous Urban Nervous System Agent for Greater Accra. 
I am continuously analyzing:
• 6 Traffic arterial loops (Adaptive green waves active)
• 5 Bulk supply substations (Anti-Dumsor microgrid sync ready)
• 5 Environmental air & waste clusters

Type a tactical command or click one of the quick scenario stress-tests below.`,
      timestamp: '00:01'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const chatBottomRef = useRef(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim() || loading) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const reply = await queryIncidentCommander(apiKey, userMsg.text, cityState);
      const agentMsg = {
        id: Date.now() + 1,
        sender: 'agent',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, agentMsg]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(15, 23, 42, 0.5)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #00f2fe 0%, #3b82f6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#04131f'
          }}>
            <Bot size={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.92rem', fontWeight: 'bold', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
              Incident Commander Kofi
              <span className="pulse-indicator" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              AUTONOMOUS CITY DISPATCH // GEMINI POWERED
            </div>
          </div>
        </div>

        <div className="badge badge-cyan" style={{ fontSize: '0.68rem' }}>
          MULTI-AGENT DISPATCH
        </div>
      </div>

      {/* Quick Scenario Triggers */}
      <div style={{
        padding: '10px 16px',
        background: 'rgba(0, 0, 0, 0.2)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        fontSize: '0.72rem'
      }}>
        <button
          onClick={() => {
            onTriggerScenario('crisis-motorway-pileup');
            handleSend("Simulate emergency: Major pileup on Tema Motorway. Clear green corridor for ambulance.");
          }}
          style={{
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.4)',
            color: '#fb7185',
            padding: '4px 10px',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            whiteSpace: 'nowrap'
          }}
        >
          <Siren size={12} />
          Motorway Pileup
        </button>

        <button
          onClick={() => {
            onTriggerScenario('crisis-achimota-dumsor');
            handleSend("Emergency: Achimota Substation load spiking past 95%! Trigger Anti-Dumsor load balancing.");
          }}
          style={{
            background: 'rgba(168, 85, 247, 0.15)',
            border: '1px solid rgba(168, 85, 247, 0.4)',
            color: '#c084fc',
            padding: '4px 10px',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            whiteSpace: 'nowrap'
          }}
        >
          <Zap size={12} />
          Achimota Dumsor Surge
        </button>

        <button
          onClick={() => {
            onTriggerScenario('crisis-makola-waste-flood');
            handleSend("Alert: Odaw basin canal blocked with floating debris at Circle. Initiate flood mitigation.");
          }}
          style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            color: '#34d399',
            padding: '4px 10px',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            whiteSpace: 'nowrap'
          }}
        >
          <Flame size={12} />
          Canal Debris Flood
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div style={{
        flex: 1,
        padding: '16px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {messages.map((msg) => {
          const isAgent = msg.sender === 'agent';
          return (
            <div
              key={msg.id}
              style={{
                alignSelf: isAgent ? 'flex-start' : 'flex-end',
                maxWidth: '85%',
                background: isAgent ? 'rgba(255, 255, 255, 0.04)' : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                border: isAgent ? '1px solid var(--border-subtle)' : 'none',
                borderRadius: '12px',
                padding: '12px 16px',
                color: '#fff',
                fontSize: '0.84rem',
                lineHeight: '1.5',
                boxShadow: isAgent ? 'none' : '0 4px 12px rgba(2, 132, 199, 0.3)'
              }}
            >
              <div style={{ whiteSpace: 'pre-wrap' }}>
                {msg.text}
              </div>
              <div style={{
                fontSize: '0.68rem',
                color: isAgent ? 'var(--text-muted)' : 'rgba(255,255,255,0.7)',
                marginTop: '6px',
                textAlign: 'right',
                fontFamily: 'var(--font-mono)'
              }}>
                {msg.timestamp}
              </div>
            </div>
          );
        })}

        {loading && (
          <div style={{
            alignSelf: 'flex-start',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.8rem',
            color: 'var(--accent-cyan)'
          }}>
            <RefreshCw size={14} className="animate-spin" />
            Kofi is computing multi-agency dispatch solution...
          </div>
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Input Bar */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid var(--border-subtle)',
        background: 'rgba(0, 0, 0, 0.3)',
        display: 'flex',
        gap: '8px'
      }}>
        <input
          type="text"
          placeholder="Ask Kofi: e.g. 'Reroute traffic around Kaneshie' or 'Status report for judges'..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend();
          }}
          style={{
            flex: 1,
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 14px',
            color: '#fff',
            fontSize: '0.84rem',
            outline: 'none'
          }}
        />
        <button
          onClick={() => handleSend()}
          disabled={loading || !inputText.trim()}
          className="btn-primary"
          style={{ padding: '0 16px' }}
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}
