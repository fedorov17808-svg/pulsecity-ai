import React, { useState, useEffect } from 'react';
import { 
  Play, Pause, ChevronRight, ChevronLeft, X, Sparkles, 
  Trophy, Navigation, Zap, Phone, CheckCircle2 
} from 'lucide-react';

const TOUR_STEPS = [
  {
    step: 1,
    title: "1. The Megacity Mobility Crisis",
    tagline: "Kwame Nkrumah Circle & Tema Motorway Bottlenecks",
    description: "4.2M citizens in Greater Accra lose 2.5 hours daily to traffic gridlock. Conventional fixed-cycle timers fail during erratic minibus (trotro) loading surges, costing Ghana over $400M annually in wasted fuel and emergency delays.",
    actionLabel: "Focusing Accra Traffic Grid...",
    tab: "overview",
    layer: "traffic",
    icon: Navigation,
    color: "#00f2fe"
  },
  {
    step: 2,
    title: "2. Edge Vision & Real Webster Math",
    tagline: "Hardware Edge AI replacing $60k SCATS Sensors",
    description: "PulseCity runs YOLOv8 vehicle detection on $35 Raspberry Pi nodes. Real Webster delay algorithms dynamically compute optimal green light splits in <150ms rather than relying on obsolete static timers.",
    actionLabel: "Opening Edge Computer Vision Feed...",
    tab: "overview",
    openVision: true,
    icon: Sparkles,
    color: "#38bdf8"
  },
  {
    step: 3,
    title: "3. Autonomous Actuator: Green Wave Preemption",
    tagline: "Closed-Loop Cyber-Physical Intervention",
    description: "When an emergency is detected or commanded by Incident Commander Kofi, the system preempts all 4 junction microcontrollers to continuous GREEN wave, slashing ambulance transit to 37 Military Hospital from 26 to 7.4 minutes.",
    actionLabel: "Executing Autonomous Green Wave Corridor...",
    tab: "overview",
    triggerWave: true,
    icon: Zap,
    color: "#10b981"
  },
  {
    step: 4,
    title: "4. Inclusive Resilience: 2G USSD (*920*26#)",
    tagline: "Bilingual English + Akan Twi Offline Access",
    description: "Smart cities cannot require expensive smartphones and mobile data. PulseCity provides an offline GSM USSD gateway (*920*26#) working on every basic Nokia phone in Ghana, with authentic local Twi language support.",
    actionLabel: "Launching Citizen USSD Terminal...",
    tab: "overview",
    openUssd: true,
    icon: Phone,
    color: "#f59e0b"
  },
  {
    step: 5,
    title: "5. Mathematical Superiority & Municipal ROI",
    tagline: "The Winning Hackathon Proof",
    description: "PulseCity saves $4.2M/yr for Accra Metropolitan Assembly with an installation CapEx 92% lower than Siemens or SCATS. Dumsor-proof solar batteries ensure 24/7 continuous uptime during power grid blackouts.",
    actionLabel: "Opening Mathematical A/B Benchmark...",
    tab: "overview",
    openBenchmark: true,
    icon: Trophy,
    color: "#c084fc"
  }
];

export default function GuidedPitchTour({
  isOpen,
  onClose,
  onStepChange
}) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  const currentStep = TOUR_STEPS[currentStepIndex];

  // Execute step action on step change
  useEffect(() => {
    if (!isOpen) return;
    if (onStepChange) {
      onStepChange(currentStep);
    }
  }, [isOpen, currentStepIndex]);

  // Auto-advance timer
  useEffect(() => {
    if (!isOpen || !isAutoPlaying) return;
    const timer = setTimeout(() => {
      if (currentStepIndex < TOUR_STEPS.length - 1) {
        setCurrentStepIndex(prev => prev + 1);
      } else {
        setIsAutoPlaying(false);
      }
    }, 12000); // 12 seconds per step = ~60-90s total tour
    return () => clearTimeout(timer);
  }, [isOpen, isAutoPlaying, currentStepIndex]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const IconComponent = currentStep.icon;

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '92%',
      maxWidth: '760px',
      zIndex: 9999,
      background: 'rgba(8, 14, 24, 0.96)',
      backdropFilter: 'blur(20px)',
      border: `2px solid ${currentStep.color}`,
      boxShadow: `0 20px 60px rgba(0, 0, 0, 0.9), 0 0 35px ${currentStep.color}44`,
      borderRadius: '20px',
      overflow: 'hidden',
      animation: 'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
    }}>
      {/* Top Step Progress Bar */}
      <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', display: 'flex' }}>
        {TOUR_STEPS.map((s, idx) => (
          <div
            key={s.step}
            style={{
              flex: 1,
              height: '100%',
              background: idx <= currentStepIndex ? currentStep.color : 'transparent',
              transition: 'background 0.3s ease'
            }}
          />
        ))}
      </div>

      <div style={{ padding: '18px 24px' }}>
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontSize: '0.68rem',
              fontWeight: '800',
              fontFamily: 'var(--font-mono)',
              background: `${currentStep.color}22`,
              border: `1px solid ${currentStep.color}66`,
              color: currentStep.color,
              padding: '2px 8px',
              borderRadius: '6px',
              textTransform: 'uppercase'
            }}>
              Jury Pitch Walkthrough • Step {currentStep.step} of 5
            </span>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
              {currentStep.actionLabel}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#fff',
                fontSize: '0.7rem',
                borderRadius: '6px',
                padding: '3px 8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              {isAutoPlaying ? <Pause size={12} /> : <Play size={12} />}
              {isAutoPlaying ? 'Pause Auto' : 'Auto 90s'}
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: '1.1rem',
                lineHeight: 1
              }}
              title="Close Walkthrough"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: `${currentStep.color}18`,
            border: `1px solid ${currentStep.color}55`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: currentStep.color,
            flexShrink: 0
          }}>
            <IconComponent size={22} />
          </div>

          <div style={{ flex: 1 }}>
            <h4 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#fff', marginBottom: '2px' }}>
              {currentStep.title}
            </h4>
            <div style={{ fontSize: '0.78rem', color: currentStep.color, fontWeight: '600', marginBottom: '6px' }}>
              {currentStep.tagline}
            </div>
            <p style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: '1.5' }}>
              {currentStep.description}
            </p>
          </div>
        </div>

        {/* Bottom Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            {TOUR_STEPS.map((s, idx) => (
              <button
                key={s.step}
                onClick={() => setCurrentStepIndex(idx)}
                style={{
                  width: idx === currentStepIndex ? '24px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  background: idx === currentStepIndex ? currentStep.color : 'rgba(255,255,255,0.2)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease'
                }}
                title={`Jump to step ${idx + 1}`}
              />
            ))}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handlePrev}
              disabled={currentStepIndex === 0}
              className="btn-secondary"
              style={{
                padding: '5px 12px',
                fontSize: '0.74rem',
                opacity: currentStepIndex === 0 ? 0.4 : 1,
                cursor: currentStepIndex === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              <ChevronLeft size={14} />
              Previous
            </button>

            <button
              onClick={handleNext}
              className="btn-primary"
              style={{
                padding: '5px 16px',
                fontSize: '0.76rem',
                background: `linear-gradient(135deg, ${currentStep.color} 0%, #0284c7 100%)`,
                color: '#021827',
                fontWeight: '700'
              }}
            >
              {currentStepIndex === TOUR_STEPS.length - 1 ? (
                <>
                  <CheckCircle2 size={14} />
                  Complete Walkthrough
                </>
              ) : (
                <>
                  Next Chapter
                  <ChevronRight size={14} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
