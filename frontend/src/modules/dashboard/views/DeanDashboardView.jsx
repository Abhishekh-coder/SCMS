import React, { useState, useEffect, useMemo } from 'react';
import StatCard from '../../../components/ui/StatCard';
import ComplaintTable from '../../complaints/ComplaintTable';
import { 
  BarChart3, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Building2, 
  ArrowRight, 
  ShieldAlert, 
  Layers, 
  RefreshCw,
  TrendingUp,
  Search,
  X
} from 'lucide-react';
import apiClient from '../../../core/api/apiClient';

export default function DeanDashboardView({ user, stats: parentStats, loading: parentLoading, onSelectComplaint, onRefresh }) {
  const [assignedComplaints, setAssignedComplaints] = useState([]);
  const [entityComplaints, setEntityComplaints] = useState([]);
  const [departmentStats, setDepartmentStats] = useState([]);
  const [needingAttention, setNeedingAttention] = useState(null);
  const [summaryStats, setSummaryStats] = useState({ total: 0, open: 0, escalated: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);

  // Filters for Entity History
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchDeanData();
  }, [user]);

  useEffect(() => {
    fetchFilteredEntityComplaints();
  }, [selectedDepartment, selectedStatus, selectedPriority, searchQuery]);

  const fetchDeanData = async () => {
    setLoading(true);
    try {
      const [statsRes, assignedRes, entityRes] = await Promise.all([
        apiClient.get('/complaints/stats/summary'),
        apiClient.get('/complaints/my-assigned'),
        apiClient.get('/complaints/dean-scope')
      ]);

      if (statsRes && statsRes.data) {
        const dStats = statsRes.data.stats || {};
        setSummaryStats({
          total: dStats.total || 0,
          open: dStats.open || dStats.inProgress || 0,
          escalated: dStats.escalated || 0,
          resolved: dStats.resolved || 0
        });

        if (statsRes.data.departments && statsRes.data.departments.length > 0) {
          setDepartmentStats(statsRes.data.departments);
        } else {
          setDepartmentStats([
            { departmentCode: 'IT', label: 'Information Technology', total: 0, open: 0, escalated: 0, resolved: 0, healthStatus: 'HEALTHY', healthLabel: 'Healthy' },
            { departmentCode: 'CE', label: 'Computer Engineering', total: 0, open: 0, escalated: 0, resolved: 0, healthStatus: 'HEALTHY', healthLabel: 'Healthy' },
            { departmentCode: 'EXTC', label: 'Electronics & Telecommunication', total: 0, open: 0, escalated: 0, resolved: 0, healthStatus: 'HEALTHY', healthLabel: 'Healthy' },
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

      if (entityRes && entityRes.data) {
        setEntityComplaints(entityRes.data || []);
      }
    } catch (e) {
      console.error('Error loading Dean command center data:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilteredEntityComplaints = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedDepartment !== 'ALL') params.append('departmentCode', selectedDepartment);
      if (selectedStatus !== 'ALL') params.append('status', selectedStatus);
      if (selectedPriority !== 'ALL') params.append('priority', selectedPriority);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const url = `/complaints/dean-scope?${params.toString()}`;
      const res = await apiClient.get(url);
      if (res && res.data) {
        setEntityComplaints(res.data || []);
      }
    } catch (e) {
      console.error('Error filtering Dean scope complaints:', e);
    }
  };

  const handleDepartmentClick = (deptCode) => {
    setSelectedDepartment(deptCode);
    const historySection = document.getElementById('dean-complaint-history');
    if (historySection) {
      historySection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const clearFilters = () => {
    setSelectedDepartment('ALL');
    setSelectedStatus('ALL');
    setSelectedPriority('ALL');
    setSearchQuery('');
  };

  const hasActiveFilters = selectedDepartment !== 'ALL' || selectedStatus !== 'ALL' || selectedPriority !== 'ALL' || searchQuery.trim() !== '';

  const isDataLoading = loading || parentLoading;

  const totalEntityComplaints = useMemo(() => {
    return departmentStats.reduce((acc, curr) => acc + (curr.total || 0), 0) || 1;
  }, [departmentStats]);

  return (
    <div className="space-y-8">
      {/* ── 1. Dean Command Center Header ── */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold text-xs border border-blue-200">
              Dean of Academics • Faculty of Engineering
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
              <Building2 className="w-3 h-3 text-slate-500" />
              Multi-Department Command Center
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Welcome, {user?.fullName || 'Dr. Meera Joshi'}</h2>
          <p className="text-sm text-slate-500 mt-1">
            Executive oversight across all academic departments, real-time workload balance, and actionable escalations.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            fetchDeanData();
            if (onRefresh) onRefresh();
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold shadow-xs transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isDataLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* ── 2. Top Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Complaints" 
          value={summaryStats.total} 
          icon={BarChart3} 
          color="blue" 
          subtitle="All Academic Departments"
        />
        <StatCard 
          title="Open / In Progress" 
          value={summaryStats.open} 
          icon={Clock} 
          color="amber" 
          subtitle="Active Resolution Queue"
        />
        <StatCard 
          title="Escalated to Me" 
          value={summaryStats.escalated} 
          icon={AlertTriangle} 
          color="red" 
          subtitle="Dean Action Required"
        />
        <StatCard 
          title="Resolved" 
          value={summaryStats.resolved} 
          icon={CheckCircle2} 
          color="emerald" 
          subtitle="Closed Cases"
        />
      </div>

      {/* ── 3. 🔥 Department Performance Cards ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <span>Department Performance</span>
            </h3>
            <p className="text-xs text-slate-500">Live operational workload and health status across academic departments</p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            {departmentStats.length} Departments Monitored
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {departmentStats.map((dept) => {
            const isAttention = dept.healthStatus === 'ATTENTION';
            const isCritical = dept.healthStatus === 'CRITICAL';
            const isSelected = selectedDepartment === dept.departmentCode;

            return (
              <div 
                key={dept.departmentCode}
                className={`bg-white rounded-2xl p-5 border transition-all duration-200 shadow-xs flex flex-col justify-between ${
                  isSelected 
                    ? 'border-blue-500 ring-2 ring-blue-500/20' 
                    : isCritical 
                    ? 'border-red-300' 
                    : isAttention 
                    ? 'border-amber-300' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-base font-bold text-slate-900 font-mono">{dept.departmentCode}</h4>
                      <p className="text-xs text-slate-500 font-sans">{dept.label}</p>
                    </div>

                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                      isCritical
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : isAttention
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${
                        isCritical ? 'bg-red-500 animate-pulse' : isAttention ? 'bg-amber-500' : 'bg-emerald-500'
                      }`} />
                      {dept.healthLabel || (isCritical ? 'Critical' : isAttention ? 'Attention' : 'Healthy')}
                    </span>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-3.5 mb-4 border border-slate-200 grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between items-center py-1 border-b border-slate-200">
                      <span className="text-slate-500 font-medium">Total:</span>
                      <span className="font-bold text-slate-900 font-mono text-sm">{dept.total}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-200 pl-2">
                      <span className="text-slate-500 font-medium">Open:</span>
                      <span className={`font-bold font-mono text-sm ${dept.open > 0 ? 'text-amber-600' : 'text-slate-500'}`}>{dept.open}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-500 font-medium">Escalated:</span>
                      <span className={`font-bold font-mono text-sm ${dept.escalated > 0 ? 'text-red-600' : 'text-slate-500'}`}>{dept.escalated}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 pl-2">
                      <span className="text-slate-500 font-medium">Resolved:</span>
                      <span className="font-bold text-emerald-600 font-mono text-sm">{dept.resolved}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDepartmentClick(dept.departmentCode)}
                  className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                  }`}
                >
                  <span>{isSelected ? 'Viewing Department' : 'View Department'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 4. Department Comparison & Attention Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Complaint Distribution by Department */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span>Complaint Distribution by Department</span>
              </h4>
              <p className="text-xs text-slate-500">Volume proportion and workload balance across faculty departments</p>
            </div>
          </div>

          <div className="space-y-4">
            {departmentStats.map((dept) => {
              const pct = Math.round(((dept.total || 0) / (totalEntityComplaints || 1)) * 100);
              return (
                <div key={dept.departmentCode} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-slate-700 font-mono">{dept.departmentCode} ({dept.label})</span>
                    <span className="text-slate-500 font-mono">{dept.total} Complaints ({pct}%)</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                    <div 
                      className="bg-blue-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-200 overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-slate-500 font-semibold border-b border-slate-200">
                  <th className="pb-2">Department</th>
                  <th className="pb-2 text-center">Total</th>
                  <th className="pb-2 text-center">Open</th>
                  <th className="pb-2 text-center">Escalated</th>
                  <th className="pb-2 text-center">Resolved</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                {departmentStats.map(d => (
                  <tr key={d.departmentCode} className="hover:bg-slate-50">
                    <td className="py-2.5 font-semibold text-slate-900 font-sans">{d.label} ({d.departmentCode})</td>
                    <td className="py-2.5 text-center">{d.total}</td>
                    <td className="py-2.5 text-center text-amber-600 font-bold">{d.open}</td>
                    <td className="py-2.5 text-center text-red-600 font-bold">{d.escalated}</td>
                    <td className="py-2.5 text-center text-emerald-600 font-bold">{d.resolved}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Department Needing Attention Widget */}
        <div className="bg-amber-50/50 rounded-3xl p-6 border border-amber-200 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-amber-700">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
              <span className="text-xs font-extrabold uppercase tracking-wider font-mono">Department Needing Attention</span>
            </div>

            {needingAttention ? (
              <div className="space-y-3">
                <div>
                  <h4 className="text-3xl font-black text-slate-900 font-mono tracking-tight">{needingAttention.departmentCode}</h4>
                  <p className="text-xs font-bold text-amber-700 mt-1">
                    {needingAttention.open} Open • {needingAttention.escalated} Escalated
                  </p>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {needingAttention.reason || 'Highest active complaint load in Faculty of Engineering.'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <h4 className="text-xl font-bold text-slate-900">All Departments Healthy</h4>
                <p className="text-xs text-slate-500">No active escalations or pending SLA breaches.</p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => handleDepartmentClick(needingAttention?.departmentCode || 'IT')}
            className="w-full mt-6 py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Filter {needingAttention?.departmentCode || 'Department'} Records</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* ── 5. 🚨 Escalated to Me (Dean Action Queue) ── */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center border border-red-200">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Escalated to Me</h3>
              <p className="text-xs text-slate-500">Critical cases escalated by Department Heads for Dean resolution</p>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-red-50 text-red-700 border border-red-200">
            {assignedComplaints.length} Actionable
          </span>
        </div>

        <ComplaintTable
          complaints={assignedComplaints}
          showDivision={true}
          onSelectComplaint={(c) => onSelectComplaint && onSelectComplaint(c)}
          loading={isDataLoading}
        />
      </div>

      {/* ── 6. 📋 Entity Complaint History with Department Filters ── */}
      <div id="dean-complaint-history" className="space-y-4 pt-6 border-t border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Faculty of Engineering Complaint History</h3>
            <p className="text-xs text-slate-500">Complete audit trail across all faculty departments</p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 w-fit">
            {entityComplaints.length} Records Found
          </span>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Department Filter */}
            <div className="flex items-center gap-1 text-xs">
              <span className="text-slate-500 font-medium text-[11px] uppercase">Department:</span>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="h-9 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
              >
                <option value="ALL">All Departments</option>
                {departmentStats.map(d => (
                  <option key={d.departmentCode} value={d.departmentCode}>{d.departmentCode} — {d.label}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1 text-xs">
              <span className="text-slate-500 font-medium text-[11px] uppercase">Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="h-9 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
              >
                <option value="ALL">All Status</option>
                <option value="OPEN">Open / Active</option>
                <option value="ESCALATED">Escalated</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div className="flex items-center gap-1 text-xs">
              <span className="text-slate-500 font-medium text-[11px] uppercase">Priority:</span>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="h-9 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
              >
                <option value="ALL">All Priority</option>
                <option value="HIGH">High / Urgent</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>

            {/* Reset Filters */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="h-9 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}

          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search code, title, subject..."
              className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50 transition"
            />
          </div>
        </div>

        {/* Complaints Table */}
        <ComplaintTable
          complaints={entityComplaints}
          showDivision={true}
          onSelectComplaint={(c) => onSelectComplaint && onSelectComplaint(c)}
          loading={isDataLoading}
        />
      </div>
    </div>
  );
}
