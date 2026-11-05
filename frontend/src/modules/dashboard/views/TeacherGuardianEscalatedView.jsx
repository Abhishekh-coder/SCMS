import React, { useState, useEffect } from 'react';
import ComplaintTable from '../../complaints/ComplaintTable';
import { BarChart3, AlertTriangle, ShieldCheck } from 'lucide-react';
import apiClient from '../../../core/api/apiClient';

export default function TeacherGuardianEscalatedView({ user, onSelectComplaint }) {
  const [escalatedComplaints, setEscalatedComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const divCode = user?.divisionCode || 'IT-A';
  const deptCode = user?.departmentCode || 'IT';

  useEffect(() => {
    fetchEscalatedData();
  }, [user]);

  const fetchEscalatedData = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/complaints/division');
      if (res && res.data) {
        // Filter complaints currently in ESCALATED state
        const escalated = (res.data || []).filter(c => c.status === 'ESCALATED');
        setEscalatedComplaints(escalated);
      }
    } catch (e) {
      console.error('Error loading TG escalated complaints:', e);
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
              Department of {deptCode} • Division {divCode}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Escalated to HOD</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Grievances escalated from Division {divCode} to the Head of Department for administrative decision.
          </p>
        </div>

        <span className="text-xs font-bold px-3.5 py-1.5 rounded-full bg-red-50 text-red-700 border border-red-200 self-start sm:self-auto">
          {escalatedComplaints.length} {escalatedComplaints.length === 1 ? 'Escalated Case' : 'Escalated Cases'}
        </span>
      </div>

      {/* ── Complaints Table / Empty State ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs w-full min-w-0 max-w-full overflow-x-hidden box-border">
        {escalatedComplaints.length === 0 && !loading ? (
          <div className="py-12 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">No Escalated Complaints</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              There are currently no active grievances escalated to the HOD from Division {divCode}.
            </p>
          </div>
        ) : (
          <ComplaintTable 
            complaints={escalatedComplaints} 
            onSelectComplaint={onSelectComplaint} 
            loading={loading} 
          />
        )}
      </div>

    </div>
  );
}
