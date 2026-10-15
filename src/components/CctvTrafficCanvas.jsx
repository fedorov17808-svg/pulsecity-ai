import React, { useRef, useEffect } from 'react';

export default function CctvTrafficCanvas({
  cameraName = "Kwame Nkrumah Circle",
  lightState = "GREEN",
  isIncident = false,
  onVehicleCountChange
}) {
  const canvasRef = useRef(null);
  const vehiclesRef = useRef([]);

  useEffect(() => {
    // Initialize 6-8 vehicles in varied lanes
    vehiclesRef.current = [
      { id: 1, x: 50, y: 145, w: 75, h: 36, speed: 2.2, type: 'Trotro Minibus', color: '#eab308', plate: 'GT-4021', conf: 0.96 },
      { id: 2, x: 220, y: 195, w: 60, h: 32, speed: 2.8, type: 'Taxi Cab', color: '#f59e0b', plate: 'GE-1982', conf: 0.93 },
      { id: 3, x: 420, y: 245, w: 130, h: 46, speed: 1.4, type: 'Haulage Truck', color: '#ef4444', plate: 'GN-8842', conf: 0.98, isHazard: isIncident },
      { id: 4, x: 580, y: 145, w: 58, h: 32, speed: 3.1, type: 'Private Sedan', color: '#38bdf8', plate: 'GW-3310', conf: 0.91 },
      { id: 5, x: 100, y: 245, w: 85, h: 38, speed: 1.8, type: 'Trotro #08', color: '#10b981', plate: 'GS-7721', conf: 0.95 },
    ];
  }, [isIncident]);

  useEffect(() => {
    let animId;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameCount = 0;

    const render = () => {
      frameCount++;
      const w = canvas.width;
      const h = canvas.height;

      // 1. Draw Road Surface
      ctx.fillStyle = '#111827';
      ctx.fillRect(0, 0, w, h);

      // Grass / Shoulders
      ctx.fillStyle = '#062016';
      ctx.fillRect(0, 0, w, 110);
      ctx.fillRect(0, 310, w, 90);

      // Asphalt roadway
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 110, w, 200);

      // Curbs
      ctx.fillStyle = '#64748b';
      ctx.fillRect(0, 108, w, 4);
      ctx.fillRect(0, 308, w, 4);

      // Lane dividers (animated dashed lines)
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([16, 14]);
      ctx.lineDashOffset = -(frameCount * 1.5);

      ctx.beginPath();
      ctx.moveTo(0, 175);
      ctx.lineTo(w, 175);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, 245);
      ctx.lineTo(w, 245);
      ctx.stroke();
      ctx.setLineDash([]);

      // 2. Update and Draw Moving Vehicles
      const vehicles = vehiclesRef.current;
      const effectiveSpeedMult = lightState === 'RED' ? 0.2 : lightState === 'YELLOW' ? 0.6 : 1.0;

      vehicles.forEach((v) => {
        // Stop stalled hazard truck
        if (!v.isHazard) {
          v.x += v.speed * effectiveSpeedMult;
        }

        // Loop vehicles across screen
        if (v.x > w + 100) {
          v.x = -150; // re-enter with the same deterministic speed
        }

        // Vehicle Body
        ctx.fillStyle = v.color;
        ctx.beginPath();
        ctx.roundRect(v.x, v.y, v.w, v.h, 6);
        ctx.fill();

        // Windshield
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(v.x + v.w - 18, v.y + 4, 12, v.h - 8);

        // Headlights
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(v.x + v.w - 3, v.y + 3, 3, 6);
        ctx.fillRect(v.x + v.w - 3, v.y + v.h - 9, 3, 6);

        // Taillights
        ctx.fillStyle = '#f43f5e';
        ctx.fillRect(v.x, v.y + 3, 3, 6);
        ctx.fillRect(v.x, v.y + v.h - 9, 3, 6);

        // Computer Vision Bounding Box Overlay
        const boxPad = 6;
        const bx = v.x - boxPad;
        const by = v.y - boxPad;
        const bw = v.w + boxPad * 2;
        const bh = v.h + boxPad * 2;

        ctx.strokeStyle = v.isHazard ? '#f43f5e' : '#00f2fe';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(bx, by, bw, bh);

        // Label banner
        ctx.fillStyle = v.isHazard ? 'rgba(244, 63, 94, 0.9)' : 'rgba(0, 242, 254, 0.85)';
        ctx.fillRect(bx, by - 16, bw, 16);

        ctx.fillStyle = '#04131f';
        ctx.font = 'bold 9px monospace';
        ctx.fillText(v.type.slice(0, 10), bx + 4, by - 4);
      });

      // 3. Traffic Light Indicator in Top Right
      ctx.fillStyle = '#0b1320';
      ctx.fillRect(w - 70, 16, 54, 64);
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.strokeRect(w - 70, 16, 54, 64);

      // Red, Yellow, Green bulbs
      const bulbs = [
        { y: 30, color: lightState === 'RED' ? '#ef4444' : '#450a0a', glow: lightState === 'RED' },
        { y: 48, color: lightState === 'YELLOW' ? '#f59e0b' : '#451a03', glow: lightState === 'YELLOW' },
        { y: 66, color: lightState === 'GREEN' ? '#10b981' : '#022c22', glow: lightState === 'GREEN' }
      ];

      bulbs.forEach(b => {
        ctx.beginPath();
        ctx.arc(w - 43, b.y, 7, 0, Math.PI * 2);
        ctx.fillStyle = b.color;
        if (b.glow) {
          ctx.shadowBlur = 12;
          ctx.shadowColor = b.color;
        }
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Camera Watermark / Timestamp
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.font = '11px monospace';
      ctx.fillText(`SIMULATED ANIMATION: ${cameraName.toUpperCase()}`, 18, 28);
      ctx.fillStyle = 'var(--accent-cyan, #00f2fe)';
      ctx.fillText(`NOT CAMERA DATA • ${vehicles.length} SYNTHETIC VEHICLES`, 18, 44);

      animId = requestAnimationFrame(render);
    };

    render();

    if (onVehicleCountChange) {
      onVehicleCountChange(vehiclesRef.current.length);
    }

    return () => cancelAnimationFrame(animId);
  }, [cameraName, lightState, isIncident, onVehicleCountChange]);

  return (
    <canvas
      ref={canvasRef}
      width={640}
      height={400}
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        objectFit: 'cover'
      }}
    />
  );
}
