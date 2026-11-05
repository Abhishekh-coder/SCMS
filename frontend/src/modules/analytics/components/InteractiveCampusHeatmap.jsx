import React from 'react';
import { MapPin } from 'lucide-react';

export default function InteractiveCampusHeatmap({
  locationStats,
  activeLocation,
  onToggleLocation,
  totalComplaints
}) {
  return (
    <div className="bg-[#0f1523] rounded-2xl p-5 border border-slate-800 shadow-sm h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">
              Campus Facilities & Zones
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Click location to filter incidents
            </p>
          </div>
          {activeLocation && (
            <button
              onClick={() => onToggleLocation(null)}
              className="text-xs font-medium text-cyan-400 hover:text-cyan-300 bg-cyan-950/40 border border-cyan-800/50 px-2 py-0.5 rounded-lg transition"
            >
              Clear
            </button>
          )}
        </div>

        {/* Minimalist Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
          {locationStats.map((loc) => {
            const isActive = activeLocation === loc.name;
            const isDimmed = activeLocation && !isActive;

            return (
              <div
                key={loc.name}
                onClick={() => onToggleLocation(isActive ? null : loc.name)}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer group select-none ${
                  isActive
                    ? 'border-cyan-500/80 bg-cyan-950/20 ring-1 ring-cyan-500/30'
                    : 'border-slate-800/80 bg-slate-900/40 hover:bg-slate-800/60 hover:border-slate-700'
                } ${isDimmed ? 'opacity-40' : 'opacity-100'}`}
              >
                <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                  <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                  <span className="text-[10px] text-slate-400 truncate">
                    {loc.zone}
                  </span>
                </div>

                <h4 className="text-xs font-medium text-slate-200 line-clamp-1 group-hover:text-cyan-300 transition-colors">
                  {loc.name}
                </h4>

                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-800/60 font-mono text-[11px]">
                  <span className="text-slate-400">Total:</span>
                  <span className="font-semibold text-slate-100">{loc.count}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
