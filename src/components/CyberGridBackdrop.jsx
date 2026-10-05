import React from 'react';

/**
 * CyberGridBackdrop
 * Ultra-subtle mission-control backdrop with glowing SVG coordinate grid,
 * radial depth mask, and ambient digital topography.
 */
export default function CyberGridBackdrop() {
  return (
    <div 
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden',
        opacity: 0.45
      }}
    >
      {/* Perspective Topography SVG Grid */}
      <svg 
        width="100%" 
        height="100%" 
        style={{ position: 'absolute', inset: 0 }}
      >
        <defs>
          <pattern id="cyber-grid-pattern" width="48" height="48" patternUnits="userSpaceOnUse">
            <path 
              d="M 48 0 L 0 0 0 48" 
              fill="none" 
              stroke="rgba(0, 242, 254, 0.05)" 
              strokeWidth="1" 
            />
            <circle cx="48" cy="0" r="1.5" fill="rgba(0, 242, 254, 0.12)" />
          </pattern>
          <radialGradient id="cyber-grid-mask" cx="50%" cy="50%" r="65%">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.8" />
            <stop offset="60%" stopColor="#fff" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
          <mask id="radial-mask">
            <rect width="100%" height="100%" fill="url(#cyber-grid-mask)" />
          </mask>
        </defs>
        <rect 
          width="100%" 
          height="100%" 
          fill="url(#cyber-grid-pattern)" 
          mask="url(#radial-mask)" 
        />
      </svg>

      {/* Ambient Cyber Beams */}
      <div 
        style={{
          position: 'absolute',
          top: '-15%',
          left: '20%',
          width: '60vw',
          height: '400px',
          background: 'radial-gradient(ellipse, rgba(0, 242, 254, 0.04) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
      <div 
        style={{
          position: 'absolute',
          bottom: '-10%',
          right: '15%',
          width: '50vw',
          height: '350px',
          background: 'radial-gradient(ellipse, rgba(168, 85, 247, 0.035) 0%, transparent 70%)',
          filter: 'blur(70px)',
        }}
      />
    </div>
  );
}
