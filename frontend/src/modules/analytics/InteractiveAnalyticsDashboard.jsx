import React, { useState, useMemo } from 'react';
import { 
  generateVisualizationComplaints, 
  CAMPUS_BUILDINGS, 
  CATEGORIES,
  DEPARTMENTS
} from './data/ccmsAnalyticsData';

import KpiSparklineCards from './components/KpiSparklineCards';
import CampusMapCard from './components/CampusMapCard';
import ComplaintTrendCard from './components/ComplaintTrendCard';
import CategoryDonutCard from './components/CategoryDonutCard';
import DepartmentDivisionAnalytics from './components/DepartmentDivisionAnalytics';
import PowerBiPivotMatrix from './components/PowerBiPivotMatrix';
import ComplaintInspectModal from './components/ComplaintInspectModal';

import { Search, Calendar, Download, ChevronDown, X, RotateCcw, BarChart2 } from 'lucide-react';

export default function InteractiveAnalyticsDashboard() {
  // Master isolated mock dataset for Power BI visualization
  const [allComplaints] = useState(() => generateVisualizationComplaints());

  // Interactive Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [activeBuilding, setActiveBuilding] = useState(null);
  const [activeZone, setActiveZone] = useState(null);
  const [activeType, setActiveType] = useState('All');
  const [activeDepartment, setActiveDepartment] = useState(null);
  const [activeDivision, setActiveDivision] = useState(null);
  const [activeSeverity, setActiveSeverity] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeStatus, setActiveStatus] = useState(null);
  const [timeRange, setTimeRange] = useState([0, 7]); // [startIndex, endIndex] for 8 weeks
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);
  const [selectedDateLabel, setSelectedDateLabel] = useState('Oct 01, 2026 - Oct 31, 2026');

  // Cross-Component Telemetry States
  const [hoveredBuilding, setHoveredBuilding] = useState(null);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [hoveredWeek, setHoveredWeek] = useState(null);

  const [selectedComplaint, setSelectedComplaint] = useState(null);

  // Dynamic Filtering (Power BI model filter propagation)
  const filteredComplaints = useMemo(() => {
    return allComplaints.filter((item) => {
      if (activeBuilding && item.building !== activeBuilding) return false;
      if (activeZone && activeZone !== 'All' && item.zone !== activeZone) return false;
      if (activeType && activeType !== 'All' && item.buildingType !== activeType) return false;
      if (activeDepartment && item.departmentId !== activeDepartment) return false;
      if (activeDivision && item.division !== activeDivision) return false;
      if (activeSeverity && item.severity !== activeSeverity) return false;
      if (activeCategory && item.category !== activeCategory) return false;
      if (activeStatus && item.status !== activeStatus) return false;

      if (timeRange) {
        const weekNum = parseInt(item.weekLabel.replace('Wk ', ''), 10) - 1;
        if (weekNum < timeRange[0] || weekNum > timeRange[1]) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches = 
          item.id.toLowerCase().includes(q) ||
          item.title.toLowerCase().includes(q) ||
          item.building.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          item.departmentName.toLowerCase().includes(q) ||
          (item.division && item.division.toLowerCase().includes(q));
        if (!matches) return false;
      }

      return true;
    });
  }, [allComplaints, activeBuilding, activeZone, activeType, activeDepartment, activeDivision, activeSeverity, activeCategory, activeStatus, timeRange, searchQuery]);

  // Derived Aggregations
  const aggregations = useMemo(() => {
    const total = filteredComplaints.length;
    const resolved = filteredComplaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length;
    const inProgress = filteredComplaints.filter(c => c.status === 'In Progress' || c.status === 'Under Investigation').length;
    const escalated = filteredComplaints.filter(c => c.status === 'Escalated').length;
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    // Building counts
    const bStats = {};
    CAMPUS_BUILDINGS.forEach(b => {
      const bItems = filteredComplaints.filter(c => c.building === b.name);
      bStats[b.name] = {
        total: bItems.length,
        critical: bItems.filter(c => c.severity === 'Critical').length,
        resolved: bItems.filter(c => c.status === 'Resolved' || c.status === 'Closed').length
      };
    });

    // Severity counts
    const sCounts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    filteredComplaints.forEach(c => {
      if (sCounts[c.severity] !== undefined) sCounts[c.severity] += 1;
    });

    // Category counts
    const catStats = CATEGORIES.map(cat => {
      const items = filteredComplaints.filter(c => c.category === cat.id);
      return {
        ...cat,
        count: items.length
      };
    }).sort((a, b) => b.count - a.count);

    // 8-Week timeline trends
    const weekTrends = [
      { label: 'Wk 1', inflow: 0, resolved: 0 },
      { label: 'Wk 2', inflow: 0, resolved: 0 },
      { label: 'Wk 3', inflow: 0, resolved: 0 },
      { label: 'Wk 4', inflow: 0, resolved: 0 },
      { label: 'Wk 5', inflow: 0, resolved: 0 },
      { label: 'Wk 6', inflow: 0, resolved: 0 },
      { label: 'Wk 7', inflow: 0, resolved: 0 },
      { label: 'Wk 8', inflow: 0, resolved: 0 },
    ];

    filteredComplaints.forEach(c => {
      const wIdx = parseInt(c.weekLabel.replace('Wk ', ''), 10) - 1;
      if (weekTrends[wIdx]) {
        weekTrends[wIdx].inflow += 1;
        if (c.status === 'Resolved' || c.status === 'Closed') {
          weekTrends[wIdx].resolved += 1;
        }
      }
    });

    return {
      kpis: {
        total,
        resolved,
        inProgress,
        escalated,
        resolutionRate
      },
      buildingStats: bStats,
      severityCounts: sCounts,
      categoryStats: catStats,
      weeklyTrends: weekTrends
    };
  }, [filteredComplaints]);

  // Cross-Hover highlight
  const highlightedBuildingsFromCategory = useMemo(() => {
    if (!hoveredCategory) return [];
    const bldgs = new Set();
    filteredComplaints
      .filter(c => c.category === hoveredCategory)
      .forEach(c => bldgs.add(c.building));
    return Array.from(bldgs);
  }, [hoveredCategory, filteredComplaints]);

  // Export Data
  const handleExport = () => {
    const headers = ['ID', 'Title', 'Building', 'Category', 'Department', 'Division', 'Severity', 'Status', 'SLA', 'Resolution Hours', 'Reported On'];
    const rows = filteredComplaints.map(c => [
      `"${c.id}"`,
      `"${c.title.replace(/"/g, '""')}"`,
      `"${c.building}"`,
      `"${c.category}"`,
      `"${c.departmentName}"`,
      `"${c.division || ''}"`,
      `"${c.severity}"`,
      `"${c.status}"`,
      `"${c.slaStatus}"`,
      `"${c.resolutionHours}"`,
      `"${c.createdAt}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CampusFix_PowerBI_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const hasActiveFilters = Boolean(
    activeBuilding ||
    (activeZone && activeZone !== 'All') ||
    (activeType && activeType !== 'All') ||
    activeDepartment ||
    activeDivision ||
    activeSeverity ||
    activeCategory ||
    activeStatus ||
    searchQuery ||
    (timeRange && (timeRange[0] > 0 || timeRange[1] < 7))
  );

  const handleResetAllFilters = () => {
    setActiveBuilding(null);
    setActiveZone(null);
    setActiveType('All');
    setActiveDepartment(null);
    setActiveDivision(null);
    setActiveSeverity(null);
    setActiveCategory(null);
    setActiveStatus(null);
    setTimeRange([0, 7]);
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen w-full bg-[#F7FAFE] text-slate-800 font-sans p-4 sm:p-5 lg:p-6 select-none">
      
      {/* 1. Power BI Executive Report Title & Slicer Bar */}
      <header className="mb-4 bg-white border border-slate-200 shadow-xs rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-4">
        
        {/* Title Badge */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>CampusFix</span>
              <span className="text-slate-300 font-normal">|</span>
              <span className="text-slate-700">Complaint Intelligence Dashboard</span>
              <span className="text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                Power BI Model
              </span>
            </h1>
            <p className="text-[11px] text-slate-500">
              Interactive dimensional cross-filtering & campus spatial diagnostics
            </p>
          </div>
        </div>

        {/* Global Slicers & Controls */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Search Slicer */}
          <div className="w-72 relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search complaints, buildings, departments..."
              className="w-full pl-9 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Date Slicer */}
          <div className="relative">
            <button
              onClick={() => setDateDropdownOpen(prev => !prev)}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>{selectedDateLabel}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {dateDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-56 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-40">
                {['Oct 01, 2026 - Oct 31, 2026', 'Last 7 Days', 'Last 14 Days', 'All Semester'].map((d) => (
                  <button
                    key={d}
                    onClick={() => {
                      setSelectedDateLabel(d);
                      setDateDropdownOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                  >
                    {d}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              onClick={handleResetAllFilters}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Slicers</span>
            </button>
          )}

          {/* Export Button */}
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export</span>
          </button>

        </div>

      </header>

      {/* Active Filter Strip */}
      {hasActiveFilters && (
        <div className="bg-white border border-slate-200 rounded-xl px-4 py-2 mb-4 flex flex-wrap items-center justify-between gap-2 shadow-xs animate-in fade-in">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Active Slicers:</span>
            {activeDepartment && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                Dept: {DEPARTMENTS.find(d => d.id === activeDepartment)?.name || activeDepartment}
                <X className="w-3 h-3 cursor-pointer" onClick={() => { setActiveDepartment(null); setActiveDivision(null); }} />
              </span>
            )}
            {activeDivision && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                Division: {activeDivision}
                <X className="w-3 h-3 cursor-pointer" onClick={() => setActiveDivision(null)} />
              </span>
            )}
            {activeBuilding && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                Facility: {activeBuilding}
                <X className="w-3 h-3 cursor-pointer" onClick={() => setActiveBuilding(null)} />
              </span>
            )}
            {activeCategory && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 font-medium">
                Category: {activeCategory}
                <X className="w-3 h-3 cursor-pointer" onClick={() => setActiveCategory(null)} />
              </span>
            )}
            {activeSeverity && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 font-medium">
                Priority: {activeSeverity}
                <X className="w-3 h-3 cursor-pointer" onClick={() => setActiveSeverity(null)} />
              </span>
            )}
            {activeType && activeType !== 'All' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-cyan-50 text-cyan-700 border border-cyan-200 font-medium">
                Type: {activeType}
                <X className="w-3 h-3 cursor-pointer" onClick={() => setActiveType('All')} />
              </span>
            )}
          </div>

          <button
            onClick={handleResetAllFilters}
            className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 transition cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Clear All Slicers</span>
          </button>
        </div>
      )}

      {/* 2. Row 1: KPI Cards with Sparklines */}
      <KpiSparklineCards
        kpis={aggregations.kpis}
        activeFilter={{ status: activeStatus }}
        onToggleFilter={(k, v) => setActiveStatus(v)}
      />

      {/* 3. Row 2: Campus Map (Left 62%) & Trend + Category (Right 38%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4">
        
        {/* Campus Map Component */}
        <div className="lg:col-span-7 xl:col-span-8">
          <CampusMapCard
            buildings={CAMPUS_BUILDINGS}
            buildingStats={aggregations.buildingStats}
            activeBuilding={activeBuilding}
            onToggleBuilding={setActiveBuilding}
            hoveredBuilding={hoveredBuilding}
            onHoverBuilding={setHoveredBuilding}
            severityCounts={aggregations.severityCounts}
            activeSeverity={activeSeverity}
            onToggleSeverity={setActiveSeverity}
            activeZone={activeZone}
            onToggleZone={setActiveZone}
            activeType={activeType}
            onToggleType={setActiveType}
            highlightedBuildingsFromOther={highlightedBuildingsFromCategory}
          />
        </div>

        {/* Right Column: Complaint Trend + Category Donut */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-4">
          
          {/* Complaint Trend with Range Scrubber */}
          <ComplaintTrendCard
            trends={aggregations.weeklyTrends}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
            hoveredWeek={hoveredWeek}
            onHoverWeek={setHoveredWeek}
          />

          {/* Complaints by Category Donut */}
          <CategoryDonutCard
            categories={CATEGORIES}
            categoryStats={aggregations.categoryStats}
            activeCategory={activeCategory}
            onToggleCategory={setActiveCategory}
            hoveredCategory={hoveredCategory}
            onHoverCategory={setHoveredCategory}
            totalComplaints={aggregations.kpis.total}
          />

        </div>

      </div>

      {/* 4. Row 3: Department & Operational Intelligence Component */}
      <DepartmentDivisionAnalytics
        departments={DEPARTMENTS}
        complaints={filteredComplaints}
        activeDepartment={activeDepartment}
        onToggleDepartment={setActiveDepartment}
        activeDivision={activeDivision}
        onToggleDivision={setActiveDivision}
        activeSeverity={activeSeverity}
        onToggleSeverity={setActiveSeverity}
        activeStatus={activeStatus}
        onToggleStatus={setActiveStatus}
      />

      {/* 5. Row 4: Power BI Pivot Matrix & Cross-Tabulation */}
      <PowerBiPivotMatrix
        complaints={filteredComplaints}
        categories={CATEGORIES}
        onInspectComplaint={(c) => setSelectedComplaint(c)}
        onToggleCategory={setActiveCategory}
        activeCategory={activeCategory}
      />

      {/* Detailed Complaint Inspection Modal */}
      {selectedComplaint && (
        <ComplaintInspectModal
          complaint={selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
        />
      )}

    </div>
  );
}
