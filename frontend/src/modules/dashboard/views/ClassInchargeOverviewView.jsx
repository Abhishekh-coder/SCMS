import React from 'react';
import { Users, FileText, CheckCircle2, Clock, AlertTriangle, Layers, ArrowUpRight } from 'lucide-react';
import StatCard from '../../../components/ui/StatCard';
import StatusBadge from '../../../components/ui/StatusBadge';

export default function ClassInchargeOverviewView({ user, complaints = [], stats, onSelectComplaint }) {
  const s = stats || {};
  const divCode = user?.divisionCode || 'IT-A';
  const deptCode = user?.departmentCode || 'IT';

  const total = complaints.length || s.total || 0;
  const openCount = complaints.filter(c => ['SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'FORWARDED'].includes(c.status)).length || s.open || s.inProgress || 0;
  const resolvedCount = complaints.filter(c => ['RESOLVED', 'CLOSED'].includes(c.status)).length || s.resolved || 0;
  const highPriorityCount = complaints.filter(c => ['HIGH', 'URGENT', 'CRITICAL'].includes(c.priority)).length;

  // Category counts
  const categoryMap = {};
  complaints.forEach(c => {
    const raw = (c.categoryCode || 'GENERAL').replace(/_/g, ' ');
    const name = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
    categoryMap[name] = (categoryMap[name] || 0) + 1;
  });

  const sortedCategories = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-7 w-full min-w-0 max-w-full overflow-x-hidden box-border">
      
      {/* ── 1. Division Header ── */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full min-w-0 max-w-full box-border">
        <div>
          <span className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200 mb-2">
            Division Overview • {divCode}
          </span>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Class Overview — Division {divCode}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Operational and grievance resolution profile for Department of {deptCode}.
          </p>
        </div>
      </div>

      {/* ── 2. Key Division Metrics ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full min-w-0 max-w-full box-border">
        <StatCard title="TOTAL COMPLAINTS" value={total} icon={FileText} color="blue" />
        <StatCard title="OPEN" value={openCount} icon={Clock} color="amber" />
        <StatCard title="RESOLVED" value={resolvedCount} icon={CheckCircle2} color="emerald" />
        <StatCard title="HIGH / CRITICAL" value={highPriorityCount} icon={AlertTriangle} color="red" />
      </div>

      {/* ── 3. Distribution & Activity Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full min-w-0 max-w-full box-border">
        
        {/* Category Distribution */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200 font-bold text-slate-900 text-sm">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>Complaint Category Distribution</span>
          </div>

          <div className="space-y-3 pt-1">
            {sortedCategories.length > 0 ? (
              sortedCategories.map(([catName, count]) => (
                <div key={catName} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>{catName}</span>
                    <span className="font-mono text-slate-900">{count} ({total ? Math.round((count / total) * 100) : 0}%)</span>
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
              <p className="text-xs text-slate-400 italic py-4 text-center">
                No complaint activity recorded in Division {divCode} yet.
              </p>
            )}
          </div>
        </div>

        {/* Recent Division Activity Ledger */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 font-bold text-slate-900 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Recent Division Activity</span>
            </div>
            <span className="text-[11px] font-semibold text-slate-500">Live Log</span>
          </div>

          <div className="divide-y divide-slate-100">
            {complaints.length > 0 ? (
              complaints.slice(0, 5).map(item => (
                <div key={item.complaintUuid || item._id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <span className="font-mono font-bold text-blue-600 block truncate">
                      {item.complaintCode || item.complaintUuid?.slice(0, 8)}
                    </span>
                    <p className="text-slate-800 font-medium truncate mt-0.5 max-w-xs">{item.title}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={item.status} />
                    <button
                      type="button"
                      onClick={() => onSelectComplaint && onSelectComplaint(item)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition cursor-pointer"
                      title="View Details"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 italic py-6 text-center">
                No activity logs available yet.
              </p>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
