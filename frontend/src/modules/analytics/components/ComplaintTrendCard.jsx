import React, { useState } from 'react';
import { Clock, ChevronDown } from 'lucide-react';

export default function ComplaintTrendCard({
  trends = [],
  timeRange = [0, 7], // [startIndex, endIndex]
  onTimeRangeChange,
  hoveredWeek,
  onHoverWeek,
  granularity = 'Weekly',
  onGranularityChange
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dragStart, setDragStart] = useState(null);

  const chartWidth = 420;
  const chartHeight = 160;
  const paddingX = 35;
  const paddingY = 25;
  const innerWidth = chartWidth - paddingX * 2;
  const innerHeight = chartHeight - paddingY * 2;

  const maxVal = Math.max(...trends.flatMap(t => [t.inflow, t.resolved]), 50);

  // Calculate coordinates
  const pointsNew = trends.map((t, idx) => {
    const x = paddingX + (idx / Math.max(trends.length - 1, 1)) * innerWidth;
    const y = chartHeight - paddingY - (t.inflow / maxVal) * innerHeight;
    return { x, y, ...t, index: idx };
  });

  const pointsResolved = trends.map((t, idx) => {
    const x = paddingX + (idx / Math.max(trends.length - 1, 1)) * innerWidth;
    const y = chartHeight - paddingY - (t.resolved / maxVal) * innerHeight;
    return { x, y, ...t, index: idx };
  });

  const pathNew = pointsNew.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');
  const pathResolved = pointsResolved.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');
  const areaResolved = `${pathResolved} L ${pointsResolved[pointsResolved.length - 1]?.x} ${chartHeight - paddingY} L ${pointsResolved[0]?.x} ${chartHeight - paddingY} Z`;

  // Range Selection logic
  const startIndex = timeRange ? timeRange[0] : 0;
  const endIndex = timeRange ? timeRange[1] : trends.length - 1;

  const startX = pointsNew[startIndex]?.x || paddingX;
  const endX = pointsNew[endIndex]?.x || (chartWidth - paddingX);

  const handlePointClick = (idx) => {
    if (dragStart === null) {
      setDragStart(idx);
    } else {
      const start = Math.min(dragStart, idx);
      const end = Math.max(dragStart, idx);
      onTimeRangeChange && onTimeRangeChange([start, end]);
      setDragStart(null);
    }
  };

  const handleResetRange = () => {
    onTimeRangeChange && onTimeRangeChange([0, trends.length - 1]);
    setDragStart(null);
  };

  const isRangeFiltered = startIndex > 0 || endIndex < trends.length - 1;

  return (
    <div className="bg-white border border-slate-200 shadow-xs rounded-2xl p-4 select-none relative">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            Complaint Trend
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {isRangeFiltered && (
            <button
              onClick={handleResetRange}
              className="text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-lg hover:bg-blue-100 transition cursor-pointer"
            >
              Reset Range ({trends[startIndex]?.label} - {trends[endIndex]?.label})
            </button>
          )}

          {/* Granularity dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(prev => !prev)}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <span>{granularity}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-1 w-24 bg-white border border-slate-200 rounded-lg shadow-xl py-1 z-30">
                {['Weekly', 'Daily', 'Monthly'].map((g) => (
                  <button
                    key={g}
                    onClick={() => {
                      onGranularityChange && onGranularityChange(g);
                      setDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1 text-xs transition cursor-pointer ${
                      granularity === g ? 'text-blue-600 font-bold bg-blue-50' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-3 text-[11px] font-medium mb-1">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#6366f1]" />
          <span className="text-slate-500">New Complaints</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#0284c7]" />
          <span className="text-slate-500">Resolved</span>
        </div>
      </div>

      {/* Interactive Time Series SVG */}
      <div className="w-full relative">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto">
          <defs>
            <linearGradient id="resolvedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines & Y-axis labels */}
          {[0, 25, 50].map((val) => {
            const y = chartHeight - paddingY - (val / maxVal) * innerHeight;
            return (
              <g key={val}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={chartWidth - paddingX}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeDasharray="3 3"
                />
                <text
                  x={paddingX - 6}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-slate-500 font-mono text-[9px]"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Highlighted Range Shading */}
          <rect
            x={Math.min(startX, endX) - 15}
            y={paddingY}
            width={Math.abs(endX - startX) + 30}
            height={innerHeight}
            fill="#3b82f6"
            opacity="0.08"
            rx="6"
          />

          {/* Resolved Area Fill & Line */}
          <path d={areaResolved} fill="url(#resolvedGradient)" />
          <path d={pathResolved} fill="none" stroke="#0284c7" strokeWidth="2.5" />

          {/* New Complaints Line */}
          <path d={pathNew} fill="none" stroke="#6366f1" strokeWidth="2.5" />

          {/* Interactive Week Nodes */}
          {pointsNew.map((pt) => {
            const isHovered = hoveredWeek === pt.label;
            const inRange = pt.index >= startIndex && pt.index <= endIndex;

            return (
              <g key={pt.label}>
                {/* Clickable Column for range selection */}
                <rect
                  x={pt.x - 16}
                  y={paddingY}
                  width="32"
                  height={innerHeight}
                  fill="transparent"
                  className="cursor-pointer"
                  onClick={() => handlePointClick(pt.index)}
                  onMouseEnter={() => onHoverWeek && onHoverWeek(pt.label)}
                  onMouseLeave={() => onHoverWeek && onHoverWeek(null)}
                />

                {/* Node on New Complaints */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 5.5 : 3.5}
                  fill={isHovered ? '#6366f1' : inRange ? '#818cf8' : '#94a3b8'}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  className="cursor-pointer transition-all"
                  onClick={() => handlePointClick(pt.index)}
                  onMouseEnter={() => onHoverWeek && onHoverWeek(pt.label)}
                  onMouseLeave={() => onHoverWeek && onHoverWeek(null)}
                />

                {/* Node on Resolved */}
                <circle
                  cx={pointsResolved[pt.index]?.x}
                  cy={pointsResolved[pt.index]?.y}
                  r={isHovered ? 5.5 : 3.5}
                  fill={isHovered ? '#0284c7' : inRange ? '#38bdf8' : '#94a3b8'}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  className="cursor-pointer transition-all"
                  onClick={() => handlePointClick(pt.index)}
                  onMouseEnter={() => onHoverWeek && onHoverWeek(pt.label)}
                  onMouseLeave={() => onHoverWeek && onHoverWeek(null)}
                />

                {/* X-axis Week Label */}
                <text
                  x={pt.x}
                  y={chartHeight - 6}
                  textAnchor="middle"
                  className={`text-[9px] font-mono cursor-pointer transition-colors ${
                    isHovered
                      ? 'fill-blue-600 font-bold'
                      : inRange
                      ? 'fill-slate-900 font-semibold'
                      : 'fill-slate-400'
                  }`}
                  onClick={() => handlePointClick(pt.index)}
                >
                  {pt.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip showing connected metrics */}
        {hoveredWeek && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-xl z-30 text-xs pointer-events-none flex items-center gap-3">
            <span className="font-bold text-slate-900">{hoveredWeek}</span>
            <span className="text-[#6366f1] font-mono font-semibold">
              New: {trends.find(t => t.label === hoveredWeek)?.inflow || 0}
            </span>
            <span className="text-[#0284c7] font-mono font-semibold">
              Resolved: {trends.find(t => t.label === hoveredWeek)?.resolved || 0}
            </span>
          </div>
        )}
      </div>

      <p className="text-[10px] text-slate-500 italic text-right mt-1">
        💡 Click any two weeks to select a custom timeline range
      </p>
    </div>
  );
}
