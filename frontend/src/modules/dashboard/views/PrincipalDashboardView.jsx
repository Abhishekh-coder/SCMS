import React, { useState, useEffect, useMemo } from 'react';
import StatCard from '../../../components/ui/StatCard';
import ComplaintTable from '../../complaints/ComplaintTable';
import CampusMapView from '../../map/CampusMapView';
import InteractiveAnalyticsDashboard from '../../analytics/InteractiveAnalyticsDashboard';
import { 
  Building2, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  ArrowRight, 
  ShieldAlert, 
  RefreshCw,
  TrendingUp,
  Search,
  X,
  Map as MapIcon,
  BarChart3,
  Layers,
  FileCheck,
  Activity
} from 'lucide-react';
import apiClient from '../../../core/api/apiClient';

export default function PrincipalDashboardView({ 
  user, 
  stats: parentStats, 
  loading: parentLoading, 
  activeNav = 'COMMAND_CENTER',
  onSelectComplaint, 
  onRefresh 
}) {
  const [assignedComplaints, setAssignedComplaints] = useState([]);
  const [institutionComplaints, setInstitutionComplaints] = useState([]);
  const [departmentStats, setDepartmentStats] = useState([]);
  const [needingAttention, setNeedingAttention] = useState(null);
  const [summaryStats, setSummaryStats] = useState({ total: 0, open: 0, escalated: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);

  // Command Center Section Tabs: 'LIVE_MAP' | 'INSTITUTION_OVERVIEW' | 'ANALYTICS_EXPLORER' | 'ESCALATION_MGMT'
  const [activeCommandTab, setActiveCommandTab] = useState(() => {
    if (activeNav === 'CRITICAL_ESCALATIONS' || activeNav === 'INSTITUTIONAL_DECISIONS') return 'ESCALATION_MGMT';
    if (activeNav === 'DEPT_PERFORMANCE' || activeNav === 'AUDIT_ACTIVITY') return 'INSTITUTION_OVERVIEW';
    if (activeNav === 'ANALYTICS_EXPLORER') return 'ANALYTICS_EXPLORER';
    return 'LIVE_MAP';
  });

  // Sync tab with external activeNav changes
  useEffect(() => {
    if (activeNav === 'CRITICAL_ESCALATIONS' || activeNav === 'INSTITUTIONAL_DECISIONS') {
      setActiveCommandTab('ESCALATION_MGMT');
    } else if (activeNav === 'DEPT_PERFORMANCE' || activeNav === 'AUDIT_ACTIVITY') {
      setActiveCommandTab('INSTITUTION_OVERVIEW');
    } else if (activeNav === 'ANALYTICS_EXPLORER') {
      setActiveCommandTab('ANALYTICS_EXPLORER');
    }
  }, [activeNav]);

  // Filters for Institution History
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [oversightTab, setOversightTab] = useState('ALL'); // 'ALL' | 'POLICY_APPROVALS'

  useEffect(() => {
    fetchPrincipalData();
  }, [user]);

  useEffect(() => {
    fetchFilteredInstitutionComplaints();
  }, [selectedDepartment, selectedStatus, selectedPriority, searchQuery]);

  const policyComplaints = useMemo(() => {
    return institutionComplaints.filter(c => 
      c.requiresPrincipalApproval || (c.policyApproval && c.policyApproval.requiresPrincipalApproval)
    );
  }, [institutionComplaints]);

  const pendingPolicyCount = useMemo(() => {
    return policyComplaints.filter(c => 
      c.approvalStatus === 'PENDING_APPROVAL' || 
      (c.policyApproval && c.policyApproval.approvalStatus === 'PENDING_APPROVAL')
    ).length;
  }, [policyComplaints]);

  const displayedComplaints = useMemo(() => {
    if (oversightTab === 'POLICY_APPROVALS' || activeCommandTab === 'ESCALATION_MGMT') {
      return policyComplaints;
    }
    return institutionComplaints;
  }, [oversightTab, activeCommandTab, policyComplaints, institutionComplaints]);

  const fetchPrincipalData = async () => {
    setLoading(true);
    try {
      const [statsRes, assignedRes, instRes] = await Promise.all([
        apiClient.get('/complaints/stats/summary'),
        apiClient.get('/complaints/my-assigned'),
        apiClient.get('/complaints/institution')
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
            { departmentCode: 'CAMPUS_SERVICES', label: 'Campus Services', total: 0, open: 0, escalated: 0, resolved: 0, healthStatus: 'HEALTHY', healthLabel: 'Healthy' },
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

      if (instRes && instRes.data) {
        setInstitutionComplaints(instRes.data || []);
      }
    } catch (e) {
      console.error('Error loading Principal command center data:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilteredInstitutionComplaints = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedDepartment !== 'ALL') params.append('departmentCode', selectedDepartment);
      if (selectedStatus !== 'ALL') params.append('status', selectedStatus);
      if (selectedPriority !== 'ALL') params.append('priority', selectedPriority);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const url = `/complaints/institution?${params.toString()}`;
      const res = await apiClient.get(url);
      if (res && res.data) {
        setInstitutionComplaints(res.data || []);
      }
    } catch (e) {
      console.error('Error filtering institution complaints:', e);
    }
  };

  const handleDepartmentClick = (deptCode) => {
    setSelectedDepartment(deptCode);
    setActiveCommandTab('INSTITUTION_OVERVIEW');
    const historySection = document.getElementById('principal-complaint-history');
    if (historySection) {
      historySection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleBuildingDrilldown = (building) => {
    if (building?.shortName) {
      setSearchQuery(building.shortName);
    } else if (building?.name) {
      setSearchQuery(building.name);
    }
    setActiveCommandTab('INSTITUTION_OVERVIEW');
    const historySection = document.getElementById('principal-complaint-history');
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

  const commandTabs = [
    { id: 'LIVE_MAP', label: 'Live Campus Map', icon: MapIcon, count: '10 Facilities' },
    { id: 'INSTITUTION_OVERVIEW', label: 'Institutional Overview', icon: Building2, count: `${departmentStats.length} Depts` },
    { id: 'ANALYTICS_EXPLORER', label: 'Analytics Explorer', icon: BarChart3, count: 'Power BI' },
    { 
      id: 'ESCALATION_MGMT', 
      label: 'Escalation Management', 
      icon: AlertTriangle, 
      count: pendingPolicyCount > 0 ? `${pendingPolicyCount} Pending` : null,
      highlight: pendingPolicyCount > 0
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* ── 1. Principal Command Center Apex Banner ── */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200">
              Principal • Head of Institution
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              Campus Command Center
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Welcome, {user?.fullName || 'Dr. Rajesh Sharma'}</h2>
          <p className="text-sm text-slate-500 mt-1">
            Apex institutional command: live campus telemetry, cross-department governance, analytics explorer, and policy approvals.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            fetchPrincipalData();
            if (onRefresh) onRefresh();
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold shadow-xs transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isDataLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Cockpit</span>
        </button>
      </div>

      {/* ── 2. Unified Command Center Navigation Tabs ── */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-1.5">
        {commandTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeCommandTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveCommandTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : tab.highlight ? 'text-amber-500' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
              {tab.count && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isActive
                    ? 'bg-blue-700 text-white'
                    : tab.highlight
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── SECTION 1: LIVE CAMPUS MAP (Interactive Map Component) ── */}
      {activeCommandTab === 'LIVE_MAP' && (
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200 text-xs text-blue-900 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <MapIcon className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                <strong>Institutional Geographic View:</strong> Inspect campus facilities, review building-level grievance concentration, or click <em>Inspect Building Complaints</em> to drill down into active records.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActiveCommandTab('INSTITUTION_OVERVIEW')}
              className="text-xs font-bold text-blue-700 hover:underline shrink-0"
            >
              View All Complaints &rarr;
            </button>
          </div>

          <CampusMapView 
            onSelectBuildingComplaints={handleBuildingDrilldown} 
          />
        </div>
      )}

      {/* ── SECTION 2: INSTITUTIONAL OVERVIEW (Summary KPIs + Department Health) ── */}
      {activeCommandTab === 'INSTITUTION_OVERVIEW' && (
        <div className="space-y-6">
          {/* Top Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
              title="Institution Total" 
              value={summaryStats.total} 
              icon={Building2} 
              color="blue" 
              subtitle="All Campus Complaints"
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
              subtitle="Apex Action Required"
            />
            <StatCard 
              title="Resolved" 
              value={summaryStats.resolved} 
              icon={CheckCircle2} 
              color="emerald" 
              subtitle="Closed Cases"
            />
          </div>

          {/* Department Performance Cards */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <span>Department Performance & Health</span>
                </h3>
                <p className="text-xs text-slate-500">Live operational status and health across all college departments & services</p>
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
                      <span>Filter Department Complaints</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION 3: ANALYTICS EXPLORER (Power BI Interactive Tool) ── */}
      {activeCommandTab === 'ANALYTICS_EXPLORER' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Institutional Power BI Analytics Matrix</h3>
              <p className="text-xs text-slate-500 mt-0.5">Interactive multidimensional drilldown across buildings, departments, severities, and SLA adherence.</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              Executive Mode
            </span>
          </div>

          <InteractiveAnalyticsDashboard />
        </div>
      )}

      {/* ── SECTION 4: ESCALATION MANAGEMENT & POLICY APPROVALS ── */}
      {activeCommandTab === 'ESCALATION_MGMT' && (
        <div className="space-y-6">
          {/* Policy Approval Banner */}
          <div className="bg-purple-50 p-5 rounded-2xl border border-purple-200 flex items-start gap-3 shadow-xs">
            <ShieldAlert className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-purple-900">Mandatory Principal Policy Approvals ({pendingPolicyCount} Pending)</h4>
                <span className="text-[11px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full border border-purple-200">
                  Statutory Sign-off
                </span>
              </div>
              <p className="text-purple-700 text-xs mt-1 leading-relaxed">
                Complaints requiring mandatory Principal sign-off due to structural safety risks, budget ceilings, or institutional policy exceptions before administrative resolution. Select any row below to review justification, inspect technician evidence, and grant or reject policy approval.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── SHARED INSTITUTION HISTORY TABLE (Shown in Overview & Escalation Management) ── */}
      {(activeCommandTab === 'INSTITUTION_OVERVIEW' || activeCommandTab === 'ESCALATION_MGMT') && (
        <div id="principal-complaint-history" className="space-y-4 pt-2">
          
          {/* Table Header & Search Filter */}
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
                placeholder="Search building, code, title..."
                className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50 transition"
              />
            </div>
          </div>

          {/* Complaints Table */}
          <ComplaintTable
            complaints={displayedComplaints}
            showDivision={true}
            onSelectComplaint={(c) => onSelectComplaint && onSelectComplaint(c)}
            loading={isDataLoading}
          />
        </div>
      )}

    </div>
  );
}
