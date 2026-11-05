import React, { useState } from 'react';
import { 
  Wrench, 
  CheckCircle2, 
  Clock, 
  User, 
  FileText, 
  Image as ImageIcon, 
  AlertCircle, 
  Plus, 
  ExternalLink, 
  X,
  Loader2,
  ShieldCheck,
  Check
} from 'lucide-react';
import apiClient from '../../../core/api/apiClient';

export default function TechnicianRepairCard({ complaint, role, user, onRefresh }) {
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [activeEvidenceModal, setActiveEvidenceModal] = useState(null);
  const [brokenImages, setBrokenImages] = useState({});
  const [loading, setLoading] = useState(false);

  // Form states for Assign
  const [assignForm, setAssignForm] = useState({
    technicianUserUuid: '',
    technicianName: '',
    trade: 'ELECTRICIAN',
    notes: ''
  });

  // Form states for Update Work
  const [updateForm, setUpdateForm] = useState({
    status: 'IN_PROGRESS',
    resolutionNotes: '',
    evidenceUrlInput: ''
  });

  if (!complaint) return null;

  const tech = complaint.technicianAssignment || {};
  const status = String(tech.status || 'UNASSIGNED').toUpperCase().trim();
  const hasTechnician = Boolean(tech.technicianUserUuid || tech.technicianName);

  // Normalize user roles
  const userRoles = [
    ...(Array.isArray(user?.roles) ? user.roles : []),
    user?.primaryRole,
    user?.role,
    role
  ].filter(Boolean).map(r => String(r).toUpperCase().trim());

  const isStaff = userRoles.some(r => ['CAMPUS_SERVICES_HEAD', 'ADMIN', 'SUPER_ADMIN', 'HOD', 'DEAN', 'PRINCIPAL', 'FACULTY', 'CLASS_INCHARGE'].includes(r));
  const isAssignedTechnician = user?.userUuid && tech.technicianUserUuid === user.userUuid;
  const canAssign = isStaff;
  const canUpdateWork = isAssignedTechnician || userRoles.some(r => ['ADMIN', 'SUPER_ADMIN', 'CAMPUS_SERVICES_HEAD'].includes(r));

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' +
             d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
      return String(dateStr);
    }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assignForm.technicianName.trim() || !assignForm.technicianUserUuid.trim()) {
      alert('Please provide technician ID and full name.');
      return;
    }
    setLoading(true);
    try {
      await apiClient.post(`/complaints/${complaint.complaintUuid}/technician/assign`, {
        technicianUserUuid: assignForm.technicianUserUuid.trim(),
        technicianName: assignForm.technicianName.trim(),
        trade: assignForm.trade,
        notes: assignForm.notes.trim(),
        version: complaint.version
      });
      setShowAssignModal(false);
      setAssignForm({ technicianUserUuid: '', technicianName: '', trade: 'ELECTRICIAN', notes: '' });
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.message || 'Failed to assign technician.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateWorkSubmit = async (e) => {
    e.preventDefault();
    if (updateForm.status === 'RESOLVED' && (!updateForm.resolutionNotes || updateForm.resolutionNotes.trim().length < 5)) {
      alert('Resolution notes (at least 5 characters) are required upon completing repair.');
      return;
    }

    const evidenceUrls = updateForm.evidenceUrlInput
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    setLoading(true);
    try {
      await apiClient.post(`/complaints/${complaint.complaintUuid}/technician/status`, {
        status: updateForm.status,
        resolutionNotes: updateForm.resolutionNotes.trim(),
        evidenceUrls,
        version: complaint.version
      });
      setShowUpdateModal(false);
      setUpdateForm({ status: 'IN_PROGRESS', resolutionNotes: '', evidenceUrlInput: '' });
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.message || 'Failed to update repair work.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (st) => {
    switch (st) {
      case 'RESOLVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold uppercase tracking-wider">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> REPAIR COMPLETED
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" /> WORK IN PROGRESS
          </span>
        );
      case 'DISPATCHED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold uppercase tracking-wider">
            <Wrench className="w-3.5 h-3.5 text-blue-600" /> DISPATCHED
          </span>
        );
      case 'REOPENED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold uppercase tracking-wider">
            <AlertCircle className="w-3.5 h-3.5 text-purple-600" /> WORK REOPENED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-xs font-bold uppercase tracking-wider">
            UNASSIGNED
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
            <Wrench className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Physical Repair Tracking
            </h3>
            <p className="text-[11px] text-slate-500">
              Independent ground execution track for facility and maintenance repairs
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {getStatusBadge(status)}
        </div>
      </div>

      {/* Isolation Guard Notice */}
      <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl flex items-start gap-2.5 text-[11px] text-slate-600">
        <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <p>
          <strong>Dual-Track Decoupled Architecture:</strong> Physical repair operates independently from the administrative authority hierarchy. Marking repair completed does not close the complaint until the designated authority verifies the outcome.
        </p>
      </div>

      {/* Main Details Grid */}
      {hasTechnician ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50/70 border border-slate-200/70 rounded-xl text-xs">
            {/* Technician Info */}
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Assigned Technician</span>
              <div className="font-bold text-slate-900 mt-0.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>{tech.technicianName}</span>
              </div>
              <span className="inline-block mt-1 px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold uppercase tracking-wider">
                {tech.trade || 'GENERAL REPAIR'}
              </span>
            </div>

            {/* Timestamps */}
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Assignment Log</span>
              <p className="text-slate-700 text-[11px] mt-0.5">
                Dispatched: <strong className="text-slate-900">{formatDate(tech.assignedAt)}</strong>
              </p>
              {tech.startedAt && (
                <p className="text-slate-700 text-[11px]">
                  Started: <strong className="text-slate-900">{formatDate(tech.startedAt)}</strong>
                </p>
              )}
              {tech.resolvedAt && (
                <p className="text-emerald-700 text-[11px]">
                  Resolved: <strong>{formatDate(tech.resolvedAt)}</strong>
                </p>
              )}
            </div>

            {/* Actions for Technician / Staff */}
            <div className="flex flex-col justify-center sm:items-end gap-2">
              {canUpdateWork && (
                <button
                  type="button"
                  onClick={() => setShowUpdateModal(true)}
                  className="py-2 px-3.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs transition cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Update Work / Complete</span>
                </button>
              )}
              {canAssign && (
                <button
                  type="button"
                  onClick={() => setShowAssignModal(true)}
                  className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 underline transition cursor-pointer"
                >
                  Reassign Technician
                </button>
              )}
            </div>
          </div>

          {/* Resolution Notes Box */}
          {tech.resolutionNotes && (
            <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/80 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-emerald-900 text-[11px] uppercase tracking-wider">
                <FileText className="w-3.5 h-3.5 text-emerald-700" />
                <span>Technician Completion Notes</span>
              </div>
              <p className="text-slate-800 text-xs leading-relaxed pl-5 whitespace-pre-wrap">
                {tech.resolutionNotes}
              </p>
            </div>
          )}

          {/* Evidence Previews Section */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
              <span>Repair Evidence Photos ({tech.evidenceUrls?.length || 0})</span>
            </span>

            {tech.evidenceUrls && tech.evidenceUrls.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {tech.evidenceUrls.map((url, idx) => (
                  <div
                    key={idx}
                    onClick={() => setActiveEvidenceModal(url)}
                    className="group relative aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer shadow-2xs hover:shadow-md transition"
                  >
                    {!brokenImages[url] ? (
                      <img
                        src={url}
                        alt={`Evidence ${idx + 1}`}
                        onError={() => setBrokenImages(prev => ({ ...prev, [url]: true }))}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-2 text-slate-400 text-center">
                        <AlertCircle className="w-5 h-5 mb-1 text-slate-400" />
                        <span className="text-[10px] font-mono break-all line-clamp-1">Evidence Doc</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                      <ExternalLink className="w-4 h-4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                No physical repair photo evidence uploaded yet.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">No Technician Assigned Yet</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Administrative workflow is ongoing. Facility head or authorized office can dispatch a physical technician.
            </p>
          </div>
          {canAssign && (
            <button
              type="button"
              onClick={() => setShowAssignModal(true)}
              className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Dispatch Technician</span>
            </button>
          )}
        </div>
      )}

      {/* ── Modal: Assign Technician ── */}
      {showAssignModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Wrench className="w-4 h-4 text-blue-600" /> Dispatch Technician
              </h3>
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Technician User ID / UUID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. usr_tech_vijay_01"
                  value={assignForm.technicianUserUuid}
                  onChange={(e) => setAssignForm({ ...assignForm, technicianUserUuid: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Technician Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vijay Sharma"
                  value={assignForm.technicianName}
                  onChange={(e) => setAssignForm({ ...assignForm, technicianName: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Trade Specialization *</label>
                <select
                  value={assignForm.trade}
                  onChange={(e) => setAssignForm({ ...assignForm, trade: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold focus:bg-white focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="ELECTRICIAN">ELECTRICIAN (Power, wiring, switches)</option>
                  <option value="PLUMBER">PLUMBER (Water supply, pipes, sanitation)</option>
                  <option value="IT_HARDWARE">IT HARDWARE (Wi-Fi router, LAN cable, lab PC)</option>
                  <option value="CARPENTER">CARPENTER (Doors, windows, desks, furniture)</option>
                  <option value="HVAC">HVAC (Air conditioning, ventilation)</option>
                  <option value="CIVIL">CIVIL (Masonry, plaster, leakage)</option>
                  <option value="GENERAL">GENERAL MAINTENANCE</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Dispatch Instructions / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Specific location details or safety instructions..."
                  value={assignForm.notes}
                  onChange={(e) => setAssignForm({ ...assignForm, notes: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Confirm Dispatch</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Update Work Progress ── */}
      {showUpdateModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Wrench className="w-4 h-4 text-orange-600" /> Technician Work Update
              </h3>
              <button
                type="button"
                onClick={() => setShowUpdateModal(false)}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateWorkSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Work Status *</label>
                <select
                  value={updateForm.status}
                  onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold focus:bg-white focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="IN_PROGRESS">IN_PROGRESS (Currently working on site)</option>
                  <option value="RESOLVED">RESOLVED (Physical repair complete)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Resolution Notes {updateForm.status === 'RESOLVED' && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  rows={3}
                  required={updateForm.status === 'RESOLVED'}
                  placeholder="Explain exactly what was fixed, replaced, or calibrated..."
                  value={updateForm.resolutionNotes}
                  onChange={(e) => setUpdateForm({ ...updateForm, resolutionNotes: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Evidence Photo URLs (One per line)</label>
                <textarea
                  rows={2}
                  placeholder="/uploads/evidence/fuse_fixed.jpg"
                  value={updateForm.evidenceUrlInput}
                  onChange={(e) => setUpdateForm({ ...updateForm, evidenceUrlInput: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono text-[11px] focus:bg-white focus:outline-none focus:border-blue-500"
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Secure storage paths (/uploads/...) or HTTPS image URLs.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUpdateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Save Work Status</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Full Size Evidence Lightbox ── */}
      {activeEvidenceModal && (
        <div 
          onClick={() => setActiveEvidenceModal(null)}
          className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm cursor-zoom-out"
        >
          <div className="relative max-w-4xl max-h-[85vh] bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
            <button
              onClick={() => setActiveEvidenceModal(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/90 transition z-10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={activeEvidenceModal}
              alt="Full Size Evidence"
              className="max-w-full max-h-[85vh] object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
