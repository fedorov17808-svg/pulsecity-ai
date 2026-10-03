import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("PulseCity Critical Component Error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: '#06090e',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '520px',
            width: '100%',
            padding: '32px',
            textAlign: 'center',
            border: '1px solid rgba(244, 63, 94, 0.4)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(244, 63, 94, 0.2)'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(244, 63, 94, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              border: '1px solid rgba(244, 63, 94, 0.4)'
            }}>
              <AlertTriangle size={28} color="#f43f5e" />
            </div>

            <h3 style={{ fontSize: '1.3rem', color: '#fff', marginBottom: '8px' }}>
              Subsystem Telemetry Anomaly Intercepted
            </h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '20px' }}>
              PulseCity AI Core isolated an unexpected rendering variance. Municipal protection protocols remain secure.
            </p>

            <div style={{
              background: 'rgba(0,0,0,0.4)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '10px',
              fontSize: '0.74rem',
              color: '#fb7185',
              fontFamily: 'var(--font-mono)',
              marginBottom: '20px',
              textAlign: 'left',
              wordBreak: 'break-all'
            }}>
              {this.state.error?.message || "Unknown anomaly"}
            </div>

            <button
              onClick={this.handleReset}
              className="btn-primary"
              style={{
                background: 'linear-gradient(135deg, #00f2fe 0%, #0284c7 100%)',
                color: '#04131f',
                width: '100%',
                padding: '12px'
              }}
            >
              <RefreshCw size={16} />
              Re-initialize Subsystem
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
