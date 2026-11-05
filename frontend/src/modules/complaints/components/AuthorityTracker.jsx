import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  User, 
  AlertTriangle, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle, 
  XCircle, 
  RotateCcw,
  Sparkles
} from 'lucide-react';

export default function AuthorityTracker({ complaint, ledger = [] }) {
  if (!complaint) return null;

  const isOperational = complaint.departmentCode === 'CAMPUS_SERVICES' || complaint.domainType === 'OPERATIONAL';

  // 1. Establish the Authority Stages Ladder
  const stages = isOperational ? [
    { key: 'STUDENT', label: 'Student', role: 'STUDENT', desc: 'Submission' },
    { key: 'CAMPUS_SERVICES_HEAD', label: 'Campus Services Head', role: 'CAMPUS_SERVICES_HEAD', desc: 'Operational Triage & Repair' },
    { key: 'DEAN', label: 'Dean / Administrator', role: 'DEAN', desc: 'Campus Facility Oversight' },
    { key: 'PRINCIPAL', label: 'Principal', role: 'PRINCIPAL', desc: 'Apex Governance' }
  ] : [
    { key: 'STUDENT', label: 'Student', role: 'STUDENT', desc: 'Complaint Registration' },
    { key: 'CLASS_INCHARGE', label: 'Class In-charge', role: 'CLASS_INCHARGE', desc: 'Division Review' },
    { key: 'TEACHER_GUARDIAN', label: 'Teacher Guide', role: 'TEACHER_GUARDIAN', desc: 'Mentorship & Triage' },
    { key: 'HOD', label: 'Head of Department', role: 'HOD', desc: 'Department Escalation' },
    { key: 'DEAN', label: 'Dean', role: 'DEAN', desc: 'Institutional Academic Oversight' },
    { key: 'PRINCIPAL', label: 'Principal', role: 'PRINCIPAL', desc: 'Apex Governance' }
  ];

  const currentRole = String(complaint.assignedToRole || complaint.currentAssignment?.handlerRole || 'CLASS_INCHARGE').toUpperCase().trim();
  const currentStatus = String(complaint.status || 'SUBMITTED').toUpperCase().trim();
  const isTerminal = ['CLOSED'].includes(currentStatus);
  const isResolved = currentStatus === 'RESOLVED';
  const isRejected = currentStatus === 'REJECTED';
  const isReturned = currentStatus === 'RETURNED_FOR_CORRECTION';

  // Find index of current handler in stages
  let activeStageIndex = stages.findIndex(s => s.role === currentRole);
  if (activeStageIndex === -1) {
    if (currentRole.includes('TEACHER')) activeStageIndex = stages.findIndex(s => s.key === 'TEACHER_GUARDIAN');
    else if (currentRole.includes('INCHARGE') || currentRole.includes('FACULTY')) activeStageIndex = stages.findIndex(s => s.key === 'CLASS_INCHARGE');
    else activeStageIndex = 1;
  }

  // Helper: Find matching event from ledger for a stage
  const findStageEvent = (stageKey, stageRole) => {
    if (stageKey === 'STUDENT') {
      return ledger.find(e => e.eventType === 'COMPLAINT_SUBMITTED') || {
        actorName: complaint.createdByName || 'Student',
        timestamp: complaint.createdAt,
        note: 'Complaint registered by student'
      };
    }

    // Check assignment history for matching handler
    const historyEntry = (complaint.assignmentHistory || []).find(h => 
      h.handlerRole === stageRole || (stageKey === 'CLASS_INCHARGE' && h.handlerRole === 'FACULTY')
    );

    // Check ledger events for actions by this role
    const eventEntry = ledger.slice().reverse().find(e => {
      const actorRole = e.metadata?.changedByRole || e.metadata?.actorRole;
      if (actorRole === stageRole) return true;
      if (stageRole === 'CLASS_INCHARGE' && (e.eventType === 'COMPLAINT_FORWARDED' || e.eventType === 'COMPLAINT_ASSIGNED')) return true;
      if (stageRole === 'TEACHER_GUARDIAN' && e.eventType === 'COMPLAINT_FORWARDED') return true;
      if (stageRole === 'HOD' && e.previousState === 'FORWARDED') return true;
      if (stageRole === 'PRINCIPAL' && (e.eventType === 'PRINCIPAL_APPROVED' || e.newState === 'RESOLVED')) return true;
      return false;
    });

    return {
      actorName: historyEntry?.handlerName || eventEntry?.actorName || null,
      timestamp: historyEntry?.assignedAt || eventEntry?.timestamp || null,
      note: historyEntry?.reason || eventEntry?.note || null
    };
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) + ', ' +
             d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
      return String(dateStr);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold text-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Authority Chain & Governance Ladder
            </h3>
            <p className="text-[11px] text-slate-500">
              Live administrative review trail: Student → CI → TG → HOD → Dean → Principal
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          {isRejected ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 text-[11px] font-bold">
              <XCircle className="w-3.5 h-3.5" /> REJECTED
            </span>
          ) : isReturned ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold">
              <RotateCcw className="w-3.5 h-3.5" /> RETURNED FOR CORRECTION
            </span>
          ) : isResolved || isTerminal ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" /> {isTerminal ? 'CLOSED' : 'RESOLVED'}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold">
              <Clock className="w-3.5 h-3.5 animate-pulse" /> IN REVIEW
            </span>
          )}
        </div>
      </div>

      {/* Rejection / Return Alert Banner if active */}
      {isRejected && complaint.rejectionDetails?.reason && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-red-800">
            <XCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>Complaint Rejected by {complaint.rejectionDetails.rejectedByName || complaint.rejectionDetails.rejectedByRole || 'Authority'}</span>
          </div>
          <p className="text-red-700 pl-5 text-[11px] leading-relaxed">
            "{complaint.rejectionDetails.reason}"
          </p>
        </div>
      )}

      {isReturned && complaint.correctionDetails?.instructions && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-amber-800">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Returned to Student for Correction by {complaint.correctionDetails.returnedByName || complaint.correctionDetails.returnedByRole || 'Authority'}</span>
          </div>
          <p className="text-amber-800 pl-5 text-[11px] leading-relaxed">
            "{complaint.correctionDetails.instructions}"
          </p>
        </div>
      )}

      {/* Stages Progression Tracker */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {stages.map((stage, idx) => {
          let stageStatus = 'UPCOMING'; // UPCOMING | CURRENT | COMPLETED | REJECTED | RETURNED
          let stageInfo = findStageEvent(stage.key, stage.role);

          if (stage.key === 'STUDENT') {
            stageStatus = 'COMPLETED';
          } else if (idx < activeStageIndex) {
            stageStatus = 'COMPLETED';
          } else if (idx === activeStageIndex) {
            if (isRejected) stageStatus = 'REJECTED';
            else if (isReturned) stageStatus = 'RETURNED';
            else if (isResolved || isTerminal) stageStatus = 'COMPLETED';
            else stageStatus = 'CURRENT';
          } else {
            stageStatus = 'UPCOMING';
          }

          return (
            <div
              key={stage.key}
              className={`relative p-3.5 rounded-xl border transition-all text-xs flex flex-col justify-between ${
                stageStatus === 'CURRENT'
                  ? 'bg-blue-50/70 border-blue-400 shadow-xs ring-2 ring-blue-500/10'
                  : stageStatus === 'COMPLETED'
                  ? 'bg-emerald-50/50 border-emerald-200'
                  : stageStatus === 'REJECTED'
                  ? 'bg-red-50/60 border-red-300 ring-2 ring-red-500/10'
                  : stageStatus === 'RETURNED'
                  ? 'bg-amber-50/60 border-amber-300 ring-2 ring-amber-500/10'
                  : 'bg-slate-50 border-slate-200 opacity-70'
              }`}
            >
              <div>
                {/* Stage Header */}
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono font-bold text-slate-400">
                    0{idx + 1}
                  </span>
                  <div>
                    {stageStatus === 'COMPLETED' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/70 border border-emerald-300 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Completed
                      </span>
                    )}
                    {stageStatus === 'CURRENT' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-100 border border-blue-300 px-2 py-0.5 rounded-full animate-pulse">
                        <Clock className="w-3 h-3 text-blue-600" /> Under Review
                      </span>
                    )}
                    {stageStatus === 'REJECTED' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-100 border border-red-300 px-2 py-0.5 rounded-full">
                        <XCircle className="w-3 h-3 text-red-600" /> Rejected Here
                      </span>
                    )}
                    {stageStatus === 'RETURNED' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                        <RotateCcw className="w-3 h-3 text-amber-600" /> Returned
                      </span>
                    )}
                    {stageStatus === 'UPCOMING' && (
                      <span className="text-[10px] font-semibold text-slate-400">Upcoming</span>
                    )}
                  </div>
                </div>

                {/* Stage Titles */}
                <h4 className="font-bold text-slate-900 text-xs">
                  {stage.label}
                </h4>
                <p className="text-[11px] text-slate-500 mb-2">
                  {stage.desc}
                </p>
              </div>

              {/* Stage Actor & Metadata */}
              {(stageStatus === 'COMPLETED' || stageStatus === 'CURRENT' || stageStatus === 'REJECTED' || stageStatus === 'RETURNED') && (
                <div className="pt-2 border-t border-slate-200/80 text-[11px] space-y-1">
                  {stage.key === 'STUDENT' ? (
                    <div>
                      <span className="text-slate-500">Submitted by: </span>
                      <strong className="text-slate-800">{complaint.createdByName || 'Student'}</strong>
                      {complaint.createdAt && (
                        <span className="block text-[10px] font-mono text-slate-400 mt-0.5">
                          {formatDate(complaint.createdAt)}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div>
                      {stageStatus === 'CURRENT' ? (
                        <div>
                          <span className="text-slate-500">Current Handler: </span>
                          <strong className="text-blue-700">{complaint.assignedToName || 'Designated Office'}</strong>
                          {complaint.currentAssignment?.assignedAt && (
                            <span className="block text-[10px] font-mono text-slate-400 mt-0.5">
                              Assigned: {formatDate(complaint.currentAssignment.assignedAt)}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div>
                          {stageInfo.actorName && (
                            <p className="text-slate-700 truncate">
                              Actioned by: <strong>{stageInfo.actorName}</strong>
                            </p>
                          )}
                          {stageInfo.timestamp && (
                            <span className="block text-[10px] font-mono text-slate-400">
                              {formatDate(stageInfo.timestamp)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
