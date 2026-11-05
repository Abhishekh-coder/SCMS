import React from 'react';
import StatCard from '../../../components/ui/StatCard';
import ComplaintTable from '../../complaints/ComplaintTable';
import { PlusCircle, CheckCircle2, AlertCircle, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

export default function StudentDashboardView({ 
  user, 
  stats, 
  complaints = [], 
  loading, 
  onOpenRegister, 
  onSelectComplaint,
  onNavigateToMyComplaints
}) {
  const inProgress = Number(stats?.inProgress ?? stats?.pending ?? 0);
  const resolved = Number(stats?.resolved ?? 0);
  const escalated = Number(stats?.escalated ?? 0);

  // Recent complaints (latest 4 entries)
  const recentComplaints = (complaints || []).slice(0, 4);

  return (
    <div className="space-y-8 w-full min-w-0 max-w-full overflow-x-hidden">
      
      {/* ── 1. Welcome Hero Banner ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 sm:p-8 rounded-3xl shadow-sm w-full min-w-0 max-w-full">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold text-blue-100 uppercase tracking-widest bg-blue-500/40 px-2.5 py-0.5 rounded-full border border-blue-400/40">
              My Campus Dashboard
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">
            Welcome, {user?.fullName || 'Student'}
          </h2>
          <p className="text-blue-100 text-xs sm:text-sm leading-relaxed max-w-xl">
            Track your grievance status in real time, monitor SLA deadlines, and communicate directly with assigned faculty handlers.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenRegister}
          className="py-3 px-5 rounded-2xl bg-white text-blue-600 hover:bg-blue-50 font-bold text-xs sm:text-sm shadow-xs transition flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4 text-blue-600" />
          <span>Report New Issue</span>
        </button>
      </div>

      {/* ── 2. Metrics Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full min-w-0 max-w-full">
        <StatCard title="In Progress" value={inProgress} icon={Sparkles} color="amber" subtitle="Active investigations" />
        <StatCard title="Resolved" value={resolved} icon={CheckCircle2} color="emerald" subtitle="Completed grievances" />
        <StatCard title="Under Escalation" value={escalated} icon={AlertCircle} color="red" subtitle="Reconsideration cases" />
      </div>

      {/* ── 3. Recent Complaints Section ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 w-full min-w-0 max-w-full">
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent Complaints</h3>
            <p className="text-xs text-slate-500">Your most recently submitted campus grievances</p>
          </div>

          {onNavigateToMyComplaints && (
            <button
              type="button"
              onClick={onNavigateToMyComplaints}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition cursor-pointer hover:underline"
            >
              <span>View All Complaints</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <ComplaintTable 
          complaints={recentComplaints} 
          onSelectComplaint={onSelectComplaint} 
          loading={loading} 
        />

        {complaints.length > 4 && onNavigateToMyComplaints && (
          <div className="pt-2 text-center border-t border-slate-200">
            <button
              type="button"
              onClick={onNavigateToMyComplaints}
              className="text-xs font-bold text-slate-600 hover:text-blue-600 inline-flex items-center gap-1 transition cursor-pointer py-1.5 px-4 rounded-xl hover:bg-slate-100"
            >
              <span>Showing 4 of {complaints.length} records. Click here to view complete history.</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
