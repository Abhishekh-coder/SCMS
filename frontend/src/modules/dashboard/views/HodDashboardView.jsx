import React, { useState, useEffect, useMemo } from 'react';
import StatCard from '../../../components/ui/StatCard';
import ComplaintTable from '../../complaints/ComplaintTable';
import { 
  BarChart3, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  RefreshCw,
  Search,
  X,
  Layers,
  ShieldAlert
} from 'lucide-react';
import apiClient from '../../../core/api/apiClient';

export default function HodDashboardView({ user, stats: parentStats, loading: parentLoading, onSelectComplaint, onRefresh }) {
  const [assignedComplaints, setAssignedComplaints] = useState([]);
  const [departmentComplaints, setDepartmentComplaints] = useState([]);
  const [divisionStats, setDivisionStats] = useState([]);
  const [needingAttention, setNeedingAttention] = useState(null);
  const [summaryStats, setSummaryStats] = useState({ total: 0, open: 0, escalated: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);

  // Filters for Department History
  const [selectedDivision, setSelectedDivision] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const deptCode = user?.departmentCode || user?.department || 'IT';

  useEffect(() => {
    fetchHodData();
  }, [user]);

  useEffect(() => {
    fetchFilteredDepartmentComplaints();
  }, [selectedDivision, selectedStatus, selectedPriority, searchQuery]);

  const fetchHodData = async () => {
    setLoading(true);
    try {
      const [statsRes, assignedRes, deptRes] = await Promise.all([
        apiClient.get('/complaints/stats/summary'),
        apiClient.get('/complaints/my-assigned'),
        apiClient.get('/complaints/department')
      ]);

      if (statsRes && statsRes.data) {
        const dStats = statsRes.data.stats || {};
        setSummaryStats({
          total: dStats.total || 0,
          open: dStats.open || dStats.inProgress || 0,
          escalated: dStats.escalated || 0,
          resolved: dStats.resolved || 0
        });

        if (statsRes.data.divisions && statsRes.data.divisions.length > 0) {
          setDivisionStats(statsRes.data.divisions);
        } else {
          setDivisionStats([
            { divisionCode: `${deptCode}-A`, label: `${deptCode} Division A`, total: 0, open: 0, escalated: 0, resolved: 0, workloadStatus: 'NO_OPEN_CASES', workloadLabel: 'No Open Cases' },
            { divisionCode: `${deptCode}-B`, label: `${deptCode} Division B`, total: 0, open: 0, escalated: 0, resolved: 0, workloadStatus: 'NO_OPEN_CASES', workloadLabel: 'No Open Cases' },
          ]);
        }

        if (statsRes.data.needingAttention) {
          setNeedingAttention(statsRes.data.needingAttention);
        }
      }

      if (assignedRes && assignedRes.data) {
        const actionable = (assignedRes.data || []).filter(
          c => c.assignedToUserUuid === user?.userUuid && c.status === 'ESCALATED'
        );
        setAssignedComplaints(actionable);
      }

      if (deptRes && deptRes.data) {
        setDepartmentComplaints(deptRes.data || []);
      }
    } catch (e) {
      console.error('Error loading HOD data:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilteredDepartmentComplaints = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedDivision !== 'ALL') params.append('divisionCode', selectedDivision);
      if (selectedStatus !== 'ALL') params.append('status', selectedStatus);
      if (selectedPriority !== 'ALL') params.append('priority', selectedPriority);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const url = `/complaints/department?${params.toString()}`;
      const res = await apiClient.get(url);
      if (res && res.data) {
        setDepartmentComplaints(res.data || []);
      }
    } catch (e) {
      console.error('Error filtering department complaints:', e);
    }
  };

  const handleDivisionClick = (divCode) => {
    setSelectedDivision(divCode);
    const historySection = document.getElementById('hod-complaint-history');
    if (historySection) {
      historySection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const clearFilters = () => {
    setSelectedDivision('ALL');
    setSelectedStatus('ALL');
    setSelectedPriority('ALL');
    setSearchQuery('');
  };

  const hasActiveFilters = selectedDivision !== 'ALL' || selectedStatus !== 'ALL' || selectedPriority !== 'ALL' || searchQuery.trim() !== '';
  const isDataLoading = loading || parentLoading;

  // Department-wide total count for accurate denominator calculation
  const deptTotalCount = useMemo(() => {
    return divisionStats.reduce((acc, curr) => acc + (curr.total || 0), 0);
  }, [divisionStats]);

  return (
    <div className="space-y-7 w-full min-w-0 max-w-full overflow-x-hidden box-border">
      
      {/* ── 1. Top Header ── */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between gap-4 w-full min-w-0 max-w-full box-border">
        <div className="space-y-1">
          <span className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200 mb-0.5">
            HOD • {deptCode}
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Welcome, {user?.fullName || 'Faculty'}
          </h2>
        </div>

        <button
          type="button"
          onClick={() => {
            fetchHodData();
            if (onRefresh) onRefresh();
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 hover:text-slate-900 text-xs font-bold transition cursor-pointer shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isDataLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* ── 2. Top Summary Metric Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full min-w-0 max-w-full box-border">
        <StatCard title="Total" value={summaryStats.total} icon={BarChart3} color="blue" />
        <StatCard title="Open" value={summaryStats.open} icon={Clock} color="amber" />
        <StatCard title="Escalated" value={summaryStats.escalated} icon={AlertTriangle} color="red" />
        <StatCard title="Resolved" value={summaryStats.resolved} icon={CheckCircle2} color="emerald" />
      </div>

      {/* ── 3. Division Overview Section ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-1">
          <div>
            <h3 className="text-base font-bold text-slate-900">Division Overview</h3>
            <p className="text-xs text-slate-500">Complaint volume by division</p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            {divisionStats.length} Divisions
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {divisionStats.map((div) => {
            const hasEscalated = div.escalated > 0;
            const hasOpen = div.open > 0 && !hasEscalated;
            const isSelected = selectedDivision === div.divisionCode || selectedDivision === div.fullCode;

            return (
              <div 
                key={div.divisionCode}
                className={`bg-white rounded-2xl p-5 border transition-all duration-200 hover:border-slate-300 shadow-xs flex flex-col justify-between ${
                  isSelected 
                    ? 'border-blue-500 ring-2 ring-blue-500/20' 
                    : hasEscalated 
                    ? 'border-red-300' 
                    : hasOpen
                    ? 'border-blue-200' 
                    : 'border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-base font-bold text-slate-900 font-mono">{div.divisionCode}</h4>
                    
                    {/* Factual Workload Status Badge */}
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      hasEscalated
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : hasOpen
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${hasEscalated ? 'bg-red-500' : hasOpen ? 'bg-blue-500' : 'bg-slate-400'}`} />
                      {hasEscalated 
                        ? 'Needs Review' 
                        : hasOpen 
                        ? (div.open === 1 ? '1 Open' : `${div.open} Open`)
                        : 'No Open Cases'}
                    </span>
                  </div>

                  {/* 2x2 Clean Compact Grid */}
                  <div className="bg-slate-50 rounded-xl p-3 mb-4 border border-slate-200 grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between items-center py-0.5 border-b border-slate-200">
                      <span className="text-slate-500 font-medium">Total:</span>
                      <span className="font-bold text-slate-800 font-mono">{div.total}</span>
                    </div>
                    <div className="flex justify-between items-center py-0.5 border-b border-slate-200 pl-2">
                      <span className="text-slate-500 font-medium">Open:</span>
                      <span className={`font-bold font-mono ${div.open > 0 ? 'text-amber-600' : 'text-slate-500'}`}>{div.open}</span>
                    </div>
                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-slate-500 font-medium">Escalated:</span>
                      <span className={`font-bold font-mono ${div.escalated > 0 ? 'text-red-600' : 'text-slate-500'}`}>{div.escalated}</span>
                    </div>
                    <div className="flex justify-between items-center py-0.5 pl-2">
                      <span className="text-slate-500 font-medium">Resolved:</span>
                      <span className="font-bold text-emerald-600 font-mono">{div.resolved}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDivisionClick(div.divisionCode)}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  <span>View Division</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 4. Division Distribution & Attention Required Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left: Division Distribution with Clear Denominator */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-900">Division Distribution</h4>
            <p className="text-xs text-slate-500">Share of department complaints</p>
          </div>

          <div className="space-y-3 pt-1">
            {deptTotalCount > 0 ? (
              divisionStats.map((div) => {
                const pct = Math.round((div.total / deptTotalCount) * 100);
                return (
                  <div key={div.divisionCode} className="space-y-1">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-slate-800 font-mono">{div.divisionCode}</span>
                      <span className="text-slate-500 font-mono">
                        {div.total} of {deptTotalCount} · {pct}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
                      <div 
                        className="bg-blue-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-4 text-center space-y-1">
                <p className="text-xs font-medium text-slate-500">No complaints yet</p>
                <div className="space-y-1 pt-1 opacity-60">
                  {divisionStats.map(div => (
                    <div key={div.divisionCode} className="flex justify-between text-[11px] text-slate-500 font-mono">
                      <span>{div.divisionCode}</span>
                      <span>0 complaints</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Attention Required */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900">Attention Required</h4>
            {needingAttention ? (
              <div className="space-y-2 pt-1">
                <span className="text-2xl font-bold text-slate-900 font-mono block">{needingAttention.divisionCode}</span>
                <span className="text-xs font-bold text-amber-600 block">
                  {needingAttention.open} Open · {needingAttention.escalated} Escalated
                </span>
              </div>
            ) : (
              <p className="text-xs text-slate-500 pt-1">No pending escalations across any division.</p>
            )}
          </div>

          <button
            type="button"
            onClick={() => handleDivisionClick(needingAttention?.divisionCode || `${deptCode}-A`)}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>View Division</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* ── 5. Escalated (Actionable Queue) ── */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4 w-full min-w-0 max-w-full overflow-x-hidden box-border">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <div>
            <h3 className="text-base font-bold text-slate-900">Escalated</h3>
            <p className="text-xs text-slate-500">Cases requiring review</p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-red-50 text-red-700 border border-red-200">
            {assignedComplaints.length} Pending
          </span>
        </div>

        <ComplaintTable
          complaints={assignedComplaints}
          showDivision={true}
          onSelectComplaint={(c) => onSelectComplaint && onSelectComplaint(c)}
          loading={isDataLoading}
        />
      </div>

      {/* ── 6. Complaint History Section with Clean Minimal Filters ── */}
      <div id="hod-complaint-history" className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4 w-full min-w-0 max-w-full overflow-x-hidden box-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
          <div>
            <h3 className="text-base font-bold text-slate-900">Complaint History</h3>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 w-fit">
            {departmentComplaints.length} Records
          </span>
        </div>

        {/* Minimal Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Division Filter */}
            <select
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
              className="h-9 px-3 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 bg-white outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value="ALL">Division [All]</option>
              {divisionStats.map(d => (
                <option key={d.divisionCode} value={d.divisionCode}>{d.divisionCode}</option>
              ))}
            </select>

            {/* Status Filter */}
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

            {/* Priority Filter */}
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

            {/* Reset */}
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

          {/* Search Box */}
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

        {/* Complaints Table */}
        <ComplaintTable
          complaints={departmentComplaints}
          showDivision={true}
          onSelectComplaint={(c) => onSelectComplaint && onSelectComplaint(c)}
          loading={isDataLoading}
        />
      </div>

    </div>
  );
}
