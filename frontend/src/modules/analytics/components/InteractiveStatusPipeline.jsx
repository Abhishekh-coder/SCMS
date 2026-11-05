import React from 'react';
import { 
  FileText, Search, Cog, AlertTriangle, 
  CheckCircle2, Archive 
} from 'lucide-react';

const STAGE_META = [
  { id: 'Open', label: 'Registered', icon: FileText, color: 'text-slate-400' },
  { id: 'Under Investigation', label: 'Under Review', icon: Search, color: 'text-sky-400' },
  { id: 'In Progress', label: 'In Progress', icon: Cog, color: 'text-amber-400' },
  { id: 'Escalated', label: 'Escalated', icon: AlertTriangle, color: 'text-rose-400' },
  { id: 'Resolved', label: 'Resolved', icon: CheckCircle2, color: 'text-emerald-400' },
  { id: 'Closed', label: 'Archived', icon: Archive, color: 'text-slate-500' },
];

export default function InteractiveStatusPipeline({
  statusCounts,
  activeStatus,
  onToggleStatus,
  totalComplaints
}) {
  return (
    <div className="bg-[#0f1523] rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-sm mb-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">
            Lifecycle Pipeline
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Click stage to isolate transition step
          </p>
        </div>
        {activeStatus && (
          <button
            onClick={() => onToggleStatus(null)}
            className="text-xs font-medium text-cyan-400 hover:text-cyan-300 bg-cyan-950/40 border border-cyan-800/50 px-2.5 py-0.5 rounded-lg transition"
          >
            Clear Status ({activeStatus})
          </button>
        )}
      </div>

      {/* Grid of pipeline stages */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {STAGE_META.map((stage) => {
          const Icon = stage.icon;
          const count = statusCounts[stage.id] || 0;
          const pct = totalComplaints > 0 ? Math.round((count / totalComplaints) * 100) : 0;
          const isActive = activeStatus === stage.id;
          const isDimmed = activeStatus && !isActive;

          return (
            <div
              key={stage.id}
              onClick={() => onToggleStatus(isActive ? null : stage.id)}
              className={`p-3 rounded-xl border transition-all cursor-pointer group select-none ${
                isActive
                  ? 'border-cyan-500/80 bg-cyan-950/20 ring-1 ring-cyan-500/40 shadow-xs'
                  : 'border-slate-800/80 bg-slate-900/40 hover:bg-slate-800/50 hover:border-slate-700'
              } ${isDimmed ? 'opacity-40' : 'opacity-100'}`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-slate-300 group-hover:text-cyan-300 transition-colors">
                  {stage.label}
                </span>
                <Icon className={`w-3.5 h-3.5 ${stage.color}`} />
              </div>

              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold text-slate-100 font-mono">{count}</span>
                <span className="text-[11px] text-slate-500 font-mono">{pct}%</span>
              </div>

              <div className="w-full bg-slate-800 h-1 rounded-full mt-2 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${
                    stage.id === 'Resolved' ? 'bg-emerald-500' :
                    stage.id === 'Escalated' ? 'bg-rose-500' :
                    stage.id === 'In Progress' ? 'bg-amber-500' :
                    'bg-cyan-500'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
