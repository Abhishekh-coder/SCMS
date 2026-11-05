import React, { useEffect, useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Clock, 
  User, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  LayoutGrid, 
  Settings, 
  Flag,
  MapPin,
  CheckCheck,
  RotateCcw
} from 'lucide-react';
import ComplaintActions from './ComplaintActions';
import AuthorityTracker from './components/AuthorityTracker';
import TechnicianRepairCard from './components/TechnicianRepairCard';
import PolicyApprovalCard from './components/PolicyApprovalCard';
import apiClient from '../../core/api/apiClient';

// Standard 6-stage lifecycle
const LIFECYCLE_STAGES = [
  { key: 'SUBMITTED', label: '1. Submitted' },
  { key: 'CATEGORIZED', label: '2. Under Review' },
  { key: 'ASSIGNED', label: '3. Assigned' },
  { key: 'IN_PROGRESS', label: '4. In Progress' },
  { key: 'RESOLVED', label: '5. Resolved' },
  { key: 'CLOSED', label: '6. Closed' },
];

export default function ComplaintDetailsModal({ complaint, role, user, onClose, onRefresh }) {
  const [activeComplaint, setActiveComplaint] = useState(complaint);
  const [ledger, setLedger] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (complaint?.complaintUuid) {
      setActiveComplaint(complaint);
      fetchDetails();
    }
  }, [complaint?.complaintUuid]);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/complaints/${complaint.complaintUuid}`);
      if (res && res.data) {
        if (res.data.complaint) setActiveComplaint(res.data.complaint);
        if (res.data.eventLedger) setLedger(res.data.eventLedger);
        if (res.data.comments) setComments(res.data.comments);
      }
    } catch (err) {
      console.error('Failed to fetch detailed complaint history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteAction = async (complaintUuid, actionVerb, note) => {
    try {
      await apiClient.post(`/complaints/${complaintUuid}/actions`, { 
        action: actionVerb,
        actionVerb, 
        note,
        version: activeComplaint?.version 
      });
      await fetchDetails();
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.message || 'Failed to execute workflow action.');
    }
  };

  const handleAddComment = async (complaintUuid, message) => {
    try {
      await apiClient.post(`/complaints/${complaintUuid}/comments`, { message, commentType: 'INTERNAL' });
      await fetchDetails();
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.message || 'Failed to add comment.');
    }
  };

  const handleOverridePriority = async (complaintUuid, priority, reason) => {
    try {
      await apiClient.post(`/complaints/${complaintUuid}/priority`, { priority, reason });
      await fetchDetails();
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.message || 'Failed to override priority.');
    }
  };

  const handleCopyCode = () => {
    const code = complaint.complaintCode || complaint.complaintUuid || '';
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const cleanUIString = (str) => {
    if (!str) return '';
    return String(str)
      .replace(/\s*\([A-Z0-9_\- ]+\)/gi, '')
      .replace(/_/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  if (!complaint) return null;

  const displayCode = (activeComplaint?.complaintCode || complaint.complaintCode || complaint.complaintUuid || '');
  const currentStatus = String(activeComplaint?.status || complaint?.status || 'SUBMITTED').toUpperCase();

  // Determine active step index in lifecycle
  const getStageIndex = (st) => {
    if (st === 'CLOSED') return 5;
    if (st === 'RESOLVED') return 4;
    if (st === 'IN_PROGRESS' || st === 'ESCALATED') return 3;
    if (st === 'ASSIGNED' || st === 'FORWARDED') return 2;
    if (st === 'CATEGORIZED') return 1;
    return 0; // SUBMITTED
  };

  const activeStageIndex = getStageIndex(currentStatus);

  const getEventIcon = (eventType) => {
    const ev = String(eventType || '').toUpperCase();
    if (ev.includes('SUBMITTED')) return <Clock className="w-3.5 h-3.5 text-blue-600" />;
    if (ev.includes('ASSIGNED')) return <User className="w-3.5 h-3.5 text-blue-600" />;
    if (ev.includes('FORWARDED')) return <ArrowRight className="w-3.5 h-3.5 text-indigo-600" />;
    if (ev.includes('ESCALATED')) return <AlertTriangle className="w-3.5 h-3.5 text-red-600" />;
    if (ev.includes('RESOLVED') || ev.includes('CLOSED')) return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
    return <Clock className="w-3.5 h-3.5 text-slate-400" />;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }).toUpperCase() + ' ' + d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).toUpperCase();
    } catch {
      return String(dateStr);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div 
        className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200 my-auto max-h-[92vh] flex flex-col overflow-hidden text-slate-800"
        role="dialog"
        aria-modal="true"
      >
        
        {/* ── Top Header Bar ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white shrink-0 z-10">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">
              CASE RECORD
            </span>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-50 border border-slate-200 font-mono text-xs font-bold text-blue-600">
              <span>{displayCode}</span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="hover:text-blue-800 transition cursor-pointer"
                title="Copy Code"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
            {copied && <span className="text-[10px] text-emerald-600 font-bold">Copied!</span>}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition cursor-pointer shrink-0"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Modal Body Content ── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Title & Status */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-tight">
              {activeComplaint.title || activeComplaint.subject || 'UNTITLED COMPLAINT'}
            </h2>
            <div className="shrink-0 flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                currentStatus.includes('RESOLVED') || currentStatus.includes('CLOSED')
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : currentStatus.includes('ESCALATED')
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}>
                {currentStatus.replace(/_/g, ' ')}
              </span>
            </div>
          </div>

          {/* ── Lifecycle Progress Step Ribbon ── */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Resolution Lifecycle Progress
              </span>
              {currentStatus === 'ESCALATED' && (
                <span className="text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Escalated for Supervisor Review</span>
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-1">
              {LIFECYCLE_STAGES.map((stage, idx) => {
                const isPassed = activeStageIndex >= idx;
                const isCurrent = activeStageIndex === idx;

                return (
                  <div 
                    key={stage.key}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      isCurrent
                        ? 'bg-blue-50 border-blue-400 shadow-xs'
                        : isPassed
                        ? 'bg-blue-50/40 border-blue-200'
                        : 'bg-white border-slate-200 opacity-60'
                    }`}
                  >
                    <span className={`text-[11px] font-bold block ${
                      isCurrent ? 'text-blue-700' : isPassed ? 'text-blue-800' : 'text-slate-400'
                    }`}>
                      {stage.label}
                    </span>
                    <span className={`text-[10px] block mt-0.5 ${
                      isCurrent ? 'text-blue-600 font-semibold' : isPassed ? 'text-slate-500' : 'text-slate-400'
                    }`}>
                      {isCurrent ? 'Current Stage' : isPassed ? 'Completed' : 'Pending'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Authority Progress Tracker (Dual-Track Governance Ladder) ── */}
          <AuthorityTracker complaint={activeComplaint} ledger={ledger} />

          {/* ── Policy Governance Card (If principal policy approval required) ── */}
          <PolicyApprovalCard complaint={activeComplaint} role={role} user={user} onRefresh={fetchDetails} />

          {/* ── Two-Column Layout ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column (Details, Technician Card, Actions) */}
            <div className="lg:col-span-8 space-y-5">
              
              {/* Metadata Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="p-2 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Category</span>
                  <span className="text-xs font-bold text-slate-800 block truncate uppercase">{activeComplaint.categoryCode || 'GENERAL'}</span>
                </div>
                <div className="p-2 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Department</span>
                  <span className="text-xs font-bold text-slate-800 block truncate uppercase">{activeComplaint.departmentCode || 'IT'}</span>
                </div>
                <div className="p-2 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Priority</span>
                  <span className="text-xs font-bold text-amber-600 block truncate uppercase">{activeComplaint.priority || 'MEDIUM'}</span>
                </div>
                <div className="p-2 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Submitted By</span>
                  <span className="text-xs font-bold text-slate-800 block truncate uppercase">{activeComplaint.createdByName || 'STUDENT'}</span>
                </div>
              </div>

              {/* Description Box */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Description
                </h4>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {activeComplaint.description || 'No detailed description provided.'}
                </div>
              </div>

              {/* Technician Repair Card */}
              <TechnicianRepairCard
                complaint={activeComplaint}
                role={role}
                user={user}
                onRefresh={fetchDetails}
              />

              {/* Action Panel */}
              <div>
                <ComplaintActions
                  complaint={activeComplaint}
                  role={role}
                  user={user}
                  onExecuteAction={handleExecuteAction}
                  onAddComment={handleAddComment}
                  onOverridePriority={handleOverridePriority}
                  onCancel={onClose}
                />
              </div>
            </div>

            {/* Right Column (Timeline Ledger & Communications) */}
            <div className="lg:col-span-4 bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Audit Timeline Ledger
              </h4>

              {ledger && ledger.length > 0 ? (
                <div className="relative border-l-2 border-slate-200 ml-3 pl-4 space-y-4">
                  {ledger.map((evt, idx) => (
                    <div key={evt.ledgerUuid || idx} className="relative">
                      <div className="absolute -left-[23px] top-0.5 w-5 h-5 rounded-full bg-white border border-slate-300 flex items-center justify-center shrink-0 shadow-xs">
                        {getEventIcon(evt.eventType)}
                      </div>

                      <div className="space-y-0.5">
                        <span className="font-bold text-xs text-slate-900 uppercase block">
                          {cleanUIString(evt.eventType.replace('COMPLAINT_', ''))}
                        </span>
                        <p className="text-[11px] text-slate-500">
                          By <strong className="text-slate-700">{cleanUIString(evt.actorName || evt.actorUuid)}</strong>
                        </p>
                        {evt.note && (
                          <p className="text-[11px] text-slate-700 bg-white p-2 rounded-lg border border-slate-200 mt-1 italic shadow-xs">
                            "{evt.note}"
                          </p>
                        )}
                        <span className="text-[10px] text-slate-400 block pt-0.5">
                          {formatDate(evt.timestamp || evt.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs">
                  No historical ledger entries recorded yet.
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
