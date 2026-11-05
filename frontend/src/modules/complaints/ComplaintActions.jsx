import React, { useState } from 'react';
import { 
  ArrowRight, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2, 
  MessageSquare,
  RotateCcw,
  Send,
  ShieldAlert,
  X
} from 'lucide-react';

export default function ComplaintActions({ 
  complaint, 
  role, 
  user, 
  onExecuteAction, 
  onAddComment, 
  onOverridePriority, 
  onCancel 
}) {
  const [note, setNote] = useState('');
  const [commentMsg, setCommentMsg] = useState('');
  const [overridePriorityVal, setOverridePriorityVal] = useState('HIGH');
  const [overrideReason, setOverrideReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('ACTION');
  const [showAppealForm, setShowAppealForm] = useState(false);
  const [appealReason, setAppealReason] = useState('');

  const isCreatorStudent = Boolean(user?.userUuid && complaint?.createdByUserUuid === user?.userUuid);
  const isResolvedByPrincipal = Boolean(
    complaint?.assignedToRole === 'PRINCIPAL' ||
    complaint?.currentAssignment?.handlerRole === 'PRINCIPAL'
  );

  const handleStudentClose = async () => {
    if (!onExecuteAction) return;
    setLoading(true);
    try {
      await onExecuteAction(complaint.complaintUuid, 'CLOSE', 'Student accepted resolution and closed complaint.');
    } finally {
      setLoading(false);
    }
  };

  const handleStudentAppeal = async (e) => {
    e?.preventDefault();
    if (!appealReason.trim()) {
      alert('Please provide a mandatory reason explaining why you are requesting reconsideration.');
      return;
    }
    if (!onExecuteAction) return;
    setLoading(true);
    try {
      await onExecuteAction(complaint.complaintUuid, 'ESCALATE', appealReason.trim());
      setShowAppealForm(false);
      setAppealReason('');
    } finally {
      setLoading(false);
    }
  };

  if (!complaint) return null;

  // Normalize User Roles and Complaint Status
  const userRoles = [
    ...(Array.isArray(user?.roles) ? user.roles : []),
    user?.primaryRole,
    user?.role,
    user?.profileType,
    role
  ]
    .filter(Boolean)
    .map(r => String(r).toUpperCase().trim());

  const hasRole = (targetRole) => userRoles.includes(String(targetRole).toUpperCase().trim());
  const normalizedStatus = String(complaint?.status || '').toUpperCase().trim();
  const isTerminal = ['RESOLVED', 'CLOSED', 'CANCELLED'].includes(normalizedStatus);

  const isStaff = hasRole('CLASS_INCHARGE') ||
    hasRole('TEACHER_GUARDIAN') ||
    hasRole('HOD') ||
    hasRole('DEAN') ||
    hasRole('PRINCIPAL') ||
    hasRole('CAMPUS_SERVICES_HEAD') ||
    hasRole('ADMIN') ||
    hasRole('SUPER_ADMIN') ||
    hasRole('FACULTY') ||
    role === 'CLASS_INCHARGE' ||
    role === 'TEACHER_GUARDIAN' ||
    role === 'HOD' ||
    userRoles.some(r => r !== 'STUDENT');

  const isCurrentlyAssignedToUser = Boolean(
    user?.userUuid &&
    (complaint?.assignedToUserUuid === user?.userUuid || complaint?.currentAssignment?.handlerUserUuid === user?.userUuid)
  );

  const canForwardToTG = isCurrentlyAssignedToUser &&
    (hasRole('CLASS_INCHARGE') || hasRole('FACULTY') || role === 'CLASS_INCHARGE') &&
    ['ASSIGNED', 'IN_PROGRESS'].includes(normalizedStatus);

  const canEscalate = isCurrentlyAssignedToUser &&
    !hasRole('PRINCIPAL') &&
    role !== 'PRINCIPAL' &&
    (hasRole('TEACHER_GUARDIAN') || hasRole('HOD') || hasRole('DEAN') || hasRole('CAMPUS_SERVICES_HEAD') || role === 'TEACHER_GUARDIAN' || role === 'HOD' || role === 'DEAN' || role === 'CAMPUS_SERVICES_HEAD') &&
    ['FORWARDED', 'ESCALATED', 'IN_PROGRESS', 'ASSIGNED'].includes(normalizedStatus);

  const canResolve = isCurrentlyAssignedToUser && isStaff &&
    ['ASSIGNED', 'IN_PROGRESS', 'FORWARDED', 'ESCALATED'].includes(normalizedStatus);

  const handleAction = async (actionVerb) => {
    if (!onExecuteAction) return;
    if (!note.trim()) {
      alert('Please provide an action note / justification before submitting.');
      return;
    }
    setLoading(true);
    try {
      await onExecuteAction(complaint.complaintUuid, actionVerb, note.trim());
      setNote('');
    } finally {
      setLoading(false);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentMsg.trim() || !onAddComment) return;
    setLoading(true);
    try {
      await onAddComment(complaint.complaintUuid, commentMsg.trim());
      setCommentMsg('');
    } finally {
      setLoading(false);
    }
  };

  const handlePrioritySubmit = async (e) => {
    e.preventDefault();
    if (!overrideReason.trim() || !onOverridePriority) return;
    setLoading(true);
    try {
      await onOverridePriority(complaint.complaintUuid, overridePriorityVal, overrideReason.trim());
      setOverrideReason('');
    } finally {
      setLoading(false);
    }
  };

  const cleanUIString = (str) => {
    if (!str) return '';
    return String(str)
      .replace(/\s*\([A-Z0-9_\- ]+\)/gi, '')
      .replace(/_/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const getHandlerDisplayName = () => {
    if (complaint?.assignedToName) {
      const name = cleanUIString(complaint.assignedToName);
      const roleName = cleanUIString(complaint.assignedToRole);
      return roleName && roleName !== name ? `${name} (${roleName})` : name;
    }
    if (complaint?.assignedToRole) {
      return cleanUIString(complaint.assignedToRole);
    }
    return 'Class Incharge';
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
      
      {/* ── Tabs Bar (Rounded Pill Switcher) ── */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 border border-slate-200 rounded-full w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('ACTION')}
          className={`py-1.5 px-4 rounded-full text-xs font-bold transition cursor-pointer ${
            activeTab === 'ACTION'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          EXECUTE ACTION
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('COMMENT')}
          className={`py-1.5 px-4 rounded-full text-xs font-bold transition cursor-pointer ${
            activeTab === 'COMMENT'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          ADD COMMENT
        </button>

        {isStaff && (
          <button
            type="button"
            onClick={() => setActiveTab('PRIORITY')}
            className={`py-1.5 px-4 rounded-full text-xs font-bold transition cursor-pointer ${
              activeTab === 'PRIORITY'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            OVERRIDE PRIORITY
          </button>
        )}
      </div>

      {/* ── Tab 1: Execute Action ── */}
      {activeTab === 'ACTION' && (
        <div className="space-y-3.5">
          {normalizedStatus === 'CLOSED' || normalizedStatus === 'CANCELLED' ? (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 italic">
              This complaint is closed and verified. No further action is required.
            </div>
          ) : normalizedStatus === 'REJECTED' ? (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 space-y-1">
              <span className="font-bold block text-red-800">Complaint Rejected</span>
              <p className="text-xs text-red-600">
                Reason: "{complaint?.rejectionDetails?.reason || 'Invalid or duplicate complaint.'}"
              </p>
            </div>
          ) : normalizedStatus === 'RETURNED_FOR_CORRECTION' ? (
            isCreatorStudent ? (
              <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200 text-xs space-y-3 shadow-xs">
                <div className="space-y-1">
                  <h4 className="text-amber-800 font-bold text-sm">Complaint Returned for Clarification</h4>
                  <p className="text-amber-900 text-xs leading-relaxed">
                    Instructions: <strong>"{complaint?.correctionDetails?.instructions || 'Please clarify your issue'}"</strong>
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Your Clarification / Updated Details *</label>
                  <textarea
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Provide the missing details requested by the authority..."
                    className="w-full p-3 rounded-xl border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                  />
                </div>
                <button
                  type="button"
                  disabled={loading || !note.trim()}
                  onClick={() => handleAction('RESUBMIT')}
                  className="py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold transition cursor-pointer shadow-xs"
                >
                  {loading ? 'Resubmitting...' : 'Resubmit Complaint'}
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 italic">
                This complaint was returned to the student for correction. Awaiting resubmission.
              </div>
            )
          ) : normalizedStatus === 'RESOLVED' ? (
            isCreatorStudent ? (
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-4 shadow-xs">
                <div className="space-y-1.5">
                  <h4 className="text-slate-900 font-bold text-sm">
                    Resolution Provided by {cleanUIString(complaint?.resolvedByName || complaint?.assignedToName || 'Authority')}
                  </h4>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    {isResolvedByPrincipal
                      ? 'This resolution is final at the institutional level. No further reconsideration is available.'
                      : 'Your complaint has been resolved. If you are not satisfied with the resolution, you may request reconsideration by the next authority.'}
                  </p>
                </div>

                {!isResolvedByPrincipal && (
                  !showAppealForm ? (
                    <div className="pt-1 flex items-center gap-3">
                      <button
                        type="button"
                        disabled={loading}
                        onClick={handleStudentClose}
                        className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition cursor-pointer shadow-xs"
                      >
                        Accept & Close Complaint
                      </button>
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => setShowAppealForm(true)}
                        className="py-2.5 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 hover:text-slate-900 text-xs font-bold transition cursor-pointer"
                      >
                        Request Reconsideration
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleStudentAppeal} className="space-y-3 pt-3 border-t border-slate-200">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Why are you requesting reconsideration? <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          rows={3}
                          value={appealReason}
                          onChange={(e) => setAppealReason(e.target.value)}
                          placeholder="Describe specifically why the resolution is unsatisfactory..."
                          className="w-full p-3.5 rounded-xl border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                          required
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => { setShowAppealForm(false); setAppealReason(''); }}
                          disabled={loading}
                          className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 hover:text-slate-900 text-xs font-semibold transition cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={loading || !appealReason.trim()}
                          className="py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold transition cursor-pointer shadow-xs"
                        >
                          {loading ? 'Submitting...' : 'Submit Reconsideration'}
                        </button>
                      </div>
                    </form>
                  )
                )}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 italic">
                This complaint is currently resolved. Awaiting student confirmation or appeal.
              </div>
            )
          ) : !isStaff ? (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
              <span className="font-bold text-slate-900 block">Student Tracking View</span>
              <p className="text-slate-600 text-xs leading-relaxed">
                Your complaint is currently assigned to <strong>{getHandlerDisplayName()}</strong> for review. State transitions are performed by designated faculty handlers.
              </p>
            </div>
          ) : (
            <>
              {/* Policy Approval Lock Warning */}
              {complaint?.policyApproval?.requiresPrincipalApproval &&
               complaint?.policyApproval?.approvalStatus !== 'APPROVED' &&
               !hasRole('PRINCIPAL') &&
               role !== 'PRINCIPAL' && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                  <p>
                    <strong className="text-purple-950">Principal Policy Approval Pending:</strong> This complaint cannot be marked resolved until the Principal reviews and grants policy approval.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Action Note Justification
                </label>
                <div className="relative">
                  <textarea
                    rows={3}
                    maxLength={1000}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Add a brief note explaining this state update..."
                    className="w-full p-3.5 rounded-xl border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                  />
                  <span className="absolute bottom-2.5 right-3 text-[10px] font-mono text-slate-400">
                    {note.length} / 1000
                  </span>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                {onCancel && (
                  <button
                    type="button"
                    onClick={onCancel}
                    className="py-2.5 px-5 rounded-xl bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 hover:text-slate-900 text-xs font-bold transition cursor-pointer uppercase tracking-wider"
                  >
                    CANCEL
                  </button>
                )}

                <div className="flex flex-wrap items-center gap-2 ml-auto">
                  {/* Return for Correction Action */}
                  {isCurrentlyAssignedToUser && ['ASSIGNED', 'IN_PROGRESS', 'FORWARDED', 'ESCALATED'].includes(normalizedStatus) && (
                    <button
                      type="button"
                      disabled={loading || !note.trim()}
                      onClick={() => handleAction('RETURN_FOR_CORRECTION')}
                      className="py-2.5 px-4 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      title="Return complaint to student for missing details"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Return for Correction</span>
                    </button>
                  )}

                  {/* Reject Action */}
                  {isCurrentlyAssignedToUser && ['ASSIGNED', 'IN_PROGRESS', 'FORWARDED', 'ESCALATED'].includes(normalizedStatus) && (
                    <button
                      type="button"
                      disabled={loading || !note.trim()}
                      onClick={() => handleAction('REJECT')}
                      className="py-2.5 px-4 rounded-xl bg-red-50 hover:bg-red-100 border border-red-300 text-red-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      title="Reject invalid complaint"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  )}

                  {/* Class Incharge Forward Action */}
                  {canForwardToTG && (
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleAction('FORWARD')}
                      className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span>Forward to TG</span>
                    </button>
                  )}

                  {/* Escalation Action (Teacher Guardian / HOD / Dean / Campus Head) */}
                  {canEscalate && (
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleAction('ESCALATE')}
                      className="py-2.5 px-5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Escalate</span>
                    </button>
                  )}

                  {/* Primary Submit Action Button (Resolves Complaint) */}
                  {isCurrentlyAssignedToUser && (
                    <button
                      type="button"
                      disabled={
                        loading || 
                        !note.trim() || 
                        (complaint?.policyApproval?.requiresPrincipalApproval &&
                         complaint?.policyApproval?.approvalStatus !== 'APPROVED' &&
                         !hasRole('PRINCIPAL') && role !== 'PRINCIPAL')
                      }
                      onClick={() => handleAction('RESOLVE')}
                      className="py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      {loading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      <span>SUBMIT ACTION</span>
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Tab 2: Add Comment ── */}
      {activeTab === 'COMMENT' && (
        <form onSubmit={handleCommentSubmit} className="space-y-3">
          <textarea
            rows={3}
            value={commentMsg}
            onChange={(e) => setCommentMsg(e.target.value)}
            placeholder="Type your official comment message here..."
            className="w-full p-3.5 rounded-xl border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
            required
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading || !commentMsg.trim()}
              className="py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageSquare className="w-3.5 h-3.5" />}
              <span>Post Comment</span>
            </button>
          </div>
        </form>
      )}

      {/* ── Tab 3: Override Priority ── */}
      {activeTab === 'PRIORITY' && isStaff && (
        <form onSubmit={handlePrioritySubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Target Priority Level</label>
            <select
              value={overridePriorityVal}
              onChange={(e) => setOverridePriorityVal(e.target.value)}
              className="w-full h-10 rounded-xl border border-slate-300 px-3 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="LOW">Low — Normal Inquiry</option>
              <option value="MEDIUM">Medium — Standard Issue</option>
              <option value="HIGH">High — Urgent Attention</option>
              <option value="CRITICAL">Critical — Emergency Hazard</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Mandatory Justification Reason</label>
            <textarea
              rows={2}
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              placeholder="Explain why priority override is required for audit trail..."
              className="w-full p-3 rounded-xl border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
              required
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading || !overrideReason.trim()}
              className="py-2.5 px-5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <AlertTriangle className="w-3.5 h-3.5" />}
              <span>Override Priority (Audited)</span>
            </button>
          </div>
        </form>
      )}

    </div>
  );
}
