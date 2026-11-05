import React from 'react';
import { 
  Home, Wifi, BookOpen, Utensils, Wrench, 
  Bus, ShieldAlert, CreditCard 
} from 'lucide-react';

const ICON_MAP = {
  Home,
  Wifi,
  BookOpen,
  Utensils,
  Wrench,
  Bus,
  ShieldAlert,
  CreditCard
};

export default function InteractiveCategoryChart({
  categories,
  categoryStats,
  activeCategory,
  onToggleCategory,
  totalComplaints
}) {
  const maxCount = Math.max(...categoryStats.map(c => c.count), 1);

  return (
    <div className="bg-[#0f1523] rounded-2xl p-5 border border-slate-800 shadow-sm h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">
              Complaints by Category
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Click bar to filter domain
            </p>
          </div>
          {activeCategory && (
            <button
              onClick={() => onToggleCategory(null)}
              className="text-xs font-medium text-cyan-400 hover:text-cyan-300 bg-cyan-950/40 border border-cyan-800/50 px-2 py-0.5 rounded-lg transition"
            >
              Clear
            </button>
          )}
        </div>

        {/* Categories List */}
        <div className="space-y-1.5 mt-2">
          {categoryStats.map((item) => {
            const Icon = ICON_MAP[item.icon] || Home;
            const isActive = activeCategory === item.id;
            const isDimmed = activeCategory && !isActive;
            const barWidth = Math.round((item.count / maxCount) * 100);
            const pctShare = totalComplaints > 0 ? Math.round((item.count / totalComplaints) * 100) : 0;

            return (
              <div
                key={item.id}
                onClick={() => onToggleCategory(isActive ? null : item.id)}
                className={`p-2 rounded-xl border transition-all cursor-pointer group select-none ${
                  isActive
                    ? 'border-cyan-500/80 bg-cyan-950/30 ring-1 ring-cyan-500/30'
                    : 'border-transparent hover:border-slate-700 hover:bg-slate-800/50'
                } ${isDimmed ? 'opacity-40' : 'opacity-100'}`}
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2 text-slate-200">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-medium group-hover:text-cyan-400 transition-colors">
                      {item.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-xs">
                    {item.breached > 0 && (
                      <span className="text-[10px] text-rose-400 bg-rose-950/60 border border-rose-800/40 px-1.5 py-0.2 rounded">
                        {item.breached} breached
                      </span>
                    )}
                    <span className="font-semibold text-slate-100 min-w-6 text-right">
                      {item.count}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      ({pctShare}%)
                    </span>
                  </div>
                </div>

                {/* Minimalist Progress Bar */}
                <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${barWidth}%`,
                      backgroundColor: item.color
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
