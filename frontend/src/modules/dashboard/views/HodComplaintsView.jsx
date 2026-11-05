import React, { useState, useEffect } from 'react';
import ComplaintTable from '../../complaints/ComplaintTable';
import { Search, X, Filter, FileText } from 'lucide-react';
import apiClient from '../../../core/api/apiClient';

export default function HodComplaintsView({ user, onSelectComplaint }) {
  const [complaints, setComplaints] = useState([]);
  const [divisionList, setDivisionList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedDivision, setSelectedDivision] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const deptCode = user?.departmentCode || user?.department || 'IT';

  useEffect(() => {
    fetchDepartmentComplaints();
  }, [user, selectedDivision, selectedStatus, selectedPriority, searchQuery]);

  const fetchDepartmentComplaints = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedDivision !== 'ALL') params.append('divisionCode', selectedDivision);
      if (selectedStatus !== 'ALL') params.append('status', selectedStatus);
      if (selectedPriority !== 'ALL') params.append('priority', selectedPriority);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await apiClient.get(`/complaints/department?${params.toString()}`);
      if (res && res.data) {
        setComplaints(res.data || []);
      }

      // Discover division options
      const statsRes = await apiClient.get('/complaints/stats/summary');
      if (statsRes && statsRes.data && statsRes.data.divisions) {
        setDivisionList(statsRes.data.divisions);
      }
    } catch (e) {
      console.error('Error fetching department complaints:', e);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSelectedDivision('ALL');
    setSelectedStatus('ALL');
    setSelectedPriority('ALL');
    setSearchQuery('');
  };

  const hasActiveFilters = selectedDivision !== 'ALL' || selectedStatus !== 'ALL' || selectedPriority !== 'ALL' || searchQuery.trim() !== '';

  return (
    <div className="space-y-6 w-full min-w-0 max-w-full overflow-x-hidden box-border">
      
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-blue-400 bg-blue-950/60 px-2.5 py-0.5 rounded-full border border-blue-800/80">
              Department of {deptCode}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Complaints</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete complaint records and resolution history across all department divisions.
          </p>
        </div>

        <span className="text-xs font-bold px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 self-start sm:self-auto">
          {complaints.length} Records
        </span>
      </div>

      {/* ── Minimal Filter Bar ── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          
          <select
            value={selectedDivision}
            onChange={(e) => setSelectedDivision(e.target.value)}
            className="h-9 px-3 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 bg-white outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
          >
            <option value="ALL">Division [All]</option>
            {divisionList.map(d => (
              <option key={d.divisionCode} value={d.divisionCode}>{d.divisionCode}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-9 px-3 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 bg-white outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
          >
            <option value="ALL">Status [All]</option>
            <option value="OPEN">Open</option>
            <option value="ESCALATED">Escalated</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="h-9 px-3 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 bg-white outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
          >
            <option value="ALL">Priority [All]</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="h-9 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}

        </div>

        <div className="relative w-full sm:w-60">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search complaints"
            className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50 focus:bg-white transition"
          />
        </div>
      </div>

      {/* ── Complaints Table / Empty State ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs w-full min-w-0 max-w-full overflow-x-hidden box-border">
        {complaints.length === 0 && !loading ? (
          <div className="py-12 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto border border-slate-200">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">No Complaints</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No complaints match the selected filters.
            </p>
          </div>
        ) : (
          <ComplaintTable
            complaints={complaints}
            showDivision={true}
            onSelectComplaint={onSelectComplaint}
            loading={loading}
          />
        )}
      </div>

    </div>
  );
}
