import React from 'react';
import { BarChart3, AlertTriangle, Layers, Clock, CheckCircle2 } from 'lucide-react';

export default function ActionableInsights({ complaints = [], role = 'CLASS_INCHARGE' }) {
  if (!complaints || complaints.length === 0) {
    return null;
  }

  // 1. Dynamic Status Breakdown
  const total = complaints.length;
  const inProgressCount = complaints.filter(c => ['ASSIGNED', 'IN_PROGRESS'].includes(c.status)).length;
  const forwardedCount = complaints.filter(c => c.status === 'FORWARDED').length;
  const escalatedCount = complaints.filter(c => c.status === 'ESCALATED').length;
  const resolvedCount = complaints.filter(c => ['RESOLVED', 'CLOSED'].includes(c.status)).length;

  // 2. Dynamic Priority Distribution
  const criticalCount = complaints.filter(c => c.priority === 'CRITICAL').length;
  const highCount = complaints.filter(c => c.priority === 'HIGH').length;
  const mediumCount = complaints.filter(c => c.priority === 'MEDIUM' || !c.priority).length;
  const lowCount = complaints.filter(c => c.priority === 'LOW').length;

  // 3. Dynamic Category Aggregation (Zero hardcoded categories)
  const categoryMap = {};
  complaints.forEach(c => {
    const cat = (c.categoryCode || 'GENERAL').replace(/_/g, ' ');
    categoryMap[cat] = (categoryMap[cat] || 0) + 1;
  });

  const sortedCategories = Object.entries(categoryMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 w-full min-w-0 max-w-full box-border">
      
      {/* ── Card 1: Actionable Status & Workload ── */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 min-w-0 max-w-full">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600 shrink-0" />
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              {role === 'TEACHER_GUARDIAN' ? 'Forwarded Workload' : 'Division Activity'}
            </h4>
          </div>
          <span className="text-xs font-mono font-bold text-blue-600">{total} Total</span>
        </div>

        <div className="space-y-2.5 text-xs">
          <div>
            <div className="flex justify-between font-medium text-slate-700 mb-1">
              <span>In Progress / Assigned</span>
              <span className="font-bold text-slate-900">{inProgressCount}</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 rounded-full transition-all duration-300"
                style={{ width: `${total ? (inProgressCount / total) * 100 : 0}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between font-medium text-slate-700 mb-1">
              <span>Forwarded to TG</span>
              <span className="font-bold text-slate-900">{forwardedCount}</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                style={{ width: `${total ? (forwardedCount / total) * 100 : 0}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between font-medium text-slate-700 mb-1">
              <span>Resolved</span>
              <span className="font-bold text-slate-900">{resolvedCount}</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                style={{ width: `${total ? (resolvedCount / total) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Card 2: Priority Load Breakdown ── */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 min-w-0 max-w-full">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Priority Distribution
            </h4>
          </div>
          <span className="text-[11px] font-semibold text-slate-400">Live Load</span>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-red-50/70 border border-red-100">
            <span className="text-[11px] font-semibold text-red-600 block">Critical</span>
            <span className="text-lg font-bold text-red-950 font-mono">{criticalCount}</span>
          </div>
          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-100">
            <span className="text-[11px] font-semibold text-amber-700 block">High</span>
            <span className="text-lg font-bold text-amber-950 font-mono">{highCount}</span>
          </div>
          <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100">
            <span className="text-[11px] font-semibold text-blue-700 block">Medium</span>
            <span className="text-lg font-bold text-blue-950 font-mono">{mediumCount}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] font-semibold text-slate-600 block">Low</span>
            <span className="text-lg font-bold text-slate-900 font-mono">{lowCount}</span>
          </div>
        </div>
      </div>

      {/* ── Card 3: Live Category Insights ── */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 min-w-0 max-w-full">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600 shrink-0" />
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Top Categories
            </h4>
          </div>
          <span className="text-[11px] font-semibold text-slate-400">Dynamic</span>
        </div>

        <div className="space-y-2.5 text-xs">
          {sortedCategories.length > 0 ? (
            sortedCategories.map(([categoryName, count]) => (
              <div key={categoryName}>
                <div className="flex justify-between font-medium text-slate-700 mb-1">
                  <span className="uppercase text-[11px] truncate max-w-[70%]">{categoryName}</span>
                  <span className="font-bold text-slate-900">{count}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 rounded-full transition-all duration-300"
                    style={{ width: `${total ? (count / total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 italic py-2">No categories recorded yet.</p>
          )}
        </div>
      </div>

    </div>
  );
}
