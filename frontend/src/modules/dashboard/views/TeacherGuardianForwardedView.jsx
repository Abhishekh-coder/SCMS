import React, { useState, useEffect } from 'react';
import ComplaintTable from '../../complaints/ComplaintTable';
import { Inbox, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';
import apiClient from '../../../core/api/apiClient';

export default function TeacherGuardianForwardedView({ user, onSelectComplaint }) {
  const [assignedComplaints, setAssignedComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const divCode = user?.divisionCode || 'IT-A';

  useEffect(() => {
    fetchForwardedData();
  }, [user]);

  const fetchForwardedData = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/complaints/my-assigned');
      if (res && res.data) {
        const actionable = (res.data || []).filter(
          c => c.assignedToUserUuid === user?.userUuid && ['FORWARDED', 'ESCALATED'].includes(c.status)
        );
        setAssignedComplaints(actionable);
      }
    } catch (e) {
      console.error('Error loading TG forwarded complaints:', e);
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
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              Teacher Guardian • Division {divCode}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Forwarded Complaints</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Active grievances forwarded to your authority by the Class Incharge requiring senior review or resolution.
          </p>
        </div>

        <span className="text-xs font-bold px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 self-start sm:self-auto">
          {assignedComplaints.length} {assignedComplaints.length === 1 ? 'Actionable Case' : 'Actionable Cases'}
        </span>
      </div>

      {/* ── Complaints Table / Empty State ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs w-full min-w-0 max-w-full overflow-x-hidden box-border">
        {assignedComplaints.length === 0 && !loading ? (
          <div className="py-12 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-200">
              <Inbox className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">No Forwarded Complaints</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              There are currently no forwarded grievances awaiting your review in Division {divCode}.
            </p>
          </div>
        ) : (
          <ComplaintTable 
            complaints={assignedComplaints} 
            onSelectComplaint={onSelectComplaint} 
            loading={loading} 
          />
        )}
      </div>

    </div>
  );
}
