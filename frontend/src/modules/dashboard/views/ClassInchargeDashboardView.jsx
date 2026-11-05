import React from 'react';
import StatCard from '../../../components/ui/StatCard';
import ComplaintTable from '../../complaints/ComplaintTable';
import ComplaintInsightsPanel from '../components/ComplaintInsightsPanel';
import { FileText, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function ClassInchargeDashboardView({ user, stats, complaints = [], loading, onSelectComplaint }) {
  const s = stats || {};
  const divCode = user?.divisionCode || 'IT-A';

  const totalCount = complaints.length || s.totalReceived || s.total || 0;
  const inProgressCount = complaints.filter(c => ['SUBMITTED', 'ASSIGNED', 'IN_PROGRESS'].includes(c.status)).length || s.inProgress || 0;
  const forwardedCount = complaints.filter(c => c.status === 'FORWARDED').length || s.forwarded || 0;
  const resolvedCount = complaints.filter(c => ['RESOLVED', 'CLOSED'].includes(c.status)).length || s.resolved || 0;

  return (
    <div className="space-y-7 w-full min-w-0 max-w-full overflow-x-hidden">
      
      {/* ── 1. Header Banner ── */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full min-w-0 max-w-full">
        <div className="space-y-1">
          <span className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200 mb-1">
            Class Incharge • Division {divCode}
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Welcome, {user?.fullName || 'Faculty'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Review and manage academic and classroom complaints assigned to your division.
          </p>
        </div>
      </div>

      {/* ── 2. Top 4 Metric Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full min-w-0 max-w-full">
        <StatCard 
          title="TOTAL ASSIGNED" 
          value={totalCount} 
          icon={FileText} 
          color="blue" 
        />
        <StatCard 
          title="IN PROGRESS" 
          value={inProgressCount} 
          icon={Sparkles} 
          color="amber" 
        />
        <StatCard 
          title="FORWARDED TO TG" 
          value={forwardedCount} 
          icon={ArrowRight} 
          color="indigo" 
        />
        <StatCard 
          title="RESOLVED" 
          value={resolvedCount} 
          icon={CheckCircle2} 
          color="emerald" 
        />
      </div>

      {/* ── 3. Complaint Insights & Priority Overview ── */}
      <ComplaintInsightsPanel complaints={complaints} role="CLASS_INCHARGE" />

      {/* ── 4. Main Assigned Complaints Table ── */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4 w-full min-w-0 max-w-full overflow-x-hidden">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Assigned Complaints — Division {divCode}
              </h3>
              <p className="text-xs text-slate-500">Live complaints assigned to your division for review and action</p>
            </div>
          </div>
          <span className="text-xs font-bold px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            {complaints.length} {complaints.length === 1 ? 'Record' : 'Records'}
          </span>
        </div>
        <ComplaintTable complaints={complaints} onSelectComplaint={onSelectComplaint} loading={loading} />
      </div>

    </div>
  );
}
