import React, { useState, useEffect } from 'react';
import StatCard from '../../../components/ui/StatCard';
import ComplaintTable from '../../complaints/ComplaintTable';
import ComplaintInsightsPanel from '../components/ComplaintInsightsPanel';
import { Inbox, Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react';
import apiClient from '../../../core/api/apiClient';

export default function TeacherGuardianDashboardView({ user, stats, loading: parentLoading, onSelectComplaint, onRefresh }) {
  const [assignedComplaints, setAssignedComplaints] = useState([]);
  const [divisionComplaints, setDivisionComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  const s = stats || {};
  const divCode = user?.divisionCode || 'IT-A';

  useEffect(() => {
    fetchTGData();
  }, [user, stats]);

  const fetchTGData = async () => {
    setLoading(true);
    try {
      const [assignedRes, divisionRes] = await Promise.all([
        apiClient.get('/complaints/my-assigned'),
        apiClient.get('/complaints/division')
      ]);

      if (assignedRes && assignedRes.data) {
        const actionable = (assignedRes.data || []).filter(
          c => c.assignedToUserUuid === user?.userUuid && ['FORWARDED', 'ESCALATED'].includes(c.status)
        );
        setAssignedComplaints(actionable);
      }
      if (divisionRes && divisionRes.data) {
        setDivisionComplaints(divisionRes.data || []);
      }
    } catch (e) {
      console.error('Error loading Teacher Guardian datasets:', e);
    } finally {
      setLoading(false);
    }
  };

  const isDataLoading = loading || parentLoading;

  const inReviewCount = divisionComplaints.filter(c => ['SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'FORWARDED'].includes(c.status)).length || s.open || s.inProgress || 0;
  const escalatedCount = divisionComplaints.filter(c => c.status === 'ESCALATED').length || s.escalated || 0;
  const resolvedCount = divisionComplaints.filter(c => ['RESOLVED', 'CLOSED'].includes(c.status)).length || s.resolved || 0;

  return (
    <div className="space-y-7 w-full min-w-0 max-w-full overflow-x-hidden">
      
      {/* ── 1. Header Banner ── */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full min-w-0 max-w-full">
        <div className="space-y-1">
          <span className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200 mb-1">
            Teacher Guardian • Division {divCode}
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Welcome, {user?.fullName || 'Faculty'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Monitor forwarded grievances, mediate classroom matters, and track escalated division cases.
          </p>
        </div>
      </div>

      {/* ── 2. Top Metric Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full min-w-0 max-w-full">
        <StatCard 
          title="ACTIONABLE QUEUE" 
          value={assignedComplaints.length} 
          icon={Inbox} 
          color="blue" 
        />
        <StatCard 
          title="UNDER REVIEW" 
          value={inReviewCount} 
          icon={Sparkles} 
          color="amber" 
        />
        <StatCard 
          title="ESCALATED TO HOD" 
          value={escalatedCount} 
          icon={AlertTriangle} 
          color="red" 
        />
        <StatCard 
          title="RESOLVED" 
          value={resolvedCount} 
          icon={CheckCircle2} 
          color="emerald" 
        />
      </div>

      {/* ── 3. Complaint Insights & Priority Overview ── */}
      <ComplaintInsightsPanel 
        complaints={divisionComplaints.length > 0 ? divisionComplaints : assignedComplaints} 
        role="TEACHER_GUARDIAN" 
      />

      {/* ── 4. Actionable Forwarded Queue ── */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4 w-full min-w-0 max-w-full overflow-x-hidden">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200 shrink-0">
              <Inbox className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Actionable Queue (Forwarded to Me)</h3>
              <p className="text-xs text-slate-500">Cases requiring your immediate review and intervention</p>
            </div>
          </div>
          <span className="text-xs font-bold px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            {assignedComplaints.length} Actionable
          </span>
        </div>
        <ComplaintTable
          complaints={assignedComplaints}
          onSelectComplaint={(c) => onSelectComplaint && onSelectComplaint(c)}
          loading={isDataLoading}
        />
      </div>

      {/* ── 5. Division Oversight (Read-Only) ── */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4 w-full min-w-0 max-w-full overflow-x-hidden">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div>
            <h3 className="text-base font-bold text-slate-900">All Division {divCode} Complaints</h3>
            <p className="text-xs text-slate-500">Read-only division overview for academic monitoring</p>
          </div>
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            Read Only • {divisionComplaints.length} {divisionComplaints.length === 1 ? 'Record' : 'Records'}
          </span>
        </div>
        <ComplaintTable
          complaints={divisionComplaints}
          onSelectComplaint={(c) => onSelectComplaint && onSelectComplaint(c)}
          loading={isDataLoading}
        />
      </div>

    </div>
  );
}
