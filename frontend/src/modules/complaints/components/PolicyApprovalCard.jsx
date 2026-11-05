import React, { useState } from 'react';
import { 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Check, 
  X, 
  Loader2,
  FileCheck2,
  AlertTriangle
} from 'lucide-react';
import apiClient from '../../../core/api/apiClient';

export default function PolicyApprovalCard({ complaint, role, user, onRefresh }) {
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [decisionType, setDecisionType] = useState('APPROVED'); // APPROVED | REJECTED
  const [decisionNotes, setDecisionNotes] = useState('');
  const [loading, setLoading] = useState(false);

  if (!complaint || !complaint.policyApproval?.requiresPrincipalApproval) {
    return null;
  }

  const policy = complaint.policyApproval;
  const status = String(policy.approvalStatus || 'PENDING_APPROVAL').toUpperCase().trim();

  // Determine if current user has Principal authority
  const userRoles = [
    ...(Array.isArray(user?.roles) ? user.roles : []),
    user?.primaryRole,
    user?.role,
    role
  ].filter(Boolean).map(r => String(r).toUpperCase().trim());

  const isPrincipal = userRoles.includes('PRINCIPAL') || userRoles.includes('SUPER_ADMIN');

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' +
             d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
      return String(dateStr);
    }
  };

  const handleDecisionSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiClient.post(`/complaints/${complaint.complaintUuid}/policy/approval-decision`, {
        decision: decisionType,
        decisionNotes: decisionNotes.trim(),
        version: complaint.version
      });
      setShowDecisionModal(false);
      setDecisionNotes('');
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.message || 'Failed to submit policy decision.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Principal Policy Governance
            </h3>
            <p className="text-[11px] text-slate-500">
              High-budget, safety, or institutional policy mandatory compliance
            </p>
          </div>
        </div>

        <div>
          {status === 'APPROVED' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold uppercase tracking-wider">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> POLICY APPROVED
            </span>
          ) : status === 'REJECTED' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 text-xs font-bold uppercase tracking-wider">
              <XCircle className="w-3.5 h-3.5 text-red-600" /> POLICY REJECTED
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold uppercase tracking-wider animate-pulse">
              <Clock className="w-3.5 h-3.5 text-amber-600" /> PENDING PRINCIPAL APPROVAL
            </span>
          )}
        </div>
      </div>

      {/* Policy Details Box */}
      <div className="p-3.5 rounded-xl bg-purple-50/50 border border-purple-200/70 text-xs space-y-2">
        <div>
          <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider block">Policy Reason & Justification</span>
          <p className="text-slate-800 text-xs font-medium mt-0.5 leading-relaxed">
            {policy.policyReason || 'Mandatory institutional policy approval required.'}
          </p>
        </div>

        {status !== 'PENDING_APPROVAL' && policy.decisionByUserUuid && (
          <div className="pt-2 border-t border-purple-200/60 text-[11px] text-slate-600 space-y-0.5">
            <p>
              Decision By: <strong className="text-slate-900">{policy.decisionByName || 'Principal'}</strong> ({formatDate(policy.decisionAt)})
            </p>
            {policy.decisionNotes && (
              <p className="text-slate-700 italic">
                Notes: "{policy.decisionNotes}"
              </p>
            )}
          </div>
        )}
      </div>

      {/* Principal Action Buttons */}
      {status === 'PENDING_APPROVAL' && (
        <div className="pt-1">
          {isPrincipal ? (
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => { setDecisionType('APPROVED'); setShowDecisionModal(true); }}
                className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Grant Policy Approval</span>
              </button>

              <button
                type="button"
                onClick={() => { setDecisionType('REJECTED'); setShowDecisionModal(true); }}
                className="py-2 px-4 rounded-xl bg-white border border-red-200 text-red-600 hover:bg-red-50 font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reject Policy Approval</span>
              </button>
            </div>
          ) : (
            <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-xs text-amber-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p>
                <strong>Resolution Locked:</strong> This complaint cannot be marked resolved or closed until the Principal grants policy approval.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Decision Modal */}
      {showDecisionModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-purple-600" />
                <span>{decisionType === 'APPROVED' ? 'Grant Policy Approval' : 'Reject Policy Approval'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowDecisionModal(false)}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleDecisionSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Policy Decision Notes & Institutional Justification
                </label>
                <textarea
                  rows={3}
                  placeholder={decisionType === 'APPROVED' ? 'Approved under annual infrastructure fund allocation...' : 'Rejected due to alternative budget schedule...'}
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDecisionModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-5 py-2 rounded-xl text-white font-bold cursor-pointer flex items-center gap-1.5 shadow-xs ${
                    decisionType === 'APPROVED' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Confirm {decisionType === 'APPROVED' ? 'Approval' : 'Rejection'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
