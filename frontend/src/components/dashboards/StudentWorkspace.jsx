import React, { useState, useEffect } from 'react';
import {
  Plus,
  Clock,
  CheckCircle2,
  Inbox,
  AlertCircle,
  FileText,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  GraduationCap,
} from 'lucide-react';
import { useAuthStore } from '../../app/store/authStore';
import apiClient from '../../core/api/apiClient';
import NewComplaintModal from '../modals/NewComplaintModal';
import PageHeader from '../ui/PageHeader';
import { StatusBadge } from '../ui/StatusBadge';
import TicketCard from '../ui/TicketCard';
import { LoadingState, ErrorState, EmptyPanel } from '../ui/StatePanel';

export default function StudentWorkspace({ openComplaintModal = false, onComplaintModalOpened }) {
  const { user } = useAuthStore();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Escalation Feedback State
  const [escalatingId, setEscalatingId] = useState(null);
  const [escalationRemarks, setEscalationRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [actionErrorTicketId, setActionErrorTicketId] = useState(null);

  // Sidebar "Register Complaint" nav can request the modal from outside
  useEffect(() => {
    if (openComplaintModal) {
      setIsModalOpen(true);
      if (onComplaintModalOpened) onComplaintModalOpened();
    }
  }, [openComplaintModal, onComplaintModalOpened]);

  const fetchMyComplaints = React.useCallback(async () => {
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
      console.error('Failed to fetch student complaints:', err);
      setError(err.message || 'Failed to load complaints.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCloseModal = React.useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleComplaintCreated = React.useCallback(() => {
    fetchMyComplaints();
  }, [fetchMyComplaints]);

  useEffect(() => {
    fetchMyComplaints();
  }, [fetchMyComplaints]);

  const handleCloseTicket = async (complaintUuid) => {
    setActionError(null);
    setActionErrorTicketId(null);
    try {
      setActionLoading(true);
      await apiClient.post(`/complaints/${complaintUuid}/actions`, {
        action: 'ACTION_CLOSE',
        note: 'Student marked resolution as satisfied and closed the ticket.'
      });
      setActionLoading(false);
      fetchMyComplaints();
    } catch (err) {
      setActionLoading(false);
      setActionError(err.message || 'Failed to close ticket.');
      setActionErrorTicketId(complaintUuid);
    }
  };

  const handleEscalateTicket = async (complaintUuid) => {
    setActionError(null);
    setActionErrorTicketId(null);
    if (!escalationRemarks.trim()) {
      setActionError('Please provide a reason why you are not satisfied before escalating.');
      setActionErrorTicketId(complaintUuid);
      return;
    }
    try {
      setActionLoading(true);
      await apiClient.post(`/complaints/${complaintUuid}/actions`, {
        action: 'ACTION_ESCALATE',
        note: escalationRemarks.trim()
      });
      setActionLoading(false);
      setEscalatingId(null);
      setEscalationRemarks('');
      fetchMyComplaints();
    } catch (err) {
      setActionLoading(false);
      setActionError(err.message || 'Failed to escalate ticket.');
      setActionErrorTicketId(complaintUuid);
    }
  };

  return (
    <div className="space-y-8 pb-12">

      {/* Student Greeting & Register CTA Header */}
      <PageHeader
        tone="indigo"
        chip="Student Workspace"
        icon={GraduationCap}
        meta={`ID: ${user?.loginId || 'STUDENT'}`}
        title={`Welcome, ${user?.fullName || 'Student'}`}
        subtitle="Track your campus complaints in real-time."
        actions={
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-gradient group px-6 py-3.5 text-sm font-extrabold flex items-center justify-center gap-2 shadow-2xl shadow-blue-500/30 hover:scale-[1.03] active:scale-[0.98] transition-all cursor-pointer"
          >
            <Plus className="w-5 h-5 transition-transform duration-200 group-hover:rotate-90" />
            <span>Register New Complaint</span>
          </button>
        }
      />

      {/* ─── STATE 1: LOADING ─── */}
      {loading && (
        <LoadingState tone="indigo" message="Loading your registered complaints from database…" />
      )}

      {/* ─── STATE 2: ERROR ─── */}
      {!loading && error && <ErrorState message={error} onRetry={fetchMyComplaints} />}

      {/* ─── STATE 3: EMPTY STATE (NO COMPLAINTS YET) ─── */}
      {!loading && !error && complaints.length === 0 && (
        <EmptyPanel
          tone="indigo"
          icon={Inbox}
          title="No complaints yet"
          description="Have an issue with infrastructure, academics, hostel, or library access? Register a case for tracked resolution."
          action={
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn-gradient px-6 py-2.5 text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Register Complaint</span>
            </button>
          }
        />
      )}

      {/* ─── STATE 4: REAL DATABASE COMPLAINTS LIST ─── */}
      {!loading && !error && complaints.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-500" />
            <span>My Registered Complaints</span>
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 text-[10px] font-bold">
              {complaints.length}
            </span>
          </h2>

          <div className="space-y-4">
            {complaints.map((item, index) => (
              <TicketCard
                key={item.complaintUuid || item._id}
                index={index}
                tone="indigo"
                code={item.complaintCode}
                badge={<StatusBadge status={item.status} />}
                meta={`Category: ${item.categoryCode}`}
                student={
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Created: {new Date(item.createdAt || Date.now()).toLocaleDateString()}
                  </span>
                }
                title={item.title}
                description={item.description}
              >
                {/* Assigned Handler Info */}
                {item.assignedToName && (
                  <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-2">
                    <span className="font-semibold text-slate-600">Assigned Handler:</span>
                    <span className="text-blue-600">{item.assignedToName}</span>
                  </div>
                )}

                {/* ─── STUDENT ACTION BOUNDARY: RESOLUTION FEEDBACK ─── */}
                {item.status === 'RESOLVED' && (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-3">
                    <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Resolution Submitted by Handler</span>
                    </div>

                    <p className="text-xs text-slate-300">
                      Please review the resolution provided. Are you satisfied with the outcome?
                    </p>

                    {escalatingId === item.complaintUuid ? (
                      <div className="space-y-3 pt-2">
                        <textarea
                          rows={3}
                          value={escalationRemarks}
                          onChange={e => { setEscalationRemarks(e.target.value); setActionError(null); setActionErrorTicketId(null); }}
                          placeholder="Describe why you are not satisfied with this resolution..."
                          className="w-full p-3 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:outline-none"
                        />
                        {actionError && actionErrorTicketId === item.complaintUuid && (
                          <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>{actionError}</span>
                          </div>
                        )}
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => { setEscalatingId(null); setActionError(null); setActionErrorTicketId(null); }}
                            disabled={actionLoading}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleEscalateTicket(item.complaintUuid)}
                            disabled={actionLoading}
                            className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-[0.97] transition-all"
                          >
                            {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                            <span>Confirm Escalation to Next Level</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-3 pt-1">
                        {actionError && actionErrorTicketId === item.complaintUuid && (
                          <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs w-full">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>{actionError}</span>
                          </div>
                        )}
                        <button
                          onClick={() => handleCloseTicket(item.complaintUuid)}
                          disabled={actionLoading}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-[0.97] shadow-lg shadow-emerald-500/20 transition-all"
                        >
                          <ThumbsUp className="w-4 h-4" />
                          <span>Satisfied (Close Ticket)</span>
                        </button>

                        <button
                          onClick={() => {
                            setEscalatingId(item.complaintUuid);
                            setEscalationRemarks('');
                            setActionError(null);
                            setActionErrorTicketId(null);
                          }}
                          disabled={actionLoading}
                          className="px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-[0.97] transition-all"
                        >
                          <ThumbsDown className="w-4 h-4" />
                          <span>Not Satisfied (Escalate)</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </TicketCard>
            ))}
          </div>
        </div>
      )}

      {/* New Complaint Modal */}
      <NewComplaintModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onComplaintCreated={handleComplaintCreated}
      />

    </div>
  );
}
