import React, { useState, useEffect } from 'react';
import {
  Inbox,
  CheckCircle2,
  Send,
  AlertCircle,
  Loader2,
  User,
  GraduationCap,
} from 'lucide-react';
import { useAuthStore } from '../../app/store/authStore';
import apiClient from '../../core/api/apiClient';
import PageHeader from '../ui/PageHeader';
import { StatusBadge, PriorityBadge } from '../ui/StatusBadge';
import TicketCard from '../ui/TicketCard';
import { LoadingState, ErrorState, EmptyPanel } from '../ui/StatePanel';

export default function FacultyDashboard() {
  const { user } = useAuthStore();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Active Resolution Input State
  const [activeTicketId, setActiveTicketId] = useState(null);
  const [resolutionText, setResolutionText] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);

  const fetchAssignedComplaints = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get('/complaints');
      if (res.success && Array.isArray(res.data)) {
        setComplaints(res.data);
      } else {
        setComplaints([]);
      }
    } catch (err) {
      console.error('Failed to fetch assigned complaints:', err);
      setError(err.message || 'Failed to load assigned complaints.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignedComplaints();
  }, []);

  const handleSubmitResolution = async (complaintUuid) => {
    setActionError(null);
    if (!resolutionText.trim()) {
      setActionError('Please type a resolution response for the student before submitting.');
      return;
    }
    try {
      setActionLoading(true);
      await apiClient.post(`/complaints/${complaintUuid}/actions`, {
        action: 'ACTION_RESOLVE',
        note: resolutionText.trim()
      });
      setActionLoading(false);
      setActiveTicketId(null);
      setResolutionText('');
      fetchAssignedComplaints();
    } catch (err) {
      setActionLoading(false);
      setActionError(err.message || 'Failed to submit resolution.');
    }
  };

  return (
    <div className="space-y-8 pb-12">

      {/* Header */}
      <PageHeader
        tone="indigo"
        chip="Handler Workspace"
        icon={GraduationCap}
        meta={`Code: ${user?.loginId}`}
        title={`Welcome, ${user?.fullName || 'Faculty Handler'}`}
        subtitle="Review and resolve complaints assigned to your department scope."
      />

      {/* ─── STATE 1: LOADING ─── */}
      {loading && (
        <LoadingState tone="indigo" message="Loading assigned complaints from database…" />
      )}

      {/* ─── STATE 2: ERROR ─── */}
      {!loading && error && <ErrorState message={error} onRetry={fetchAssignedComplaints} />}

      {/* ─── STATE 3: NO ASSIGNED COMPLAINTS ─── */}
      {!loading && !error && complaints.length === 0 && (
        <EmptyPanel
          tone="indigo"
          icon={Inbox}
          title="No assigned complaints"
          description="All complaints assigned to your operational scope have been processed."
        />
      )}

      {/* ─── STATE 4: REAL DATABASE ASSIGNED COMPLAINTS LIST ─── */}
      {!loading && !error && complaints.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Inbox className="w-4 h-4 text-blue-500" />
            <span>Assigned Complaints Queue</span>
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 text-[10px] font-bold">
              {complaints.length}
            </span>
          </h2>

          <div className="grid grid-cols-1 gap-4">
            {complaints.map((item, index) => (
              <TicketCard
                key={item.complaintUuid || item._id}
                index={index}
                tone="indigo"
                code={item.complaintCode}
                badge={
                  <>
                    <PriorityBadge priority={item.priority} />
                    <StatusBadge status={item.status} />
                  </>
                }
                student={
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-500" />
                    Student: {item.createdByName || 'Student User'}
                  </span>
                }
                title={item.title}
                description={item.description}
              >
                {/* Historical Carryover / Previous Remarks */}
                {item.status === 'ESCALATED' && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-700 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      <span>Escalated Case Notice</span>
                    </div>
                    <p className="text-slate-600">
                      This complaint was escalated to your level after student feedback or SLA window expiry.
                    </p>
                  </div>
                )}

                {/* Handler Resolution Action Section */}
                {item.status !== 'CLOSED' && item.status !== 'RESOLVED' && (
                  <div className="pt-2 border-t border-slate-100">
                    {activeTicketId === item.complaintUuid ? (
                      <div className="space-y-3 p-4 rounded-xl bg-slate-50 border border-blue-200">
                        <label className="block text-xs font-bold text-blue-700 uppercase tracking-wider">
                          Type Resolution Response for Student
                        </label>
                        <textarea
                          rows={3}
                          value={resolutionText}
                          onChange={e => { setResolutionText(e.target.value); setActionError(null); }}
                          placeholder="Provide resolution details, action taken, or instructions for the student..."
                          className="w-full p-3 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
                        />
                        {actionError && (
                          <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>{actionError}</span>
                          </div>
                        )}
                        <div className="flex gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => setActiveTicketId(null)}
                            disabled={actionLoading}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSubmitResolution(item.complaintUuid)}
                            disabled={actionLoading}
                            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-[0.97] shadow-lg shadow-blue-500/20 transition-all"
                          >
                            {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                            <span>Submit Resolution</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setActiveTicketId(item.complaintUuid);
                          setResolutionText('');
                          setActionError(null);
                        }}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 cursor-pointer active:scale-[0.97] shadow-md shadow-blue-500/20 transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Resolve Ticket</span>
                      </button>
                    )}
                  </div>
                )}
              </TicketCard>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
