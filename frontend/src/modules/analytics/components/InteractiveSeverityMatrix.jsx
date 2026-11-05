import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';

// Math helper to generate SVG donut arc path
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

export default function InteractiveSeverityMatrix({
  severityStats = {},
  activeSeverity,
  onToggleSeverity,
  slaHealthStats = {},
  activeSlaStatus,
  onToggleSlaStatus,
  totalComplaints = 0
}) {
  const [hoveredSev, setHoveredSev] = useState(null);

  const severities = [
    { id: 'Critical', label: 'Critical', color: '#f43f5e', icon: ShieldAlert },
    { id: 'High', label: 'High', color: '#fb923c', icon: AlertTriangle },
    { id: 'Medium', label: 'Medium', color: '#facc15', icon: AlertCircle },
    { id: 'Low', label: 'Low', color: '#10b981', icon: CheckCircle2 },
  ];

  // Calculate total counts for severity (accurate sum across severities in scope)
  const severityTotal = severities.reduce((sum, s) => sum + (severityStats[s.id] || 0), 0);

  // Compute angles for each segment
  let currentAngle = 0;
  const segments = severities.map((sev) => {
    const count = severityStats[sev.id] || 0;
    const pct = severityTotal > 0 ? (count / severityTotal) : 0;
    const angleSpan = pct * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angleSpan;
    currentAngle += angleSpan;

    return {
      ...sev,
      count,
      pctDisplay: Math.round(pct * 100),
      startAngle,
      endAngle,
      angleSpan
    };
  });

  const activeOrHovered = hoveredSev || activeSeverity;
  const activeSegmentData = segments.find(s => s.id === activeOrHovered);

  return (
    <div className="bg-[#0f1523] rounded-2xl p-5 border border-slate-800 shadow-sm h-full flex flex-col justify-between">
      <div>
        {/* Minimal Header */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">
              Severity Distribution
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Click slice or priority to filter
            </p>
          </div>
          {(activeSeverity || activeSlaStatus) && (
            <button
              onClick={() => {
                if (activeSeverity) onToggleSeverity(null);
                if (activeSlaStatus) onToggleSlaStatus(null);
              }}
              className="text-xs font-medium text-cyan-400 hover:text-cyan-300 bg-cyan-950/40 border border-cyan-800/50 px-2 py-0.5 rounded-lg transition"
            >
              Clear
            </button>
          )}
        </div>

        {/* Minimalist Donut Chart & Clean Legend */}
        <div className="flex flex-col sm:flex-row items-center gap-6 my-2">
          
          {/* SVG Donut */}
          <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full" viewBox="0 0 120 120">
              {/* Background ring */}
              <circle
                cx="60"
                cy="60"
                r="46"
                stroke="#1e293b"
                strokeWidth="14"
                fill="none"
              />

              {severityTotal > 0 && segments.map((seg) => {
                if (seg.count === 0) return null;

                const isSelected = activeSeverity === seg.id;
                const isHovered = hoveredSev === seg.id;
                const isHighlighted = isSelected || isHovered;
                const isDimmed = activeSeverity && !isSelected;

                const innerR = 38;
                const outerR = isHighlighted ? 53 : 50;

                // Handle full 100% circle edge-case
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
                      className="cursor-pointer transition-all duration-300"
                      onClick={() => onToggleSeverity(activeSeverity === seg.id ? null : seg.id)}
                      onMouseEnter={() => setHoveredSev(seg.id)}
                      onMouseLeave={() => setHoveredSev(null)}
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
                    className="cursor-pointer transition-all duration-200 hover:brightness-110"
                    onClick={() => onToggleSeverity(activeSeverity === seg.id ? null : seg.id)}
                    onMouseEnter={() => setHoveredSev(seg.id)}
                    onMouseLeave={() => setHoveredSev(null)}
                  />
                );
              })}
            </svg>

            {/* Center Dynamic Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              {activeSegmentData ? (
                <>
                  <span className="text-xs font-semibold" style={{ color: activeSegmentData.color }}>
                    {activeSegmentData.id}
                  </span>
                  <span className="text-lg font-bold text-white leading-tight">
                    {activeSegmentData.count}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {activeSegmentData.pctDisplay}%
                  </span>
                </>
              ) : (
                <>
                  <span className="text-lg font-bold text-white leading-tight">
                    {severityTotal}
                  </span>
                  <span className="text-[10px] uppercase font-medium text-slate-400">
                    Total
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Minimalist Legend (Clickable) */}
          <div className="flex flex-col gap-1.5 flex-1 w-full">
            {segments.map((item) => {
              const isSelected = activeSeverity === item.id;
              const isDimmed = activeSeverity && !isSelected;

              return (
                <div
                  key={item.id}
                  onClick={() => onToggleSeverity(isSelected ? null : item.id)}
                  onMouseEnter={() => setHoveredSev(item.id)}
                  onMouseLeave={() => setHoveredSev(null)}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800 border-slate-700 ring-1 ring-cyan-500/50'
                      : 'border-transparent hover:bg-slate-800/60'
                  } ${isDimmed ? 'opacity-40' : 'opacity-100'}`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-xs font-medium text-slate-200">
                      {item.label}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-1.5 font-mono">
                    <span className="text-xs font-semibold text-slate-100">
                      {item.count}
                    </span>
                    <span className="text-[10px] text-slate-400 min-w-7 text-right">
                      {item.pctDisplay}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Minimal SLA Health Status Pills */}
        <div className="mt-3 pt-3 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-[11px] font-medium text-slate-400 mb-1.5">
            <span>SLA Health</span>
            <span className="text-[10px] text-slate-500">Click to filter</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() => onToggleSlaStatus(activeSlaStatus === 'Within SLA' ? null : 'Within SLA')}
              className={`px-2 py-1.5 rounded-lg border text-left transition ${
                activeSlaStatus === 'Within SLA'
                  ? 'bg-emerald-950/60 border-emerald-500/60 ring-1 ring-emerald-500/30'
                  : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/60'
              }`}
            >
              <span className="text-[10px] text-emerald-400 block font-medium">Within SLA</span>
              <span className="text-xs font-bold text-slate-100">
                {slaHealthStats['Within SLA'] || 0}
              </span>
            </button>

            <button
              onClick={() => onToggleSlaStatus(activeSlaStatus === 'Approaching Breach' ? null : 'Approaching Breach')}
              className={`px-2 py-1.5 rounded-lg border text-left transition ${
                activeSlaStatus === 'Approaching Breach'
                  ? 'bg-amber-950/60 border-amber-500/60 ring-1 ring-amber-500/30'
                  : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/60'
              }`}
            >
              <span className="text-[10px] text-amber-400 block font-medium">Warning</span>
              <span className="text-xs font-bold text-slate-100">
                {slaHealthStats['Approaching Breach'] || 0}
              </span>
            </button>

            <button
              onClick={() => onToggleSlaStatus(activeSlaStatus === 'Breached' ? null : 'Breached')}
              className={`px-2 py-1.5 rounded-lg border text-left transition ${
                activeSlaStatus === 'Breached'
                  ? 'bg-rose-950/60 border-rose-500/60 ring-1 ring-rose-500/30'
                  : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/60'
              }`}
            >
              <span className="text-[10px] text-rose-400 block font-medium">Breached</span>
              <span className="text-xs font-bold text-slate-100">
                {slaHealthStats['Breached'] || 0}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
