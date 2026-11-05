import React, { useState, useEffect } from 'react';
import ComplaintTable from '../../complaints/ComplaintTable';
import { ShieldCheck, AlertTriangle } from 'lucide-react';
import apiClient from '../../../core/api/apiClient';

export default function HodEscalatedView({ user, onSelectComplaint }) {
  const [escalatedComplaints, setEscalatedComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const deptCode = user?.departmentCode || user?.department || 'IT';

  useEffect(() => {
    fetchEscalatedData();
  }, [user]);

  const fetchEscalatedData = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/complaints/my-assigned');
      if (res && res.data) {
        const actionable = (res.data || []).filter(
          c => c.assignedToUserUuid === user?.userUuid && c.status === 'ESCALATED'
        );
        setEscalatedComplaints(actionable);
      }
    } catch (e) {
      console.error('Error fetching HOD escalated complaints:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 w-full min-w-0 max-w-full overflow-x-hidden box-border">
      
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-red-700 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200">
              Department of {deptCode} • Action Queue
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Escalated</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Grievances escalated by Teacher Guardians requiring Head of Department review or administrative resolution.
          </p>
        </div>

        <span className="text-xs font-bold px-3.5 py-1.5 rounded-full bg-red-50 text-red-700 border border-red-200 self-start sm:self-auto">
          {escalatedComplaints.length} {escalatedComplaints.length === 1 ? 'Actionable Case' : 'Actionable Cases'}
        </span>
      </div>

      {/* ── Complaints Table / Empty State ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs w-full min-w-0 max-w-full overflow-x-hidden box-border">
        {escalatedComplaints.length === 0 && !loading ? (
          <div className="py-12 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">No Escalated Cases</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No complaints require your action.
            </p>
          </div>
        ) : (
          <ComplaintTable
            complaints={escalatedComplaints}
            showDivision={true}
            onSelectComplaint={onSelectComplaint}
            loading={loading}
          />
        )}
      </div>

    </div>
  );
}
