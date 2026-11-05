import React, { useState } from 'react';

export default function InteractiveTemporalChart({
  trends,
  activeTimeBucket,
  onToggleTimeBucket,
  totalFiltered
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const maxVal = Math.max(...trends.flatMap(t => [t.inflow, t.resolved]), 5);
  const chartHeight = 140;
  const chartWidth = 560;
  const paddingX = 35;
  const paddingY = 20;
  const innerWidth = chartWidth - paddingX * 2;
  const innerHeight = chartHeight - paddingY * 2;

  // Compute SVG coordinates
  const pointsInflow = trends.map((t, idx) => {
    const x = paddingX + (idx / Math.max(trends.length - 1, 1)) * innerWidth;
    const y = chartHeight - paddingY - (t.inflow / maxVal) * innerHeight;
    return { x, y, ...t, index: idx };
  });

  const pointsResolved = trends.map((t, idx) => {
    const x = paddingX + (idx / Math.max(trends.length - 1, 1)) * innerWidth;
    const y = chartHeight - paddingY - (t.resolved / maxVal) * innerHeight;
    return { x, y, ...t, index: idx };
  });

  const inflowPath = pointsInflow.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');
  const inflowArea = `${inflowPath} L ${pointsInflow[pointsInflow.length - 1]?.x} ${chartHeight - paddingY} L ${pointsInflow[0]?.x} ${chartHeight - paddingY} Z`;

  const resolvedPath = pointsResolved.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');

  return (
    <div className="bg-[#0f1523] rounded-2xl p-5 border border-slate-800 shadow-sm mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">
            Inflow vs Resolution Trend
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Click weekly milestone to filter time period
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" />
            <span className="text-slate-300">Inflow</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
            <span className="text-slate-300">Resolved</span>
          </div>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto min-w-[480px]">
          <defs>
            <linearGradient id="darkInflowGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.5, 1].map((pct, i) => {
            const y = paddingY + pct * innerHeight;
            return (
              <line
                key={i}
                x1={paddingX}
                y1={y}
                x2={chartWidth - paddingX}
                y2={y}
                stroke="#1e293b"
                strokeDasharray="4 4"
              />
            );
          })}

          {/* Inflow Area & Path */}
          <path d={inflowArea} fill="url(#darkInflowGrad)" />
          <path d={inflowPath} fill="none" stroke="#38bdf8" strokeWidth="2.5" />

          {/* Resolved Path */}
          <path d={resolvedPath} fill="none" stroke="#34d399" strokeWidth="2" strokeDasharray="3 3" />

          {/* Interactive Data Points */}
          {pointsInflow.map((p) => {
            const isSelected = activeTimeBucket === p.label;
            const isHovered = hoveredIndex === p.index;

            return (
              <g key={p.label}>
                {/* Clickable Column Guide */}
                <rect
                  x={p.x - 18}
                  y={paddingY}
                  width="36"
                  height={innerHeight}
                  fill={isSelected ? '#38bdf8' : isHovered ? '#1e293b' : 'transparent'}
                  opacity={isSelected ? 0.15 : isHovered ? 0.4 : 0}
                  className="cursor-pointer transition-opacity"
                  onClick={() => onToggleTimeBucket(isSelected ? null : p.label)}
                  onMouseEnter={() => setHoveredIndex(p.index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />

                {/* Point dot */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isSelected || isHovered ? 5 : 3.5}
                  fill={isSelected ? '#38bdf8' : '#0f1523'}
                  stroke="#38bdf8"
                  strokeWidth="2"
                  className="cursor-pointer transition-all"
                  onClick={() => onToggleTimeBucket(isSelected ? null : p.label)}
                  onMouseEnter={() => setHoveredIndex(p.index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />

                {/* Axis label */}
                <text
                  x={p.x}
                  y={chartHeight - 4}
                  textAnchor="middle"
                  className={`text-[10px] font-mono cursor-pointer ${
                    isSelected ? 'fill-cyan-400 font-bold' : 'fill-slate-400'
                  }`}
                  onClick={() => onToggleTimeBucket(isSelected ? null : p.label)}
                >
                  {p.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
