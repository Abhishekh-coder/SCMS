import React from 'react';
import StatCard from '../../../components/ui/StatCard';
import ComplaintTable from '../../complaints/ComplaintTable';
import { Wrench, ShieldCheck, CheckCircle2, Clock } from 'lucide-react';

export default function CampusServicesDashboardView({ user, stats, complaints, loading, onSelectComplaint }) {
  const s = stats || {};

  return (
    <div className="space-y-8">
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs">
        <span className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold text-xs border border-blue-200 mb-2">
          Campus Services & Operations Head
        </span>
        <h2 className="text-2xl font-bold text-slate-900">Welcome, {user?.fullName || 'Facilities Head'}</h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">Operational complaint management domain (Hostel, Facilities, Transport, Security, Mess/Food, IT Support).</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Campus Total" value={s.total} icon={Wrench} color="indigo" />
        <StatCard title="In Progress" value={s.inProgress} icon={Clock} color="amber" />
        <StatCard title="Resolved" value={s.resolved} icon={CheckCircle2} color="emerald" />
        <StatCard title="Escalated" value={s.escalated} icon={ShieldCheck} color="red" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-center">
          <p className="text-xs font-semibold text-slate-500 uppercase">Hostel & Mess</p>
          <p className="text-xl font-bold text-slate-900 mt-1">12</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-center">
          <p className="text-xs font-semibold text-slate-500 uppercase">Facilities</p>
          <p className="text-xl font-bold text-slate-900 mt-1">8</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-center">
          <p className="text-xs font-semibold text-slate-500 uppercase">Transport & Security</p>
          <p className="text-xl font-bold text-slate-900 mt-1">5</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-center">
          <p className="text-xs font-semibold text-slate-500 uppercase">IT Support</p>
          <p className="text-xl font-bold text-slate-900 mt-1">6</p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900">Campus Services Complaints Queue</h3>
        <ComplaintTable complaints={complaints} onSelectComplaint={onSelectComplaint} loading={loading} />
      </div>
    </div>
  );
}
