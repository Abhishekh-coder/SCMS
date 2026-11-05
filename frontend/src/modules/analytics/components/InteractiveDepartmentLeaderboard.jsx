import React from 'react';

export default function InteractiveDepartmentLeaderboard({
  departmentStats,
  activeDepartment,
  onToggleDepartment,
  totalComplaints
}) {
  return (
    <div className="bg-[#0f1523] rounded-2xl p-5 border border-slate-800 shadow-sm h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">
              Department Workload
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Click department to isolate workload
            </p>
          </div>
          {activeDepartment && (
            <button
              onClick={() => onToggleDepartment(null)}
              className="text-xs font-medium text-cyan-400 hover:text-cyan-300 bg-cyan-950/40 border border-cyan-800/50 px-2 py-0.5 rounded-lg transition"
            >
              Clear
            </button>
          )}
        </div>

        {/* Clean list */}
        <div className="space-y-1.5 mt-2">
          {departmentStats.map((dept) => {
            const isActive = activeDepartment === dept.id;
            const isDimmed = activeDepartment && !isActive;
            const resRate = dept.total > 0 ? Math.round((dept.resolved / dept.total) * 100) : 0;

            return (
              <div
                key={dept.id}
                onClick={() => onToggleDepartment(isActive ? null : dept.id)}
                className={`p-2 rounded-xl border transition-all cursor-pointer group select-none flex items-center justify-between ${
                  isActive
                    ? 'border-indigo-500/80 bg-indigo-950/20 ring-1 ring-indigo-500/30'
                    : 'border-transparent hover:border-slate-700 hover:bg-slate-800/50'
                } ${isDimmed ? 'opacity-40' : 'opacity-100'}`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                    {dept.code}
                  </span>
                  <div>
                    <h4 className="text-xs font-medium text-slate-200 group-hover:text-cyan-300 transition-colors">
                      {dept.name}
                    </h4>
                  </div>
                </div>

                <div className="flex items-center gap-3 font-mono text-xs">
                  {dept.breached > 0 && (
                    <span className="text-[10px] text-rose-400 bg-rose-950/60 border border-rose-800/40 px-1.5 py-0.2 rounded">
                      {dept.breached} breached
                    </span>
                  )}
                  <span className="text-[10px] text-slate-400">
                    {resRate}% res
                  </span>
                  <span className="font-semibold text-slate-100 min-w-5 text-right">
                    {dept.total}
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
