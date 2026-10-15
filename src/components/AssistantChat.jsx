import React, { useState } from 'react';
import { Bot, Send } from 'lucide-react';
import { queryIncidentCommander } from '../services/geminiService';

const MODE_BADGE = {
  ai: { text: 'AI (Gemini)', className: 'badge badge-cyan' },
  'rule-based': { text: 'Rule-based mode (AI offline)', className: 'badge badge-amber' }
};

/**
 * Operator chat. Replies come from Gemini via /api/gemini-proxy when a key is
 * configured, otherwise from explicit rules; each reply shows which one answered.
 * Actions are applied to the simulated signal state through onExecuteAgentTool.
 */
export default function AssistantChat({ apiKey, trafficNodes, activeCrisis, onExecuteAgentTool }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);

  const send = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', text }]);
    setBusy(true);

    const cityState = {
      trafficBottlenecks: trafficNodes.filter((n) => n.congestion > 70).map((n) => `${n.id} ${n.name}`).join(', '),
      activeEmergencies: activeCrisis ? activeCrisis.title : ''
    };
    const reply = await queryIncidentCommander(apiKey, text, cityState);
    if (reply.toolCall) onExecuteAgentTool(reply.toolCall);

    setMessages((m) => [...m, { role: 'assistant', ...reply }]);
    setBusy(false);
  };

  return (
    <div className="glass-panel" style={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Bot size={18} color="var(--accent-cyan)" />
        <h3 style={{ color: '#fff', fontSize: '1.05rem' }}>Traffic assistant</h3>
      </div>
      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
        Try "green wave for an ambulance" or "recompute signal at TR-02". Actions change the simulated signals only.
      </p>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '80%',
            background: m.role === 'user' ? 'rgba(0, 242, 254, 0.12)' : 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px',
            padding: '8px 12px',
            fontSize: '0.82rem',
            color: '#e2e8f0',
            whiteSpace: 'pre-wrap'
          }}>
            {m.role === 'assistant' && (
              <div style={{ marginBottom: '4px' }}>
                <span className={MODE_BADGE[m.mode].className} style={{ fontSize: '0.62rem' }}>{MODE_BADGE[m.mode].text}</span>
                {m.toolCall && <span style={{ marginLeft: '8px', fontSize: '0.68rem', color: '#94a3b8' }}>action: {m.toolCall.name}</span>}
              </div>
            )}
            {m.text}
          </div>
        ))}
        {busy && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Thinking…</div>}
      </div>

      <form onSubmit={send} style={{ display: 'flex', gap: '8px' }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about an intersection…"
          style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: '#fff', padding: '8px 10px' }}
        />
        <button type="submit" className="btn-primary" disabled={busy}>
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}
