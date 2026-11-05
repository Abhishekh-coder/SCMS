import React from 'react';
import { Clock, AlertTriangle, ArrowRight, CheckCircle2, Layers } from 'lucide-react';

export default function ComplaintInsightsPanel({ complaints = [], role = 'CLASS_INCHARGE' }) {
  const total = complaints.length;

  if (total === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs text-center">
        <p className="text-sm font-bold text-slate-800">No complaint analytics available yet</p>
        <p className="text-xs text-slate-500 mt-1">Analytics will automatically populate as grievances are submitted and processed.</p>
      </div>
    );
  }

  // 1. Dynamic Status Breakdown
  const pendingReview = complaints.filter(c => ['SUBMITTED', 'ASSIGNED', 'IN_PROGRESS'].includes(c.status)).length;
  const forwardedToTG = complaints.filter(c => c.status === 'FORWARDED').length;
  const escalatedToHOD = complaints.filter(c => c.status === 'ESCALATED').length;
  const resolved = complaints.filter(c => ['RESOLVED', 'CLOSED'].includes(c.status)).length;

  // 2. Dynamic Priority Breakdown
  const critical = complaints.filter(c => c.priority === 'CRITICAL').length;
  const high = complaints.filter(c => c.priority === 'HIGH' || c.priority === 'URGENT').length;
  const medium = complaints.filter(c => c.priority === 'MEDIUM' || !c.priority).length;
  const low = complaints.filter(c => c.priority === 'LOW').length;

  // 3. Dynamic Categories
  const categoryMap = {};
  complaints.forEach(c => {
    const raw = (c.categoryCode || 'GENERAL').replace(/_/g, ' ');
    const name = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
    categoryMap[name] = (categoryMap[name] || 0) + 1;
  });

  const sortedCategories = Object.entries(categoryMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full min-w-0 max-w-full">
      
      {/* ── Card 1: Complaint Insights (Action Items) ── */}
      <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4 min-w-0 max-w-full">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Complaint Workload Insights</h3>
              <p className="text-xs text-slate-500">Key indicators requiring attention and review</p>
            </div>
          </div>
          <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
            {total} {total === 1 ? 'Record' : 'Records'}
          </span>
        </div>

        <div className="space-y-3 pt-1 text-xs">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <span className="font-semibold text-slate-700">Pending Review & Action</span>
            </div>
            <span className="font-bold text-amber-600 font-mono text-sm">{pendingReview}</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-indigo-600" />
              <span className="font-semibold text-slate-700">Forwarded to Teacher Guardian</span>
            </div>
            <span className="font-bold text-indigo-600 font-mono text-sm">{forwardedToTG}</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="font-semibold text-slate-700">Escalated to HOD</span>
            </div>
            <span className="font-bold text-red-600 font-mono text-sm">{escalatedToHOD}</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="font-semibold text-slate-700">Successfully Resolved</span>
            </div>
            <span className="font-bold text-emerald-600 font-mono text-sm">{resolved}</span>
          </div>
        </div>
      </div>

      {/* ── Card 2: Priority & Category Distribution ── */}
      <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4 min-w-0 max-w-full">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Priority & Category Breakdown</h3>
              <p className="text-xs text-slate-500">Distribution by urgency and domain</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-1">
          {/* Priority Pills */}
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Priority Levels</span>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2.5 bg-red-50 rounded-xl border border-red-200">
                <span className="text-[10px] font-bold text-red-700 block uppercase">Critical</span>
                <span className="font-bold text-red-900 text-sm mt-0.5 block">{critical}</span>
              </div>
              <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200">
                <span className="text-[10px] font-bold text-amber-700 block uppercase">High</span>
                <span className="font-bold text-amber-900 text-sm mt-0.5 block">{high}</span>
              </div>
              <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-200">
                <span className="text-[10px] font-bold text-blue-700 block uppercase">Medium</span>
                <span className="font-bold text-blue-900 text-sm mt-0.5 block">{medium}</span>
              </div>
              <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-[10px] font-bold text-emerald-700 block uppercase">Low</span>
                <span className="font-bold text-emerald-900 text-sm mt-0.5 block">{low}</span>
              </div>
            </div>
          </div>

          {/* Top Categories */}
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Top Categories</span>
            <div className="space-y-1.5 text-xs">
              {sortedCategories.map(([cat, count]) => (
                <div key={cat} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-700 font-semibold">{cat}</span>
                  <span className="font-bold text-blue-600">{count} {count === 1 ? 'case' : 'cases'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
