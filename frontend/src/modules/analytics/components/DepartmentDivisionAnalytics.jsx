import React, { useState, useMemo } from 'react';
import { 
  Building2, ChevronDown, Filter, X, BarChart3, CheckCircle2, 
  AlertTriangle, Layers, Clock, Zap, Users, ShieldAlert, Award
} from 'lucide-react';

export default function DepartmentDivisionAnalytics({
  departments = [],
  complaints = [],
  activeDepartment,
  onToggleDepartment,
  activeDivision,
  onToggleDivision,
  activeSeverity,
  onToggleSeverity,
  activeStatus,
  onToggleStatus
}) {
  const [hoveredDept, setHoveredDept] = useState(null);
  const [deptChartMetric, setDeptChartMetric] = useState('volume'); // 'volume' | 'resolution'
  const [comboChartMode, setComboChartMode] = useState('sla_mttr'); // 'sla_mttr' | 'status_flow' | 'stakeholder'

  // Selected department object
  const selectedDeptObj = departments.find(d => d.id === activeDepartment);
  const availableDivisions = selectedDeptObj ? selectedDeptObj.divisions : [];

  // Aggregate metrics per department
  const departmentStats = useMemo(() => {
    return departments.map((dept) => {
      const deptComplaints = complaints.filter(c => c.departmentId === dept.id);
      const total = deptComplaints.length;
      const resolved = deptComplaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length;
      const inProgress = deptComplaints.filter(c => c.status === 'In Progress' || c.status === 'Under Investigation').length;
      const escalated = deptComplaints.filter(c => c.status === 'Escalated').length;
      const critical = deptComplaints.filter(c => c.severity === 'Critical').length;
      const breached = deptComplaints.filter(c => c.slaStatus === 'Breached').length;
      const totalHours = deptComplaints.reduce((acc, c) => acc + (c.resolutionHours || 0), 0);
      const avgHours = total > 0 ? (totalHours / total).toFixed(1) : '0';
      const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

      // Division stats for hover popover
      const divBreakdown = (dept.divisions || []).map(divName => {
        const dItems = deptComplaints.filter(c => c.division === divName);
        return {
          name: divName,
          shortName: divName.replace(`${dept.code} - `, ''),
          count: dItems.length,
          resolved: dItems.filter(c => c.status === 'Resolved' || c.status === 'Closed').length
        };
      });

      return {
        ...dept,
        total,
        resolved,
        inProgress,
        escalated,
        critical,
        breached,
        avgHours,
        resolutionRate,
        divBreakdown
      };
    }).sort((a, b) => {
      if (deptChartMetric === 'resolution') {
        return b.resolutionRate - a.resolutionRate;
      }
      return b.total - a.total;
    });
  }, [departments, complaints, deptChartMetric]);

  // Aggregate metrics for active department's divisions (only used when department is selected)
  const activeDivisionsStats = useMemo(() => {
    if (!selectedDeptObj) return [];
    return availableDivisions.map((divName) => {
      const divComplaints = complaints.filter(c => c.departmentId === activeDepartment && c.division === divName);
      const total = divComplaints.length;
      const resolved = divComplaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length;
      const inProgress = divComplaints.filter(c => c.status === 'In Progress' || c.status === 'Under Investigation').length;
      const escalated = divComplaints.filter(c => c.status === 'Escalated').length;
      const critical = divComplaints.filter(c => c.severity === 'Critical').length;
      const breached = divComplaints.filter(c => c.slaStatus === 'Breached').length;
      const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

      return {
        name: divName,
        shortName: divName.replace(`${selectedDeptObj.code} - `, ''),
        total,
        resolved,
        inProgress,
        escalated,
        critical,
        breached,
        resolutionRate
      };
    });
  }, [selectedDeptObj, availableDivisions, complaints, activeDepartment]);

  // NEW COMBINATION BAR CHART DATA 1: SLA Compliance & MTTR by Severity (Critical, High, Medium, Low)
  const severityComboStats = useMemo(() => {
    const severities = [
      { id: 'Critical', label: 'Critical', color: '#f43f5e', targetMttr: 8 },
      { id: 'High', label: 'High', color: '#f59e0b', targetMttr: 24 },
      { id: 'Medium', label: 'Medium', color: '#38bdf8', targetMttr: 48 },
      { id: 'Low', label: 'Low', color: '#10b981', targetMttr: 72 },
    ];

    return severities.map(sev => {
      const items = complaints.filter(c => c.severity === sev.id);
      const total = items.length;
      const onTime = items.filter(c => c.slaStatus === 'Within SLA').length;
      const warning = items.filter(c => c.slaStatus === 'Warning').length;
      const breached = items.filter(c => c.slaStatus === 'Breached').length;
      const totalHours = items.reduce((acc, c) => acc + (c.resolutionHours || 0), 0);
      const avgMttr = total > 0 ? (totalHours / total).toFixed(1) : '0';
      const complianceRate = total > 0 ? Math.round((onTime / total) * 100) : 100;

      return {
        ...sev,
        total,
        onTime,
        warning,
        breached,
        avgMttr,
        complianceRate
      };
    });
  }, [complaints]);

  // NEW COMBINATION BAR CHART DATA 2: Resolution Status Pipeline
  const statusPipelineStats = useMemo(() => {
    const statuses = [
      { id: 'Resolved', label: 'Resolved', color: '#10b981' },
      { id: 'Closed', label: 'Closed', color: '#06b6d4' },
      { id: 'In Progress', label: 'In Progress', color: '#3b82f6' },
      { id: 'Under Investigation', label: 'Investigation', color: '#8b5cf6' },
      { id: 'Escalated', label: 'Escalated', color: '#ef4444' },
    ];

    return statuses.map(st => {
      const items = complaints.filter(c => c.status === st.id);
      const total = items.length;
      const breached = items.filter(c => c.slaStatus === 'Breached').length;
      const avgHours = total > 0 ? (items.reduce((acc, c) => acc + (c.resolutionHours || 0), 0) / total).toFixed(1) : '0';

      return {
        ...st,
        total,
        breached,
        avgHours
      };
    });
  }, [complaints]);

  // NEW COMBINATION BAR CHART DATA 3: Stakeholder / Reporter Persona Distribution
  const stakeholderStats = useMemo(() => {
    const personas = [
      { id: 'Student', label: 'Students', color: '#38bdf8' },
      { id: 'CR', label: 'Class Reps', color: '#a855f7' },
      { id: 'Lab Assistant', label: 'Lab Staff', color: '#f59e0b' },
      { id: 'Resident Student', label: 'Residents', color: '#ec4899' },
      { id: 'Faculty Proctor', label: 'Faculty', color: '#10b981' },
    ];

    return personas.map(p => {
      const items = complaints.filter(c => (c.reporter || '').includes(p.id));
      const total = items.length;
      const resolved = items.filter(c => c.status === 'Resolved' || c.status === 'Closed').length;
      const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

      return {
        ...p,
        total,
        resolved,
        resolutionRate
      };
    });
  }, [complaints]);

  const maxDeptCount = Math.max(...departmentStats.map(d => d.total), 1);
  const maxSevCount = Math.max(...severityComboStats.map(s => s.total), 1);
  const maxStatusCount = Math.max(...statusPipelineStats.map(s => s.total), 1);
  const maxPersonaCount = Math.max(...stakeholderStats.map(s => s.total), 1);

  const hoveredDeptData = departmentStats.find(d => d.id === hoveredDept);

  return (
    <div className="bg-white border border-slate-200 shadow-xs rounded-2xl p-5 select-none mb-4 relative">
      
      {/* 1. Header Bar: Engineering Academic Departments */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-2">
        
        {/* Title */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Department & Operational Intelligence</span>
              <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
                CSE • IT • EXTC • CE • MECH • AI&DS
              </span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Vertical column analytics: Department volume comparison & SLA turnaround metrics
            </p>
          </div>
        </div>

        {/* Clear Filter if any department or division is selected */}
        {(activeDepartment || activeDivision) && (
          <button
            onClick={() => {
              onToggleDepartment && onToggleDepartment(null);
              onToggleDivision && onToggleDivision(null);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Reset Dept Filter</span>
          </button>
        )}

      </div>

      {/* 2. Department Quick Selector Pills */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <button
          onClick={() => {
            onToggleDepartment && onToggleDepartment(null);
            onToggleDivision && onToggleDivision(null);
          }}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            !activeDepartment
              ? 'bg-blue-600 text-white font-bold shadow-xs'
              : 'bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200'
          }`}
        >
          All Departments
        </button>

        {departments.map((dept) => {
          const isDeptActive = activeDepartment === dept.id;

          return (
            <button
              key={dept.id}
              onClick={() => {
                onToggleDepartment && onToggleDepartment(isDeptActive ? null : dept.id);
                onToggleDivision && onToggleDivision(null);
              }}
              onMouseEnter={() => setHoveredDept(dept.id)}
              onMouseLeave={() => setHoveredDept(null)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isDeptActive
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full inline-block"
                style={{ backgroundColor: dept.color }}
              />
              <span className="font-mono text-[11px]">{dept.code}</span>
              <span className={`text-[11px] hidden sm:inline ${isDeptActive ? 'text-blue-100' : 'text-slate-500'}`}>({dept.name.split(' ')[0]})</span>
            </button>
          );
        })}
      </div>

      {/* 3. CONDITIONAL DIVISION SECTION: ONLY DISPLAYED WHEN A DEPARTMENT IS SELECTED */}
      {activeDepartment && selectedDeptObj && (
        <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-xl animate-in fade-in slide-in-from-top-1">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedDeptObj.color }} />
              <span className="font-bold text-slate-900 font-mono">{selectedDeptObj.code} Class Divisions:</span>
              <span className="text-[11px] text-slate-500">Select a specific division to drill down</span>
            </div>

            {activeDivision && (
              <button
                onClick={() => onToggleDivision && onToggleDivision(null)}
                className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Show All {selectedDeptObj.code} Divisions</span>
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onToggleDivision && onToggleDivision(null)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                !activeDivision
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              All {selectedDeptObj.code} Divisions ({activeDivisionsStats.reduce((sum, d) => sum + d.total, 0)} cases)
            </button>

            {activeDivisionsStats.map((div) => {
              const isDivActive = activeDivision === div.name;

              return (
                <button
                  key={div.name}
                  onClick={() => onToggleDivision && onToggleDivision(isDivActive ? null : div.name)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isDivActive
                      ? 'bg-blue-600 text-white font-bold shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className={`font-mono ${isDivActive ? 'text-white' : 'text-blue-600'}`}>{div.shortName}</span>
                  <span className="font-bold font-mono">{div.total}</span>
                  <span className={`text-[10px] ${isDivActive ? 'text-blue-100' : 'text-emerald-600'}`}>({div.resolutionRate}%)</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. SIDE-BY-SIDE VERTICAL COLUMN BAR CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Column: VERTICAL Department Column Bar Chart */}
        <div className="lg:col-span-6 bg-slate-50/70 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between relative">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
              <span>Department Vertical Column Chart</span>
            </h4>

            {/* Slicer toggle: By Volume vs By Resolution */}
            <div className="flex items-center bg-slate-200 border border-slate-200 p-0.5 rounded-lg text-[10px] font-semibold">
              <button
                onClick={() => setDeptChartMetric('volume')}
                className={`px-2.5 py-0.5 rounded transition cursor-pointer ${
                  deptChartMetric === 'volume' ? 'bg-white text-blue-700 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Volume
              </button>
              <button
                onClick={() => setDeptChartMetric('resolution')}
                className={`px-2.5 py-0.5 rounded transition cursor-pointer ${
                  deptChartMetric === 'resolution' ? 'bg-white text-emerald-700 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Res Rate
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[10px] font-mono text-slate-500 mb-2">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" /> Total Inflow (Cases)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Resolved Cases
            </span>
          </div>

          {/* VERTICAL BARS STAGE */}
          <div className="h-60 w-full relative flex items-end justify-between gap-2 pt-6 pb-2 px-1 border-b border-slate-200">
            
            {/* Subtle background horizontal guideline levels */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-30">
              <div className="border-b border-dashed border-slate-300 w-full" />
              <div className="border-b border-dashed border-slate-300 w-full" />
              <div className="border-b border-dashed border-slate-300 w-full" />
            </div>

            {departmentStats.map((dept) => {
              const isActive = activeDepartment === dept.id;
              const isHovered = hoveredDept === dept.id;
              const totalHeightPct = Math.max(Math.round((dept.total / maxDeptCount) * 100), 12);
              const resolvedHeightPct = Math.max(Math.round((dept.resolved / maxDeptCount) * 100), 8);

              return (
                <div
                  key={dept.id}
                  onClick={() => {
                    onToggleDepartment && onToggleDepartment(isActive ? null : dept.id);
                    onToggleDivision && onToggleDivision(null);
                  }}
                  onMouseEnter={() => setHoveredDept(dept.id)}
                  onMouseLeave={() => setHoveredDept(null)}
                  className={`flex-1 h-full flex flex-col items-center justify-end cursor-pointer group transition-all p-1 rounded-xl ${
                    isActive ? 'bg-blue-50/70 border border-blue-200' : isHovered ? 'bg-slate-100' : ''
                  }`}
                >
                  {/* Top Metric Tag */}
                  <div className="text-[10px] font-mono font-bold text-center mb-1 text-slate-800 opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-transform">
                    {dept.total}
                  </div>

                  {/* Dual Clustered Vertical Bars */}
                  <div className="w-full flex items-end justify-center gap-1 h-44">
                    {/* Primary Bar: Total Complaints */}
                    <div
                      className="w-3.5 sm:w-4 rounded-t-md transition-all duration-300 relative group-hover:brightness-110"
                      style={{
                        height: `${totalHeightPct}%`,
                        backgroundColor: dept.color
                      }}
                    />

                    {/* Secondary Bar: Resolved Complaints */}
                    <div
                      className="w-3 sm:w-3.5 rounded-t-md bg-emerald-500 transition-all duration-300 relative group-hover:brightness-110"
                      style={{
                        height: `${resolvedHeightPct}%`
                      }}
                    />
                  </div>

                  {/* Bottom Department Code Label */}
                  <div className="text-center mt-2">
                    <span className={`block font-mono text-xs font-bold transition-colors ${
                      isActive ? 'text-blue-600' : 'text-slate-700 group-hover:text-slate-900'
                    }`}>
                      {dept.code}
                    </span>
                    <span className="text-[9px] font-mono text-emerald-600 font-semibold block">
                      {dept.resolutionRate}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Subtext info */}
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-2">
            <span>6 Academic Engineering Departments</span>
            <span className="italic">💡 Hover column to inspect divisions, click to filter</span>
          </div>

          {/* Department Hover Popover / Tooltip */}
          {hoveredDept && hoveredDeptData && (
            <div className="absolute left-6 right-6 bottom-14 p-3 bg-white border border-slate-200 rounded-xl shadow-xl z-30 pointer-events-none animate-in fade-in">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: hoveredDeptData.color }} />
                  <span className="font-bold text-slate-900 text-xs">{hoveredDeptData.name} ({hoveredDeptData.code})</span>
                </div>
                <span className="text-[10px] font-mono text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                  {hoveredDeptData.total} Complaints • {hoveredDeptData.resolutionRate}% res
                </span>
              </div>

              <div className="text-[11px] text-slate-600 mb-2">
                <span className="text-slate-500">Divisions: </span>
                {hoveredDeptData.divBreakdown.map((div, i) => (
                  <span key={div.name} className="inline-block mr-2 font-mono text-slate-800">
                    {div.shortName}: <span className="text-blue-600 font-semibold">{div.count}</span>
                    {i < hoveredDeptData.divBreakdown.length - 1 ? ',' : ''}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-4 gap-2 text-[10px] font-mono text-slate-600 bg-slate-50 border border-slate-100 p-2 rounded-lg">
                <div>Resolved: <span className="text-emerald-600 font-bold">{hoveredDeptData.resolved}</span></div>
                <div>Critical: <span className="text-rose-600 font-bold">{hoveredDeptData.critical}</span></div>
                <div>Avg MTTR: <span className="text-slate-900 font-bold">{hoveredDeptData.avgHours}h</span></div>
                <div>Breached: <span className="text-amber-600 font-bold">{hoveredDeptData.breached}</span></div>
              </div>
            </div>
          )}

        </div>

        {/* Right Column: VERTICAL Combination Bar Chart (SLA & MTTR Turnaround) */}
        <div className="lg:col-span-6 bg-slate-50/70 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between">
          
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-blue-600" />
              <span>
                {comboChartMode === 'sla_mttr' && 'SLA Compliance & MTTR Vertical Chart'}
                {comboChartMode === 'status_flow' && 'Status Distribution Vertical Chart'}
                {comboChartMode === 'stakeholder' && 'Reporter Channels Vertical Chart'}
              </span>
            </h4>

            {/* Toggle Modes */}
            <div className="flex items-center bg-slate-200 border border-slate-200 p-0.5 rounded-lg text-[10px] font-semibold">
              <button
                onClick={() => setComboChartMode('sla_mttr')}
                className={`px-2.5 py-0.5 rounded transition cursor-pointer ${
                  comboChartMode === 'sla_mttr' ? 'bg-white text-blue-700 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                SLA & MTTR
              </button>
              <button
                onClick={() => setComboChartMode('status_flow')}
                className={`px-2.5 py-0.5 rounded transition cursor-pointer ${
                  comboChartMode === 'status_flow' ? 'bg-white text-blue-700 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Status Flow
              </button>
              <button
                onClick={() => setComboChartMode('stakeholder')}
                className={`px-2.5 py-0.5 rounded transition cursor-pointer ${
                  comboChartMode === 'stakeholder' ? 'bg-white text-purple-700 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Channels
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[10px] font-mono text-slate-500 mb-2">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> On-Time (Within SLA)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" /> Warning
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" /> Breached
            </span>
          </div>

          {/* Mode 1: VERTICAL SLA & Turnaround Chart */}
          {comboChartMode === 'sla_mttr' && (
            <div className="h-60 w-full relative flex items-end justify-between gap-3 pt-6 pb-2 px-2 border-b border-slate-200">
              
              {/* Guidelines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-30">
                <div className="border-b border-dashed border-slate-300 w-full" />
                <div className="border-b border-dashed border-slate-300 w-full" />
                <div className="border-b border-dashed border-slate-300 w-full" />
              </div>

              {severityComboStats.map((sev) => {
                const isSevActive = activeSeverity === sev.id;
                const totalHeightPct = Math.max(Math.round((sev.total / maxSevCount) * 100), 15);
                const onTimePct = sev.total > 0 ? (sev.onTime / sev.total) * 100 : 0;
                const warningPct = sev.total > 0 ? (sev.warning / sev.total) * 100 : 0;
                const breachedPct = sev.total > 0 ? (sev.breached / sev.total) * 100 : 0;

                return (
                  <div
                    key={sev.id}
                    onClick={() => onToggleSeverity && onToggleSeverity(isSevActive ? null : sev.id)}
                    className={`flex-1 h-full flex flex-col items-center justify-end cursor-pointer group transition-all p-1.5 rounded-xl ${
                      isSevActive ? 'bg-blue-50/70 border border-blue-200' : 'hover:bg-slate-100'
                    }`}
                  >
                    {/* Top Metric Badge */}
                    <div className="text-[10px] font-mono font-bold text-center mb-1 text-blue-600 group-hover:scale-110 transition-transform">
                      {sev.avgMttr}h MTTR
                    </div>

                    {/* Stacked Vertical Column */}
                    <div
                      className="w-8 sm:w-10 rounded-t-md overflow-hidden flex flex-col-reverse transition-all duration-300 group-hover:brightness-110"
                      style={{ height: `${totalHeightPct}%` }}
                    >
                      <div className="bg-emerald-500 w-full" style={{ height: `${onTimePct}%` }} />
                      <div className="bg-amber-500 w-full" style={{ height: `${warningPct}%` }} />
                      <div className="bg-rose-500 w-full" style={{ height: `${breachedPct}%` }} />
                    </div>

                    {/* Bottom Label */}
                    <div className="text-center mt-2">
                      <span className={`block font-mono text-xs font-bold ${
                        isSevActive ? 'text-rose-600' : 'text-slate-700 group-hover:text-slate-900'
                      }`}>
                        {sev.label}
                      </span>
                      <span className="text-[9px] font-mono text-emerald-600 font-semibold block">
                        {sev.complianceRate}% on-time
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Mode 2: VERTICAL Status Flow Chart */}
          {comboChartMode === 'status_flow' && (
            <div className="h-60 w-full relative flex items-end justify-between gap-3 pt-6 pb-2 px-2 border-b border-slate-200">
              {statusPipelineStats.map((st) => {
                const isStatusActive = activeStatus === st.id;
                const totalHeightPct = Math.max(Math.round((st.total / maxStatusCount) * 100), 12);

                return (
                  <div
                    key={st.id}
                    onClick={() => onToggleStatus && onToggleStatus(isStatusActive ? null : st.id)}
                    className={`flex-1 h-full flex flex-col items-center justify-end cursor-pointer group transition-all p-1.5 rounded-xl ${
                      isStatusActive ? 'bg-blue-50/70 border border-blue-200' : 'hover:bg-slate-100'
                    }`}
                  >
                    <div className="text-[10px] font-mono font-bold text-center mb-1 text-slate-800">
                      {st.total}
                    </div>

                    <div
                      className="w-7 sm:w-9 rounded-t-md transition-all duration-300 group-hover:brightness-110"
                      style={{
                        height: `${totalHeightPct}%`,
                        backgroundColor: st.color
                      }}
                    />

                    <div className="text-center mt-2">
                      <span className="block font-mono text-[11px] font-bold text-slate-700 group-hover:text-slate-900 truncate max-w-[70px]">
                        {st.label}
                      </span>
                      <span className="text-[9px] font-mono text-slate-500 block">
                        {st.avgHours}h
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Mode 3: VERTICAL Stakeholder Channels Chart */}
          {comboChartMode === 'stakeholder' && (
            <div className="h-60 w-full relative flex items-end justify-between gap-3 pt-6 pb-2 px-2 border-b border-slate-200">
              {stakeholderStats.map((persona) => {
                const totalHeightPct = Math.max(Math.round((persona.total / maxPersonaCount) * 100), 12);

                return (
                  <div
                    key={persona.id}
                    className="flex-1 h-full flex flex-col items-center justify-end group transition-all p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer"
                  >
                    <div className="text-[10px] font-mono font-bold text-center mb-1 text-slate-800">
                      {persona.total}
                    </div>

                    <div
                      className="w-7 sm:w-9 rounded-t-md transition-all duration-300 group-hover:brightness-110"
                      style={{
                        height: `${totalHeightPct}%`,
                        backgroundColor: persona.color
                      }}
                    />

                    <div className="text-center mt-2">
                      <span className="block font-mono text-[11px] font-bold text-slate-700 group-hover:text-slate-900 truncate max-w-[70px]">
                        {persona.label}
                      </span>
                      <span className="text-[9px] font-mono text-emerald-600 font-semibold block">
                        {persona.resolutionRate}% res
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Subtext info */}
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-2">
            <span>SLA Benchmarks: Critical &lt;8h • High &lt;24h • Med &lt;48h</span>
            <span className="italic">💡 Click column to cross-filter</span>
          </div>

        </div>

      </div>

    </div>
  );
}
