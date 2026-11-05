import React from 'react';
import ComplaintTable from '../../complaints/ComplaintTable';
import { ArrowRight, Inbox } from 'lucide-react';

export default function ClassInchargeForwardedView({ user, complaints = [], loading, onSelectComplaint }) {
  const divCode = user?.divisionCode || 'IT-A';

  // Filter complaints that have been forwarded to TG
  const forwardedComplaints = complaints.filter(c => c.status === 'FORWARDED');

  return (
    <div className="space-y-6 w-full min-w-0 max-w-full overflow-x-hidden box-border">
      
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
              Division {divCode}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Forwarded Complaints</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Complaints forwarded from your division queue to the Teacher Guardian for senior faculty intervention.
          </p>
        </div>

        <span className="text-xs font-bold px-3.5 py-1.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 self-start sm:self-auto">
          {forwardedComplaints.length} {forwardedComplaints.length === 1 ? 'Forwarded Record' : 'Forwarded Records'}
        </span>
      </div>

      {/* ── Complaints Table / Zero State ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs w-full min-w-0 max-w-full overflow-x-hidden box-border">
        {forwardedComplaints.length === 0 && !loading ? (
          <div className="py-12 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto border border-indigo-200">
              <Inbox className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">No Forwarded Complaints</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No grievances have been forwarded to the Teacher Guardian from Division {divCode} yet.
            </p>
          </div>
        ) : (
          <ComplaintTable 
            complaints={forwardedComplaints} 
            onSelectComplaint={onSelectComplaint} 
            loading={loading} 
          />
        )}
      </div>

    </div>
  );
}
