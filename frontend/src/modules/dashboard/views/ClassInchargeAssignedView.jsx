import React, { useState } from 'react';
import ComplaintTable from '../../complaints/ComplaintTable';
import { FileText, Filter } from 'lucide-react';

export default function ClassInchargeAssignedView({ user, complaints = [], loading, onSelectComplaint }) {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const divCode = user?.divisionCode || 'IT-A';

  // Filter complaints specifically assigned to this CI / Division
  const filteredComplaints = complaints.filter(c => {
    const s = String(c.status || '').toUpperCase();
    if (statusFilter === 'PENDING') {
      return ['SUBMITTED', 'ASSIGNED'].includes(s);
    }
    if (statusFilter === 'IN_PROGRESS') {
      return s === 'IN_PROGRESS';
    }
    if (statusFilter === 'RESOLVED') {
      return ['RESOLVED', 'CLOSED'].includes(s);
    }
    return true; // ALL
  });

  return (
    <div className="space-y-6 w-full min-w-0 max-w-full overflow-x-hidden box-border">
      
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              Division {divCode}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Assigned Complaints</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Active grievances currently assigned to your division authority for review and resolution.
          </p>
        </div>
      </div>

      {/* ── Status Filter Pills ── */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setStatusFilter('ALL')}
          className={`py-1.5 px-4 rounded-full text-xs font-bold transition cursor-pointer ${
            statusFilter === 'ALL'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          All ({complaints.length})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('PENDING')}
          className={`py-1.5 px-4 rounded-full text-xs font-bold transition cursor-pointer ${
            statusFilter === 'PENDING'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          Pending ({complaints.filter(c => ['SUBMITTED', 'ASSIGNED'].includes(c.status)).length})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('IN_PROGRESS')}
          className={`py-1.5 px-4 rounded-full text-xs font-bold transition cursor-pointer ${
            statusFilter === 'IN_PROGRESS'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          In Progress ({complaints.filter(c => c.status === 'IN_PROGRESS').length})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('RESOLVED')}
          className={`py-1.5 px-4 rounded-full text-xs font-bold transition cursor-pointer ${
            statusFilter === 'RESOLVED'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          Resolved ({complaints.filter(c => ['RESOLVED', 'CLOSED'].includes(c.status)).length})
        </button>
      </div>

      {/* ── Complaints Table ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs w-full min-w-0 max-w-full overflow-x-hidden box-border">
        <ComplaintTable 
          complaints={filteredComplaints} 
          onSelectComplaint={onSelectComplaint} 
          loading={loading} 
        />
      </div>

    </div>
  );
}
