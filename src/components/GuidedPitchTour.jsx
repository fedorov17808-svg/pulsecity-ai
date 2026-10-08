import React, { useState, useEffect } from 'react';
import { 
  Play, Pause, ChevronRight, ChevronLeft, X, Sparkles, 
  Trophy, Navigation, Zap, Phone, CheckCircle2 
} from 'lucide-react';

const TOUR_STEPS = [
  {
    step: 1,
    title: "1. The Megacity Mobility Crisis (Accra, Ghana)",
    tagline: "45-Minute Emergency Bottlenecks at Kwame Nkrumah Circle",
    description: "In Greater Accra, 4.2M citizens lose 2.5 hours daily in uncoordinated traffic surges. Ambulances frequently spend up to 45 minutes trapped behind Trotro minibuses at Circle Interchange, missing the critical Golden Hour for trauma survival.",
    actionLabel: "Auditing Accra Road Graph & Bottlenecks...",
    tab: "overview",
    layer: "traffic",
    icon: Navigation,
    color: "#00f2fe"
  },
  {
    step: 2,
    title: "2. $340 Non-Invasive Hardware Retrofit & Safety CMU",
    tagline: "No Wire Cutting • No Warranty Void • Hardware Fail-Safe",
    description: "Instead of $85,000 Siemens cabinet overhauls, PulseCity installs in 20 minutes using non-invasive Optical Current Transformer (CT) Clamps. A mechanical Conflict Monitor Unit (CMU) fail-safe relay physically prevents impossible dual-green phases even if software crashes.",
    actionLabel: "Inspecting $340 Hardware BOM & Safety Circuit...",
    tab: "overview",
    openHardware: true,
    icon: Sparkles,
    color: "#38bdf8"
  },
  {
    step: 3,
    title: "3. Closed-Loop Green Wave Preemption",
    tagline: "Dijkstra Routing + Live Webster Adaptive Overrides",
    description: "When an emergency is detected or commanded, PulseCity calculates the optimal path across the road graph and preempts 4 sequential junctions to continuous GREEN, slashing ambulance transit to 37 Military Hospital from 42.4 to 9.2 minutes (-78.3%).",
    actionLabel: "Executing Real-Time Green Wave Preemption...",
    tab: "overview",
    triggerWave: true,
    icon: Zap,
    color: "#10b981"
  },
  {
    step: 4,
    title: "4. Inclusive Offline Resilience: GSM USSD (*920*26#)",
    tagline: "Zero-Fiber Requirement • Basic 2G Feature Phones",
    description: "Smart cities cannot depend on fragile fiber or costly smartphones. PulseCity provides an offline GSM USSD gateway (*920*26#) accessible from basic Nokia phones, with bilingual English + Akan Twi support and on-chip microcontroller Webster autonomy.",
    actionLabel: "Testing Citizen USSD Terminal Simulator...",
    tab: "overview",
    openUssd: true,
    icon: Phone,
    color: "#f59e0b"
  },
  {
    step: 5,
    title: "5. Mathematical Validation & Municipal ROI",
    tagline: "Webster 1958 & HCM 2020 Validated by Automated Tests",
    description: "Saves $4.2M/yr for Accra Metropolitan Assembly with 92% lower CapEx than legacy vendors. Validated by 11 automated Vitest unit tests verifying cycle length formulas, knapsack battery allocation, and road graph shortest path calculations.",
    actionLabel: "Reviewing Mathematical Proof & Benchmarks...",
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
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

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
              System Architecture Walkthrough • Step {currentStep.step} of 5
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
