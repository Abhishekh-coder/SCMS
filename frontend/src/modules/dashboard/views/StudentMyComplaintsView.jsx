import React, { useState } from 'react';
import ComplaintTable from '../../complaints/ComplaintTable';
import { PlusCircle, FileText, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

export default function StudentMyComplaintsView({ 
  user, 
  stats, 
  complaints = [], 
  loading, 
  onOpenRegister, 
  onSelectComplaint 
}) {
  const [activeFilter, setActiveFilter] = useState('ALL');

  const inProgress = Number(stats?.inProgress ?? stats?.pending ?? 0);
  const resolved = Number(stats?.resolved ?? 0);
  const escalated = Number(stats?.escalated ?? 0);

  const filteredComplaints = complaints.filter(c => {
    const s = String(c.status || '').toUpperCase();
    if (activeFilter === 'ACTIVE') {
      return ['SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'FORWARDED'].includes(s);
    }
    if (activeFilter === 'RESOLVED') {
      return ['RESOLVED', 'CLOSED'].includes(s);
    }
    if (activeFilter === 'RECONSIDERATION') {
      return s === 'ESCALATED';
    }
    return true; // ALL
  });

  return (
    <div className="space-y-6 w-full min-w-0 max-w-full overflow-x-hidden">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">My Complaints History</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Complete records, SLA resolution countdowns, and real-time lifecycle tracking of all your submitted grievances.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenRegister}
          className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-2 shrink-0 cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Report New Issue</span>
        </button>
      </div>

      {/* Filter Tabs Bar */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 w-fit">
        <button
          type="button"
          onClick={() => setActiveFilter('ALL')}
          className={`py-1.5 px-4 rounded-lg text-xs font-bold transition cursor-pointer ${
            activeFilter === 'ALL'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          All Cases ({complaints.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter('ACTIVE')}
          className={`py-1.5 px-4 rounded-lg text-xs font-bold transition cursor-pointer ${
            activeFilter === 'ACTIVE'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Active ({inProgress})
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter('RESOLVED')}
          className={`py-1.5 px-4 rounded-lg text-xs font-bold transition cursor-pointer ${
            activeFilter === 'RESOLVED'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Resolved ({resolved})
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter('RECONSIDERATION')}
          className={`py-1.5 px-4 rounded-lg text-xs font-bold transition cursor-pointer ${
            activeFilter === 'RECONSIDERATION'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Reconsideration ({escalated})
        </button>
      </div>

      {/* Complaints Table */}
      <div className="space-y-4">
        <ComplaintTable 
          complaints={filteredComplaints} 
          onSelectComplaint={onSelectComplaint} 
          loading={loading} 
        />
      </div>

    </div>
  );
}
