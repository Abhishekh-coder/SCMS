import React from 'react';
import { X, RotateCcw } from 'lucide-react';

export default function ActiveFilterBanner({
  filters,
  onRemoveFilter,
  onResetAll,
  totalFiltered,
  totalAll
}) {
  const activeChips = [];

  if (filters.category) {
    activeChips.push({
      key: 'category',
      label: `Category: ${filters.category}`,
    });
  }
  if (filters.severity) {
    activeChips.push({
      key: 'severity',
      label: `Severity: ${filters.severity}`,
    });
  }
  if (filters.status) {
    activeChips.push({
      key: 'status',
      label: `Status: ${filters.status}`,
    });
  }
  if (filters.slaStatus) {
    activeChips.push({
      key: 'slaStatus',
      label: `SLA: ${filters.slaStatus}`,
    });
  }
  if (filters.department) {
    activeChips.push({
      key: 'department',
      label: `Dept: ${filters.department}`,
    });
  }
  if (filters.location) {
    activeChips.push({
      key: 'location',
      label: `Location: ${filters.location}`,
    });
  }
  if (filters.timeBucket) {
    activeChips.push({
      key: 'timeBucket',
      label: `Window: ${filters.timeBucket}`,
    });
  }
  if (filters.searchQuery) {
    activeChips.push({
      key: 'searchQuery',
      label: `Search: "${filters.searchQuery}"`,
    });
  }

  // Do not render anything if no active filters
  if (activeChips.length === 0) {
    return null;
  }

  return (
    <div className="bg-[#0f1523] border border-slate-800 rounded-xl px-3.5 py-2 mb-4 flex flex-wrap items-center justify-between gap-2 transition-all">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-slate-400 font-medium mr-1">
          Active ({activeChips.length}):
        </span>

        {activeChips.map((chip) => (
          <span
            key={chip.key}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800/90 text-slate-200 border border-slate-700/80 shadow-xs"
          >
            <span>{chip.label}</span>
            <button
              onClick={() => onRemoveFilter(chip.key)}
              className="text-slate-400 hover:text-white p-0.5 rounded-full transition-colors"
              title="Remove filter"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>

      <div className="flex items-center gap-3 text-xs">
        <span className="text-slate-400 font-mono">
          {totalFiltered} of {totalAll}
        </span>
        <button
          onClick={onResetAll}
          className="text-rose-400 hover:text-rose-300 font-medium inline-flex items-center gap-1 transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Clear all</span>
        </button>
      </div>
    </div>
  );
}
