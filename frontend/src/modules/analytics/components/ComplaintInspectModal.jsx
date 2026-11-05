import React from 'react';
import { 
  X, AlertOctagon, User, Building, MapPin, 
  Calendar, Clock, CheckCircle2 
} from 'lucide-react';

export default function ComplaintInspectModal({
  complaint,
  onClose
}) {
  if (!complaint) return null;

  const sevColor = complaint.severity === 'Critical'
    ? 'bg-rose-50 text-rose-700 border border-rose-200'
    : complaint.severity === 'High'
    ? 'bg-amber-50 text-amber-700 border border-amber-200'
    : 'bg-blue-50 text-blue-700 border border-blue-200';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
      <div 
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 flex items-start justify-between bg-slate-50 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono font-medium text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full">
                {complaint.id}
              </span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${sevColor}`}>
                {complaint.severity} Priority
              </span>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {complaint.status}
              </span>
              {complaint.slaStatus === 'Breached' && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                  <AlertOctagon className="w-3 h-3" /> SLA Breached
                </span>
              )}
            </div>
            <h2 className="text-base font-bold text-slate-900 leading-snug">
              {complaint.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-700 bg-white">
          
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 border border-slate-200 p-3 rounded-xl">
            <div>
              <span className="text-slate-500 text-[10px] block">Category</span>
              <span className="font-semibold text-slate-900">{complaint.category}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block">Department</span>
              <span className="font-semibold text-slate-900">{complaint.departmentName}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block">Location</span>
              <span className="font-semibold text-slate-900">{complaint.location}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block">Turnaround</span>
              <span className="font-semibold text-slate-900">{complaint.resolutionHours}h</span>
            </div>
          </div>

          {/* Root cause analysis */}
          <div>
            <h4 className="text-xs font-semibold text-slate-900 mb-1">
              Diagnosis & Root Cause
            </h4>
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-slate-700">
              {complaint.rootCause}
            </div>
          </div>

          {/* Assigned & Reporter */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center gap-2.5">
              <User className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-500 block">Reporter</span>
                <span className="font-semibold text-slate-900">{complaint.reporter}</span>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center gap-2.5">
              <Building className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-500 block">Assigned Unit</span>
                <span className="font-semibold text-slate-900">{complaint.assignedTo}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl shadow-xs transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
