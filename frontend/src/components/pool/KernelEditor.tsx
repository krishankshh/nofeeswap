import { useState, useRef, useCallback, useEffect } from 'react';
import './KernelEditor.css';

interface Point {
  x: number; // 0-1 range
  y: number; // 0-1 range
}

const PRESETS: Record<string, Point[]> = {
  linear: [
    { x: 0, y: 0 },
    { x: 1, y: 1 },
  ],
  step: [
    { x: 0, y: 0 },
    { x: 0.4, y: 0 },
    { x: 0.4, y: 1 },
    { x: 1, y: 1 },
  ],
  concentrated: [
    { x: 0, y: 0 },
    { x: 0.3, y: 0.8 },
    { x: 0.5, y: 1 },
    { x: 1, y: 1 },
  ],
  sCurve: [
    { x: 0, y: 0 },
    { x: 0.25, y: 0.1 },
    { x: 0.5, y: 0.5 },
    { x: 0.75, y: 0.9 },
    { x: 1, y: 1 },
  ],
};

export function KernelEditor() {
  const [points, setPoints] = useState<Point[]>(PRESETS.linear);
  const [activePreset, setActivePreset] = useState('linear');
  const [dragging, setDragging] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const WIDTH = 360;
  const HEIGHT = 240;
  const PADDING = 30;
  const plotW = WIDTH - 2 * PADDING;
  const plotH = HEIGHT - 2 * PADDING;

  const toSvgX = (x: number) => PADDING + x * plotW;
  const toSvgY = (y: number) => PADDING + (1 - y) * plotH;


  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${toSvgX(p.x)},${toSvgY(p.y)}`)
    .join(' ');

  const areaD = pathD + ` L${toSvgX(points[points.length - 1].x)},${toSvgY(0)} L${toSvgX(points[0].x)},${toSvgY(0)} Z`;

  const handleMouseDown = useCallback((index: number) => {
    if (index === 0 || index === points.length - 1) return; // Can't drag first/last
    setDragging(index);
  }, [points.length]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragging === null || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    
    const newX = Math.max(0, Math.min(1, (sx - PADDING) / plotW));
    const newY = Math.max(0, Math.min(1, 1 - (sy - PADDING) / plotH));
    
    setPoints(prev => {
      const next = [...prev];
      // Constrain x between neighbors
      const minX = prev[dragging - 1]?.x ?? 0;
      const maxX = prev[dragging + 1]?.x ?? 1;
      next[dragging] = {
        x: Math.max(minX + 0.01, Math.min(maxX - 0.01, newX)),
        y: Math.max(0, Math.min(1, newY)),
      };
      // Ensure monotonically non-decreasing y
      for (let i = 1; i < next.length; i++) {
        if (next[i].y < next[i - 1].y) {
          next[i] = { ...next[i], y: next[i - 1].y };
        }
      }
      return next;
    });
  }, [dragging, plotW, plotH]);

  const handleMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  useEffect(() => {
    if (dragging !== null) {
      const handleGlobalUp = () => setDragging(null);
      window.addEventListener('mouseup', handleGlobalUp);
      return () => window.removeEventListener('mouseup', handleGlobalUp);
    }
  }, [dragging]);

  const selectPreset = (name: string) => {
    setActivePreset(name);
    setPoints([...PRESETS[name]]);
  };

  return (
    <div className="kernel-editor">
      {/* Presets */}
      <div className="kernel-presets">
        {Object.keys(PRESETS).map((name) => (
          <button
            key={name}
            className={`kernel-preset-btn ${activePreset === name ? 'active' : ''}`}
            onClick={() => selectPreset(name)}
          >
            {/* Mini preview */}
            <svg width="32" height="20" viewBox="0 0 32 20" className="preset-mini">
              <polyline
                points={PRESETS[name].map(p => `${2 + p.x * 28},${18 - p.y * 16}`).join(' ')}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
            <span>{name.charAt(0).toUpperCase() + name.slice(1).replace(/([A-Z])/g, ' $1')}</span>
          </button>
        ))}
      </div>

      {/* SVG Editor */}
      <div className="kernel-canvas-wrapper">
        <svg
          ref={svgRef}
          width={WIDTH}
          height={HEIGHT}
          className="kernel-canvas"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Grid */}
          {[0, 0.25, 0.5, 0.75, 1].map((v) => (
            <g key={`grid-${v}`}>
              <line
                x1={toSvgX(v)} y1={toSvgY(0)} x2={toSvgX(v)} y2={toSvgY(1)}
                stroke="rgba(255,255,255,0.06)" strokeDasharray="2,4"
              />
              <line
                x1={toSvgX(0)} y1={toSvgY(v)} x2={toSvgX(1)} y2={toSvgY(v)}
                stroke="rgba(255,255,255,0.06)" strokeDasharray="2,4"
              />
            </g>
          ))}

          {/* Axes */}
          <line x1={PADDING} y1={toSvgY(0)} x2={toSvgX(1)} y2={toSvgY(0)} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          <line x1={PADDING} y1={toSvgY(0)} x2={PADDING} y2={toSvgY(1)} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />

          {/* Axis labels */}
          <text x={WIDTH / 2} y={HEIGHT - 4} textAnchor="middle" fill="var(--text-tertiary)" fontSize="10">Price Interval (qSpacing)</text>
          <text x={8} y={HEIGHT / 2} textAnchor="middle" fill="var(--text-tertiary)" fontSize="10" transform={`rotate(-90, 8, ${HEIGHT / 2})`}>k(h)</text>

          {/* Area fill */}
          <path d={areaD} fill="url(#kernelGradient)" opacity="0.3" />

          {/* Gradient def */}
          <defs>
            <linearGradient id="kernelGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366F1" />
              <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Line */}
          <path d={pathD} fill="none" stroke="#6366F1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Points */}
          {points.map((p, i) => {
            const isEndpoint = i === 0 || i === points.length - 1;
            return (
              <g key={i}>
                {/* Outer glow */}
                <circle
                  cx={toSvgX(p.x)}
                  cy={toSvgY(p.y)}
                  r={dragging === i ? 14 : 10}
                  fill="transparent"
                  style={{ cursor: isEndpoint ? 'default' : 'grab' }}
                  onMouseDown={() => handleMouseDown(i)}
                />
                {/* Point */}
                <circle
                  cx={toSvgX(p.x)}
                  cy={toSvgY(p.y)}
                  r={dragging === i ? 7 : 5}
                  fill={isEndpoint ? 'var(--text-tertiary)' : '#6366F1'}
                  stroke={isEndpoint ? 'none' : 'white'}
                  strokeWidth={dragging === i ? 2.5 : 1.5}
                  style={{ cursor: isEndpoint ? 'default' : 'grab', transition: 'r 0.15s' }}
                  onMouseDown={() => handleMouseDown(i)}
                />
              </g>
            );
          })}
        </svg>
      </div>

      <p className="kernel-hint">
        Drag the control points to shape the kernel. Endpoints are fixed at (0,0) and (1,1).
      </p>
    </div>
  );
}
