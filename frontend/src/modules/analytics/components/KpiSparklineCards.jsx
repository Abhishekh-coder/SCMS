import React from 'react';
import { FileText, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

// Smooth SVG sparkline generator
function renderSparkline(points, color) {
  const width = 120;
  const height = 36;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;

  const pts = points.map((val, idx) => {
    const x = (idx / (points.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 8) - 4;
    return `${x},${y}`;
  });

  const path = pts.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt}`, '');

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <filter id={`glow-${color.replace('#', '')}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor={color} floodOpacity="0.5" />
        </filter>
      </defs>
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#glow-${color.replace('#', '')})`}
      />
    </svg>
  );
}

export default function KpiSparklineCards({
  kpis,
  activeFilter,
  onToggleFilter
}) {
  const {
    total = 160,
    resolved = 63,
    inProgress = 19,
    escalated = 21,
    resolutionRate = 39
  } = kpis;

  const inProgressPct = total > 0 ? Math.round((inProgress / total) * 100) : 12;
  const escalatedPct = total > 0 ? Math.round((escalated / total) * 100) : 13;

  const cards = [
    {
      id: 'all',
      label: 'Total Complaints',
      value: total,
      subtext: null,
      icon: FileText,
      iconBg: 'bg-blue-50 text-blue-600 border border-blue-200',
      sparkColor: '#2563eb', // Blue
      sparkData: [12, 18, 14, 24, 20, 28, 22, 30],
      filterKey: 'status',
      filterVal: null,
      active: false
    },
    {
      id: 'resolved',
      label: 'Resolved',
      value: resolved,
      subtext: `${resolutionRate}% resolution rate`,
      icon: CheckCircle2,
      iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
      sparkColor: '#16a34a', // Green
      sparkData: [8, 11, 15, 14, 19, 22, 20, 26],
      filterKey: 'status',
      filterVal: 'Resolved',
      active: activeFilter?.status === 'Resolved'
    },
    {
      id: 'inprogress',
      label: 'In Progress',
      value: inProgress,
      subtext: `${inProgressPct}% of total`,
      icon: Clock,
      iconBg: 'bg-indigo-50 text-indigo-600 border border-indigo-200',
      sparkColor: '#7c3aed', // Purple
      sparkData: [15, 12, 19, 14, 18, 16, 20, 15],
      filterKey: 'status',
      filterVal: 'In Progress',
      active: activeFilter?.status === 'In Progress'
    },
    {
      id: 'escalated',
      label: 'Escalated',
      value: escalated,
      subtext: `${escalatedPct}% of total`,
      icon: AlertTriangle,
      iconBg: 'bg-rose-50 text-rose-600 border border-rose-200',
      sparkColor: '#e11d48', // Rose
      sparkData: [5, 8, 6, 12, 9, 14, 11, 16],
      filterKey: 'status',
      filterVal: 'Escalated',
      active: activeFilter?.status === 'Escalated'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.id}
            onClick={() => onToggleFilter && onToggleFilter(card.filterKey, card.active ? null : card.filterVal)}
            className={`bg-white border border-slate-200 rounded-2xl p-4 transition-all shadow-xs cursor-pointer select-none relative overflow-hidden flex items-center justify-between ${
              card.active
                ? 'bg-blue-50/40 ring-2 ring-blue-500/30 border-blue-300'
                : 'hover:border-slate-300'
            }`}
          >
            <div className="flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${card.iconBg}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-medium text-slate-500">
                  {card.label}
                </span>
              </div>

              <div>
                <span className="text-2xl font-bold text-slate-900 tracking-tight font-mono">
                  {card.value}
                </span>
                {card.subtext && (
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    {card.subtext}
                  </p>
                )}
              </div>
            </div>

            {/* Sparkline wave */}
            <div className="shrink-0 pl-2">
              {renderSparkline(card.sparkData, card.sparkColor)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
