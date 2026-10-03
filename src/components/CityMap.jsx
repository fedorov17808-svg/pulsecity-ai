import React, { useState } from 'react';
import { 
  Car, Zap, Wind, AlertTriangle, Eye, Shield, Radio, Flame, 
  CheckCircle2, ArrowRight, Gauge, Activity, Navigation 
} from 'lucide-react';

export default function CityMap({
  activeLayer, // 'all', 'traffic', 'energy', 'eco'
  trafficNodes,
  energyNodes,
  ecoNodes,
  selectedNode,
  onSelectNode,
  onOpenVisionModal,
  activeCrisis,
  onResolveCrisis
}) {
  const [zoomLevel, setZoomLevel] = useState(1);

  return (
    <div className="city-map-container" style={{
      position: 'relative',
      width: '100%',
      height: '620px',
      background: 'radial-gradient(ellipse at center, #0c1424 0%, #06090e 100%)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border-subtle)',
      overflow: 'hidden',
      boxShadow: 'inset 0 0 50px rgba(0, 0, 0, 0.8), 0 10px 30px rgba(0,0,0,0.5)',
    }}>
      {/* Top Map HUD Controls */}
      <div style={{
        position: 'absolute',
        top: '16px',
        left: '20px',
        right: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 20,
        pointerEvents: 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', pointerEvents: 'auto' }}>
          <div className="badge badge-cyan" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
            <Radio size={14} className="pulse-indicator" style={{ color: 'var(--accent-cyan)' }} />
            LIVE DIGITAL TWIN // GREATER ACCRA GRID
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            LAT: 5.6037° N, LON: 0.1870° W
          </span>
        </div>

        {/* Crisis Alert Banner if Active */}
        {activeCrisis && (
          <div style={{
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: 'rgba(244, 63, 94, 0.2)',
            border: '1px solid rgba(244, 63, 94, 0.6)',
            padding: '6px 16px',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 0 20px rgba(244, 63, 94, 0.4)',
            animation: 'pulse-ring 1.8s infinite',
          }}>
            <Flame size={18} color="#f43f5e" />
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#fff' }}>
                {activeCrisis.title}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#fca5a5' }}>
                Track: {activeCrisis.track} • Immediate AI Response active
              </div>
            </div>
            <button 
              onClick={onResolveCrisis}
              className="btn-primary"
              style={{
                padding: '4px 10px',
                fontSize: '0.75rem',
                background: '#10b981',
                boxShadow: '0 0 10px rgba(16, 185, 129, 0.5)'
              }}
            >
              Resolve
            </button>
          </div>
        )}
      </div>

      {/* SVG Canvas Map */}
      <svg 
        viewBox="0 0 1000 620" 
        style={{
          width: '100%',
          height: '100%',
          transform: `scale(${zoomLevel})`,
          transition: 'transform 0.3s ease',
        }}
      >
        <defs>
          {/* Neon Glow Filters */}
          <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="glow-energy" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          
          {/* Animated road dashes */}
          <style>
            {`
              @keyframes dash {
                to { stroke-dashoffset: -100; }
              }
              @keyframes pulseLine {
                0%, 100% { opacity: 0.6; }
                50% { opacity: 1; }
              }
              .traffic-artery {
                stroke-dasharray: 8 6;
                animation: dash 5s linear infinite;
              }
              .energy-gridline {
                stroke-dasharray: 4 10;
                animation: dash 3s linear infinite, pulseLine 2s ease-in-out infinite;
              }
              .map-node:hover {
                cursor: pointer;
                filter: brightness(1.3);
              }
            `}
          </style>
        </defs>

        {/* Map Background Grid Mesh */}
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
        </pattern>
        <rect width="1000" height="620" fill="url(#grid)" />

        {/* Coastal Line / Gulf of Guinea (Southern boundary) */}
        <path 
          d="M 100 520 Q 300 550, 480 500 T 800 480 T 950 490 L 1000 620 L 0 620 Z" 
          fill="rgba(2, 44, 76, 0.25)" 
          stroke="rgba(0, 242, 254, 0.2)" 
          strokeWidth="1.5"
        />
        <text x="250" y="585" fill="rgba(0, 242, 254, 0.25)" fontSize="13" fontFamily="var(--font-mono)" letterSpacing="4">
          GULF OF GUINEA // ATLANTIC OCEAN
        </text>

        {/* High-Voltage Power Lines (Connecting Substations) */}
        {(activeLayer === 'all' || activeLayer === 'energy') && (
          <g id="power-grid-lines">
            {/* Achimota (42,35) to Mallam (28,62) */}
            <path d="M 420 217 L 280 384" stroke="#a855f7" strokeWidth="2" opacity="0.6" className="energy-gridline" />
            {/* Achimota (42,35) to Accra Central (50,60) */}
            <path d="M 420 217 L 500 372" stroke="#a855f7" strokeWidth="2.5" opacity="0.7" className="energy-gridline" />
            {/* Achimota (42,35) to Legon Solar (60,22) */}
            <path d="M 420 217 L 600 136" stroke="#10b981" strokeWidth="2" opacity="0.8" className="energy-gridline" />
            {/* Legon Solar (60,22) to Tema Free Zone (82,44) */}
            <path d="M 600 136 L 820 272" stroke="#10b981" strokeWidth="2.5" opacity="0.7" className="energy-gridline" />
            {/* Accra Central (50,60) to Tema Free Zone (82,44) */}
            <path d="M 500 372 L 820 272" stroke="#a855f7" strokeWidth="2" opacity="0.6" className="energy-gridline" />
          </g>
        )}

        {/* Primary Highway & Traffic Arteries */}
        {(activeLayer === 'all' || activeLayer === 'traffic') && (
          <g id="traffic-arteries">
            {/* N1 Tema Motorway (Corridor east-west) */}
            <path 
              d="M 150 260 L 460 322 L 650 297 L 780 235 L 950 210" 
              stroke="rgba(56, 189, 248, 0.4)" 
              strokeWidth="5" 
              fill="none" 
            />
            <path 
              d="M 150 260 L 460 322 L 650 297 L 780 235 L 950 210" 
              stroke="#00f2fe" 
              strokeWidth="2" 
              fill="none" 
              className="traffic-artery" 
            />
            <text x="810" y="220" fill="rgba(56, 189, 248, 0.7)" fontSize="11" fontFamily="var(--font-mono)">
              TEMA MOTORWAY (N1)
            </text>

            {/* Liberation Road (Airport Bypass) */}
            <path 
              d="M 460 322 L 580 198 L 650 150" 
              stroke="rgba(56, 189, 248, 0.35)" 
              strokeWidth="4" 
              fill="none" 
            />
            <path 
              d="M 460 322 L 580 198 L 650 150" 
              stroke="#38bdf8" 
              strokeWidth="1.5" 
              fill="none" 
              className="traffic-artery" 
            />
            <text x="595" y="195" fill="rgba(56, 189, 248, 0.6)" fontSize="10" fontFamily="var(--font-mono)">
              LIBERATION RD
            </text>

            {/* Ring Road Central (Kaneshie to Circle to Osu) */}
            <path 
              d="M 340 359 L 460 322 L 480 421 L 530 460" 
              stroke="rgba(245, 158, 11, 0.4)" 
              strokeWidth="4" 
              fill="none" 
            />
            <path 
              d="M 340 359 L 460 322 L 480 421 L 530 460" 
              stroke="#f59e0b" 
              strokeWidth="1.5" 
              fill="none" 
              className="traffic-artery" 
            />

            {/* Spintex Commercial Corridor */}
            <path 
              d="M 580 198 L 650 297 L 780 340" 
              stroke="rgba(244, 63, 94, 0.4)" 
              strokeWidth="3.5" 
              fill="none" 
            />
            <path 
              d="M 580 198 L 650 297 L 780 340" 
              stroke="#f43f5e" 
              strokeWidth="1.5" 
              fill="none" 
              className="traffic-artery" 
            />
            <text x="670" y="320" fill="rgba(244, 63, 94, 0.7)" fontSize="10" fontFamily="var(--font-mono)">
              SPINTEX RD
            </text>
          </g>
        )}

        {/* Eco Dispersion Clouds */}
        {(activeLayer === 'all' || activeLayer === 'eco') && (
          <g id="eco-clouds" opacity="0.35">
            {/* Agbogbloshie Smoke/Dust Cluster */}
            <circle cx="440" cy="347" r="48" fill="url(#radial-dust)" />
            {/* Makola Market Density */}
            <circle cx="480" cy="384" r="38" fill="rgba(245, 158, 11, 0.18)" />
            {/* Korle Lagoon */}
            <ellipse cx="400" cy="409" rx="35" ry="20" fill="rgba(6, 182, 212, 0.2)" />
          </g>
        )}

        {/* INTERACTIVE NODES */}

        {/* 1. Traffic Nodes */}
        {(activeLayer === 'all' || activeLayer === 'traffic') && trafficNodes.map((node) => {
          const cx = (node.x / 100) * 1000;
          const cy = (node.y / 100) * 620;
          const isSelected = selectedNode?.id === node.id;
          const isCongested = node.congestion > 75;
          const isModerate = node.congestion > 50 && node.congestion <= 75;
          const color = isCongested ? '#f43f5e' : isModerate ? '#f59e0b' : '#10b981';

          return (
            <g 
              key={node.id} 
              className="map-node"
              onClick={() => onSelectNode({ ...node, category: 'traffic' })}
            >
              {/* Outer pulsing ring for high congestion */}
              {isCongested && (
                <circle 
                  cx={cx} 
                  cy={cy} 
                  r="24" 
                  fill="none" 
                  stroke={color} 
                  strokeWidth="1.5" 
                  opacity="0.4"
                  style={{ animation: 'pulse-ring 1.5s infinite ease-in-out' }}
                />
              )}

              {/* Selection Halo */}
              {isSelected && (
                <circle cx={cx} cy={cy} r="28" fill="none" stroke="#00f2fe" strokeWidth="2.5" strokeDasharray="4 4" />
              )}

              {/* Node Center Base */}
              <circle 
                cx={cx} 
                cy={cy} 
                r="14" 
                fill="#0c1424" 
                stroke={color} 
                strokeWidth="2.5" 
                filter="url(#glow-cyan)"
              />

              {/* Traffic Light State Dot */}
              <circle 
                cx={cx} 
                cy={cy} 
                r="5" 
                fill={node.lightState === 'GREEN' ? '#10b981' : node.lightState === 'YELLOW' ? '#f59e0b' : '#f43f5e'} 
              />

              {/* Node Label */}
              <text 
                x={cx} 
                y={cy - 20} 
                textAnchor="middle" 
                fill="#f8fafc" 
                fontSize="11" 
                fontWeight="600" 
                fontFamily="var(--font-display)"
              >
                {node.name.split(' (')[0]}
              </text>
              <text 
                x={cx} 
                y={cy + 25} 
                textAnchor="middle" 
                fill={color} 
                fontSize="9.5" 
                fontFamily="var(--font-mono)"
                fontWeight="600"
              >
                {node.congestion}% CONG // {node.speedKmh} km/h
              </text>
            </g>
          );
        })}

        {/* 2. Energy Substation Nodes */}
        {(activeLayer === 'all' || activeLayer === 'energy') && energyNodes.map((node) => {
          const cx = (node.x / 100) * 1000;
          const cy = (node.y / 100) * 620;
          const isSelected = selectedNode?.id === node.id;
          const isCritical = node.dumsorRisk > 70;
          const color = isCritical ? '#f43f5e' : node.dumsorRisk > 40 ? '#f59e0b' : '#a855f7';

          return (
            <g 
              key={node.id} 
              className="map-node"
              onClick={() => onSelectNode({ ...node, category: 'energy' })}
            >
              {isSelected && (
                <circle cx={cx} cy={cy} r="30" fill="none" stroke="#a855f7" strokeWidth="2.5" strokeDasharray="3 3" />
              )}

              {/* Diamond Base for Substations */}
              <rect 
                x={cx - 14} 
                y={cy - 14} 
                width="28" 
                height="28" 
                transform={`rotate(45, ${cx}, ${cy})`}
                fill="#0d1117" 
                stroke={color} 
                strokeWidth="2.5" 
                filter="url(#glow-energy)"
              />

              {/* Inner Core */}
              <circle cx={cx} cy={cy} r="4" fill="#fff" />

              {/* Label */}
              <text 
                x={cx} 
                y={cy - 22} 
                textAnchor="middle" 
                fill="#e9d5ff" 
                fontSize="11" 
                fontWeight="600" 
                fontFamily="var(--font-display)"
              >
                ⚡ {node.name.replace(' Bulk Supply Point (BSP)', ' BSP').replace(' Substation', '')}
              </text>
              <text 
                x={cx} 
                y={cy + 28} 
                textAnchor="middle" 
                fill={color} 
                fontSize="9.5" 
                fontFamily="var(--font-mono)"
              >
                {node.currentLoadMw}/{node.capacityMw} MW ({Math.round(node.currentLoadMw/node.capacityMw*100)}%)
              </text>
            </g>
          );
        })}

        {/* 3. EcoSense Nodes */}
        {(activeLayer === 'all' || activeLayer === 'eco') && ecoNodes.map((node) => {
          const cx = (node.x / 100) * 1000;
          const cy = (node.y / 100) * 620;
          const isSelected = selectedNode?.id === node.id;
          const isBadAqi = node.aqi > 100;
          const color = isBadAqi ? '#f43f5e' : node.aqi > 50 ? '#f59e0b' : '#10b981';

          return (
            <g 
              key={node.id} 
              className="map-node"
              onClick={() => onSelectNode({ ...node, category: 'eco' })}
            >
              {isSelected && (
                <circle cx={cx} cy={cy} r="26" fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="4 4" />
              )}

              {/* Hexagon/Circle Eco Beacon */}
              <circle 
                cx={cx} 
                cy={cy} 
                r="12" 
                fill="#071918" 
                stroke={color} 
                strokeWidth="2" 
              />
              <circle cx={cx} cy={cy} r="3" fill="#10b981" />

              <text 
                x={cx} 
                y={cy - 16} 
                textAnchor="middle" 
                fill="#a7f3d0" 
                fontSize="10" 
                fontWeight="600" 
                fontFamily="var(--font-display)"
              >
                🍃 {node.name.split(' ')[0]}
              </text>
              <text 
                x={cx} 
                y={cy + 24} 
                textAnchor="middle" 
                fill={color} 
                fontSize="9" 
                fontFamily="var(--font-mono)"
              >
                AQI {node.aqi} // Waste {node.wasteLevelPct}%
              </text>
            </g>
          );
        })}
      </svg>

      {/* Map Legend Overlay (Bottom Left) */}
      <div style={{
        position: 'absolute',
        bottom: '16px',
        left: '20px',
        background: 'rgba(10, 15, 25, 0.85)',
        backdropFilter: 'blur(12px)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        fontSize: '0.78rem',
        color: 'var(--text-secondary)',
        fontFamily: 'var(--font-mono)',
        zIndex: 20
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00f2fe' }}></span>
          Traffic Node (Circle)
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '8px', height: '8px', background: '#a855f7', transform: 'rotate(45deg)' }}></span>
          Grid Substation (Diamond)
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span>
          EcoSense Hub
        </div>
      </div>

      {/* Selected Node Quick HUD Drawer (Bottom Right) */}
      {selectedNode && (
        <div style={{
          position: 'absolute',
          bottom: '16px',
          right: '20px',
          width: '320px',
          background: 'rgba(15, 23, 42, 0.92)',
          backdropFilter: 'blur(16px)',
          border: '1px solid var(--border-active)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6), var(--shadow-glow-cyan)',
          zIndex: 25,
          animation: 'fadeIn 0.2s ease',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
            <div>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                {selectedNode.category?.toUpperCase() || 'NODE'} TELEMETRY
              </div>
              <h4 style={{ fontSize: '1rem', color: '#fff', marginTop: '2px' }}>
                {selectedNode.name}
              </h4>
            </div>
            <button 
              onClick={() => onSelectNode(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '1.2rem',
                padding: '0 4px',
              }}
            >
              ×
            </button>
          </div>

          {/* Category specific metrics */}
          {selectedNode.category === 'traffic' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                <div style={{ background: 'rgba(255,255,255,0.04)', padding: '8px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Congestion</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: selectedNode.congestion > 75 ? '#f43f5e' : '#10b981' }}>
                    {selectedNode.congestion}%
                  </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.04)', padding: '8px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Avg Speed</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#38bdf8' }}>
                    {selectedNode.speedKmh} km/h
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                {selectedNode.alert}
              </div>

              <button 
                className="btn-primary" 
                style={{ width: '100%', fontSize: '0.82rem', padding: '8px' }}
                onClick={() => onOpenVisionModal(selectedNode)}
              >
                <Eye size={15} />
                Open Gemini CCTV Vision Feed
              </button>
            </div>
          )}

          {selectedNode.category === 'energy' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                <div style={{ background: 'rgba(255,255,255,0.04)', padding: '8px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Current Load</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 'bold', color: '#a855f7' }}>
                    {selectedNode.currentLoadMw} MW
                  </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.04)', padding: '8px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Dumsor Risk</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 'bold', color: selectedNode.dumsorRisk > 60 ? '#f43f5e' : '#10b981' }}>
                    {selectedNode.dumsorRisk}%
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                Solar Reserve: <span style={{ color: '#10b981' }}>+{selectedNode.solarInputMw} MW</span> • Battery: {selectedNode.batteryReservePct}%
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                Feeds: {selectedNode.connectedDistricts?.join(', ')}
              </div>
            </div>
          )}

          {selectedNode.category === 'eco' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                <div style={{ background: 'rgba(255,255,255,0.04)', padding: '8px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Air Quality</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 'bold', color: selectedNode.aqi > 100 ? '#f43f5e' : '#10b981' }}>
                    AQI {selectedNode.aqi}
                  </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.04)', padding: '8px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Waste Overflow</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 'bold', color: selectedNode.wasteLevelPct > 70 ? '#f59e0b' : '#38bdf8' }}>
                    {selectedNode.wasteLevelPct}%
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                {selectedNode.recommendation}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
