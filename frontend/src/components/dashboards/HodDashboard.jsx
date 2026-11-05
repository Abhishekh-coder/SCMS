import React, { useState, useEffect } from 'react';
import { Building2, Inbox, AlertCircle, CheckCircle2, Send, User, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../app/store/authStore';
import apiClient from '../../core/api/apiClient';
import PageHeader from '../ui/PageHeader';
import { StatusBadge } from '../ui/StatusBadge';
import TicketCard from '../ui/TicketCard';
import { LoadingState, ErrorState, EmptyPanel } from '../ui/StatePanel';

export default function HodDashboard() {
  const { user } = useAuthStore();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeTicketId, setActiveTicketId] = useState(null);
  const [resolutionText, setResolutionText] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);

  const fetchDepartmentComplaints = async () => {
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
      console.error('Failed to fetch HOD complaints:', err);
      setError(err.message || 'Failed to load department complaints.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartmentComplaints();
  }, []);

  const handleSubmitResolution = async (complaintUuid) => {
    setActionError(null);
    if (!resolutionText.trim()) {
      setActionError('Please type a resolution response for the complaint before submitting.');
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
      fetchDepartmentComplaints();
    } catch (err) {
      setActionLoading(false);
      setActionError(err.message || 'Failed to submit resolution.');
    }
  };

  return (
    <div className="space-y-8 pb-12">

      {/* Header */}
      <PageHeader
        tone="purple"
        chip="HOD Workspace"
        icon={Building2}
        meta={`Head of Department: ${user?.fullName}`}
        title="Department Oversight & Escalations"
        subtitle="Monitor department complaints and provide directives for resolution."
      />

      {/* ─── STATE 1: LOADING ─── */}
      {loading && (
        <LoadingState tone="purple" message="Loading department complaints from database…" />
      )}

      {/* ─── STATE 2: ERROR ─── */}
      {!loading && error && <ErrorState message={error} onRetry={fetchDepartmentComplaints} />}

      {/* ─── STATE 3: NO COMPLAINTS YET ─── */}
      {!loading && !error && complaints.length === 0 && (
        <EmptyPanel
          tone="purple"
          icon={Inbox}
          title="No active complaints in department"
          description="All complaints in your department scope are resolved."
        />
      )}

      {/* ─── STATE 4: REAL MONGO COMPLAINTS ─── */}
      {!loading && !error && complaints.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-purple-600" />
            <span>Department Cases</span>
            <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-200 text-[10px] font-bold">
              {complaints.length}
            </span>
          </h2>

          <div className="grid grid-cols-1 gap-4">
            {complaints.map((item, index) => (
              <TicketCard
                key={item.complaintUuid || item._id}
                index={index}
                tone="purple"
                code={item.complaintCode}
                badge={<StatusBadge status={item.status} />}
                meta={`Category: ${item.categoryCode}`}
                student={
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-purple-600" />
                    Student: {item.createdByName || 'Student User'}
                  </span>
                }
                title={item.title}
                description={item.description}
              >
                {item.status !== 'CLOSED' && item.status !== 'RESOLVED' && (
                  <div className="pt-2 border-t border-slate-100">
                    {activeTicketId === item.complaintUuid ? (
                      <div className="space-y-3 p-4 rounded-xl bg-slate-50 border border-purple-200">
                        <textarea
                          rows={3}
                          value={resolutionText}
                          onChange={e => { setResolutionText(e.target.value); setActionError(null); }}
                          placeholder="Type HOD resolution remarks or directive..."
                          className="w-full p-3 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:border-purple-500 focus:outline-none"
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
                            className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-[0.97] shadow-lg shadow-purple-500/20 transition-all"
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
                        className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-2 cursor-pointer active:scale-[0.97] shadow-md shadow-purple-500/20 transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Resolve / Provide Directive</span>
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
