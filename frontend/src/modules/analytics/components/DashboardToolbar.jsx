import React from 'react';
import { 
  Search, X, Download, RotateCcw, Calendar, 
  BarChart2, ListFilter 
} from 'lucide-react';

export default function DashboardToolbar({
  searchQuery,
  onSearchChange,
  dateRange,
  onDateRangeChange,
  activeTab,
  onTabChange,
  totalFiltered,
  totalAll,
  onResetAll,
  hasActiveFilters,
  onExportCsv
}) {
  const dateRanges = [
    { id: '7D', label: '7D' },
    { id: '14D', label: '14D' },
    { id: '30D', label: '30D' },
    { id: '60D', label: '60D' },
    { id: 'ALL', label: 'All Time' },
  ];

  return (
    <div className="bg-[#0f1523] rounded-2xl border border-slate-800 p-3 sm:p-4 shadow-sm mb-4 transition-all">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        
        {/* Search within dashboard */}
        <div className="flex-1 max-w-md relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Filter complaints by keyword, ID, location..."
            className="w-full pl-9 pr-8 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500/80 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-0.5 rounded-full"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Date presets */}
        <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800 self-start lg:self-auto">
          {dateRanges.map((range) => {
            const isActive = dateRange === range.id;
            return (
              <button
                key={range.id}
                onClick={() => onDateRangeChange(range.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
                  isActive
                    ? 'bg-slate-800 text-cyan-400 font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {range.label}
              </button>
            );
          })}
        </div>

        {/* View mode toggle & Actions */}
        <div className="flex items-center gap-2 self-end lg:self-auto">
          <div className="flex items-center bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => onTabChange('analytics')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'analytics'
                  ? 'bg-slate-800 text-cyan-400 font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Overview</span>
            </button>
            <button
              onClick={() => onTabChange('drilldown')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'drilldown'
                  ? 'bg-slate-800 text-cyan-400 font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Records ({totalFiltered})</span>
            </button>
          </div>

          <button
            onClick={onExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-xl transition cursor-pointer"
            title="Export filtered complaints to CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Export</span>
          </button>

          {hasActiveFilters && (
            <button
              onClick={onResetAll}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-400 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/40 rounded-xl transition cursor-pointer"
              title="Reset all active filters"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
