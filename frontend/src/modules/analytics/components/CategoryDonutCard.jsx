import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

// Exact SVG arc path calculator
function getDonutArc(cx, cy, innerR, outerR, startAngleDeg, endAngleDeg) {
  const startRad = ((startAngleDeg - 90) * Math.PI) / 180;
  const endRad = ((endAngleDeg - 90) * Math.PI) / 180;

  const x1 = cx + outerR * Math.cos(startRad);
  const y1 = cy + outerR * Math.sin(startRad);
  const x2 = cx + outerR * Math.cos(endRad);
  const y2 = cy + outerR * Math.sin(endRad);

  const x3 = cx + innerR * Math.cos(endRad);
  const y3 = cy + innerR * Math.sin(endRad);
  const x4 = cx + innerR * Math.cos(startRad);
  const y4 = cy + innerR * Math.sin(startRad);

  const largeArcFlag = endAngleDeg - startAngleDeg > 180 ? 1 : 0;

  return `M ${x1} ${y1} A ${outerR} ${outerR} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerR} ${innerR} 0 ${largeArcFlag} 0 ${x4} ${y4} Z`;
}

export default function CategoryDonutCard({
  categories = [],
  categoryStats = [],
  activeCategory,
  onToggleCategory,
  hoveredCategory,
  onHoverCategory,
  totalComplaints = 160
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Compute angles for categories
  const total = categoryStats.reduce((sum, c) => sum + (c.count || 0), 0) || totalComplaints || 1;

  let currentAngle = 0;
  const segments = categoryStats.map((cat) => {
    const count = cat.count || 0;
    const pct = total > 0 ? (count / total) : 0;
    const angleSpan = pct * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angleSpan;
    currentAngle += angleSpan;

    return {
      ...cat,
      count,
      pctDisplay: Math.round(pct * 100),
      startAngle,
      endAngle,
      angleSpan
    };
  });

  const activeOrHovered = hoveredCategory || activeCategory;
  const activeSegmentData = segments.find(s => s.id === activeOrHovered);

  return (
    <div className="bg-white border border-slate-200 shadow-xs rounded-2xl p-4 select-none relative">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-slate-900 tracking-tight">
          Complaints by Category
        </h3>

        <div className="flex items-center gap-2">
          {activeCategory && (
            <button
              onClick={() => onToggleCategory(null)}
              className="text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-lg hover:bg-blue-100 transition cursor-pointer"
            >
              Clear Filter
            </button>
          )}

          {/* Filter dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(prev => !prev)}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <span>{activeCategory || 'All'}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-slate-200 rounded-lg shadow-xl py-1 z-30 max-h-48 overflow-y-auto">
                <button
                  onClick={() => {
                    onToggleCategory(null);
                    setDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  All Categories
                </button>
                {categoryStats.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      onToggleCategory(c.id);
                      setDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs truncate transition cursor-pointer ${
                      activeCategory === c.id ? 'text-blue-600 font-bold bg-blue-50' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Donut Chart & Legend Row */}
      <div className="flex items-center gap-4 my-2">
        
        {/* Donut SVG */}
        <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full" viewBox="0 0 120 120">
            {/* Background track */}
            <circle
              cx="60"
              cy="60"
              r="46"
              stroke="#f1f5f9"
              strokeWidth="14"
              fill="none"
            />

            {/* Slices */}
            {segments.map((seg) => {
              if (seg.count === 0) return null;

              const isSelected = activeCategory === seg.id;
              const isHovered = hoveredCategory === seg.id;
              const isHighlighted = isSelected || isHovered;
              const isDimmed = (activeCategory && !isSelected) || (hoveredCategory && !isHovered);

              const innerR = 38;
              const outerR = isHighlighted ? 53 : 50;

              // Full circle edge case
              if (seg.angleSpan >= 359.9) {
                return (
                  <circle
                    key={seg.id}
                    cx="60"
                    cy="60"
                    r="44"
                    stroke={seg.color}
                    strokeWidth={isHighlighted ? 15 : 12}
                    fill="none"
                    className="cursor-pointer transition-all duration-200"
                    onClick={() => onToggleCategory(activeCategory === seg.id ? null : seg.id)}
                    onMouseEnter={() => onHoverCategory && onHoverCategory(seg.id)}
                    onMouseLeave={() => onHoverCategory && onHoverCategory(null)}
                    opacity={isDimmed ? 0.35 : 1}
                  />
                );
              }

              const pathData = getDonutArc(60, 60, innerR, outerR, seg.startAngle, seg.endAngle);

              return (
                <path
                  key={seg.id}
                  d={pathData}
                  fill={seg.color}
                  opacity={isDimmed ? 0.35 : 1}
                  className="cursor-pointer transition-all duration-200 hover:brightness-105"
                  onClick={() => onToggleCategory(activeCategory === seg.id ? null : seg.id)}
                  onMouseEnter={() => onHoverCategory && onHoverCategory(seg.id)}
                  onMouseLeave={() => onHoverCategory && onHoverCategory(null)}
                />
              );
            })}
          </svg>

          {/* Center Label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            {activeSegmentData ? (
              <>
                <span className="text-xs font-bold leading-tight" style={{ color: activeSegmentData.color }}>
                  {activeSegmentData.count}
                </span>
                <span className="text-[10px] text-slate-500">
                  {activeSegmentData.pctDisplay}%
                </span>
              </>
            ) : (
              <>
                <span className="text-xl font-black text-slate-900 leading-tight font-mono">
                  {total}
                </span>
                <span className="text-[10px] font-medium text-slate-500">
                  Total
                </span>
              </>
            )}
          </div>
        </div>

        {/* Legend List */}
        <div className="flex flex-col gap-1 flex-1 w-full overflow-hidden">
          {segments.map((item) => {
            const isSelected = activeCategory === item.id;
            const isHovered = hoveredCategory === item.id;
            const isDimmed = (activeCategory && !isSelected) || (hoveredCategory && !isHovered);

            return (
              <div
                key={item.id}
                onClick={() => onToggleCategory(isSelected ? null : item.id)}
                onMouseEnter={() => onHoverCategory && onHoverCategory(item.id)}
                onMouseLeave={() => onHoverCategory && onHoverCategory(null)}
                className={`flex items-center justify-between px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold'
                    : isHovered
                    ? 'bg-slate-100 text-slate-900'
                    : 'hover:bg-slate-50 text-slate-700'
                } ${isDimmed ? 'opacity-40' : 'opacity-100'}`}
              >
                <div className="flex items-center gap-1.5 truncate pr-2">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-[11px] truncate">
                    {item.label}
                  </span>
                </div>

                <div className="flex items-baseline gap-1 font-mono text-[11px] shrink-0">
                  <span className="font-semibold text-slate-900 min-w-4 text-right">
                    {item.count}
                  </span>
                  <span className="text-[10px] text-slate-500 min-w-6 text-right">
                    {item.pctDisplay}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
