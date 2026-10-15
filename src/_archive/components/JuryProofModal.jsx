import React from 'react';
import { Trophy, Shield, X } from 'lucide-react';
import HackathonJuryProofBanner from './HackathonJuryProofBanner';

export default function JuryProofModal({
  isOpen,
  onClose,
  onLaunchGreenWave,
  onOpenQuickIngest,
  onOpenHardwareHub,
  onOpenUssdModal,
  onStartAutoTour
}) {
  if (!isOpen) return null;

  return (
    <div 
      className="modal-overlay notranslate" 
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 9, 18, 0.88)',
        backdropFilter: 'blur(12px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div 
        className="modal-card" 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '94vw',
          maxWidth: '1100px',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: '#090e18',
          border: '1px solid rgba(245, 158, 11, 0.65)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 30px rgba(245, 158, 11, 0.2)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Shield size={20} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#fff', margin: 0, letterSpacing: '-0.01em' }}>
                Municipal Engineering & Architecture Rigor Suite
              </h2>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
                Physical NEMA TS-2 retrofits, Webster formulation, CMU fail-safe interlocks & SCADA power flow verification
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#94a3b8',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
          >
            <X size={18} />
          </button>
        </div>

        <HackathonJuryProofBanner
          initiallyExpanded={true}
          onLaunchGreenWave={onLaunchGreenWave}
          onOpenQuickIngest={onOpenQuickIngest}
          onOpenHardwareHub={onOpenHardwareHub}
          onOpenUssdModal={onOpenUssdModal}
          onStartAutoTour={onStartAutoTour}
        />
      </div>
    </div>
  );
}
