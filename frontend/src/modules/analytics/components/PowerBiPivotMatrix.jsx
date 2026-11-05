import React, { useState, useMemo } from 'react';
import { Table, Eye, ChevronRight, ChevronDown, ArrowUpDown, FileSpreadsheet } from 'lucide-react';

export default function PowerBiPivotMatrix({
  complaints = [],
  categories = [],
  onInspectComplaint,
  onToggleCategory,
  activeCategory
}) {
  const [viewMode, setViewMode] = useState('pivot'); // 'pivot' | 'flat'
  const [expandedCats, setExpandedCats] = useState({});

  const toggleExpand = (catId) => {
    setExpandedCats(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  // Group data like an Excel Pivot Table (Category -> Buildings -> Aggregated Metrics)
  const pivotData = useMemo(() => {
    return categories.map((cat) => {
      const catComplaints = complaints.filter(c => c.category === cat.id);
      const total = catComplaints.length;
      const resolved = catComplaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length;
      const inProgress = catComplaints.filter(c => c.status === 'In Progress' || c.status === 'Under Investigation').length;
      const escalated = catComplaints.filter(c => c.status === 'Escalated').length;
      const critical = catComplaints.filter(c => c.severity === 'Critical').length;
      const breached = catComplaints.filter(c => c.slaStatus === 'Breached').length;
      const totalHours = catComplaints.reduce((acc, c) => acc + (c.resolutionHours || 0), 0);
      const avgHours = total > 0 ? (totalHours / total).toFixed(1) : '0.0';

      // Sub-rows by Building
      const buildingGroups = {};
      catComplaints.forEach(c => {
        if (!buildingGroups[c.building]) {
          buildingGroups[c.building] = [];
        }
        buildingGroups[c.building].push(c);
      });

      const subRows = Object.entries(buildingGroups).map(([bldgName, bItems]) => {
        const bTotal = bItems.length;
        const bResolved = bItems.filter(c => c.status === 'Resolved' || c.status === 'Closed').length;
        const bInProgress = bItems.filter(c => c.status === 'In Progress' || c.status === 'Under Investigation').length;
        const bEscalated = bItems.filter(c => c.status === 'Escalated').length;
        const bCritical = bItems.filter(c => c.severity === 'Critical').length;
        const bBreached = bItems.filter(c => c.slaStatus === 'Breached').length;
        const bHours = bItems.reduce((acc, c) => acc + (c.resolutionHours || 0), 0);

        return {
          name: bldgName,
          total: bTotal,
          resolved: bResolved,
          inProgress: bInProgress,
          escalated: bEscalated,
          critical: bCritical,
          breached: bBreached,
          avgHours: bTotal > 0 ? (bHours / bTotal).toFixed(1) : '0.0'
        };
      }).sort((a, b) => b.total - a.total);

      return {
        ...cat,
        total,
        resolved,
        inProgress,
        escalated,
        critical,
        breached,
        avgHours,
        subRows
      };
    }).filter(c => c.total > 0).sort((a, b) => b.total - a.total);
  }, [complaints, categories]);

  // Overall Totals
  const grandTotal = complaints.length;
  const grandResolved = complaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length;
  const grandInProgress = complaints.filter(c => c.status === 'In Progress' || c.status === 'Under Investigation').length;
  const grandEscalated = complaints.filter(c => c.status === 'Escalated').length;
  const grandCritical = complaints.filter(c => c.severity === 'Critical').length;
  const grandBreached = complaints.filter(c => c.slaStatus === 'Breached').length;

  return (
    <div className="bg-white border border-slate-200 shadow-xs rounded-2xl overflow-hidden select-none mb-4">
      
      {/* Pivot Table Header */}
      <div className="p-4 flex flex-wrap items-center justify-between gap-3 bg-white border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Executive Pivot Matrix & Cross-Tabulation</span>
              <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full">
                Power BI Model
              </span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Interactive dimensional pivot table: Click category to expand building drill-downs
            </p>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 border border-slate-200 p-0.5 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setViewMode('pivot')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                viewMode === 'pivot'
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pivot Matrix
            </button>
            <button
              onClick={() => setViewMode('flat')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                viewMode === 'flat'
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Recent Records ({complaints.length})
            </button>
          </div>
        </div>
      </div>

      {/* Mode 1: Excel / Power BI Style Pivot Matrix */}
      {viewMode === 'pivot' ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-sans">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[11px] font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Category / Facility Drill-down</th>
                <th className="py-3 px-3 text-right">Total Cases</th>
                <th className="py-3 px-3 text-right">Resolved</th>
                <th className="py-3 px-3 text-right">In Progress</th>
                <th className="py-3 px-3 text-right">Escalated</th>
                <th className="py-3 px-3 text-right">Critical</th>
                <th className="py-3 px-3 text-right">SLA Breached</th>
                <th className="py-3 px-4 text-right">Avg MTTR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pivotData.map((row) => {
                const isExpanded = expandedCats[row.id];
                const isActive = activeCategory === row.id;

                return (
                  <React.Fragment key={row.id}>
                    {/* Category Summary Row */}
                    <tr
                      onClick={() => toggleExpand(row.id)}
                      className={`cursor-pointer transition-colors ${
                        isActive
                          ? 'bg-blue-50/80'
                          : isExpanded
                          ? 'bg-slate-50'
                          : 'hover:bg-slate-50/60'
                      }`}
                    >
                      <td className="py-2.5 px-4 font-semibold text-slate-900 flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5 text-blue-600" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        )}
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block"
                          style={{ backgroundColor: row.color }}
                        />
                        <span>{row.label}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          ({row.subRows.length} facilities)
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        {row.total}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-600 font-semibold">
                        {row.resolved}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-blue-600 font-semibold">
                        {row.inProgress}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-rose-600 font-semibold">
                        {row.escalated}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-red-600">
                        {row.critical}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-amber-600 font-semibold">
                        {row.breached}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-600">
                        {row.avgHours}h
                      </td>
                    </tr>

                    {/* Sub-rows: Building Drill-downs */}
                    {isExpanded && row.subRows.map((sub) => (
                      <tr
                        key={sub.name}
                        className="bg-slate-50/50 text-slate-700 hover:bg-slate-100 text-[11px]"
                      >
                        <td className="py-1.5 pl-10 pr-4 flex items-center gap-2 text-slate-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          <span>{sub.name}</span>
                        </td>
                        <td className="py-1.5 px-3 text-right font-mono font-medium text-slate-800">
                          {sub.total}
                        </td>
                        <td className="py-1.5 px-3 text-right font-mono text-emerald-600">
                          {sub.resolved}
                        </td>
                        <td className="py-1.5 px-3 text-right font-mono text-blue-600">
                          {sub.inProgress}
                        </td>
                        <td className="py-1.5 px-3 text-right font-mono text-rose-600">
                          {sub.escalated}
                        </td>
                        <td className="py-1.5 px-3 text-right font-mono text-red-600">
                          {sub.critical}
                        </td>
                        <td className="py-1.5 px-3 text-right font-mono text-amber-600">
                          {sub.breached}
                        </td>
                        <td className="py-1.5 px-4 text-right font-mono text-slate-500">
                          {sub.avgHours}h
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
            </tbody>

            {/* Grand Total Row */}
            <tfoot>
              <tr className="bg-slate-100 text-slate-900 font-bold font-mono text-xs border-t-2 border-slate-200">
                <td className="py-3 px-4 font-sans uppercase tracking-wider text-blue-700">
                  Total (All Categories)
                </td>
                <td className="py-3 px-3 text-right text-base text-slate-900">{grandTotal}</td>
                <td className="py-3 px-3 text-right text-emerald-600">{grandResolved}</td>
                <td className="py-3 px-3 text-right text-blue-600">{grandInProgress}</td>
                <td className="py-3 px-3 text-right text-rose-600">{grandEscalated}</td>
                <td className="py-3 px-3 text-right text-red-600">{grandCritical}</td>
                <td className="py-3 px-3 text-right text-amber-600">{grandBreached}</td>
                <td className="py-3 px-4 text-right text-slate-500">--</td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        /* Mode 2: Flat Recent Complaints List */
        <div className="overflow-x-auto max-h-[350px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="text-slate-600 text-[11px] font-medium bg-slate-50 border-b border-slate-200 sticky top-0">
                <th className="py-2.5 px-4">Tracking ID</th>
                <th className="py-2.5 px-4">Subject & Location</th>
                <th className="py-2.5 px-4">Category</th>
                <th className="py-2.5 px-4">Priority</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">SLA</th>
                <th className="py-2.5 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {complaints.slice(0, 15).map((item) => (
                <tr
                  key={item.id}
                  onClick={() => onInspectComplaint(item)}
                  className="hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <td className="py-2.5 px-4 font-mono font-medium text-blue-600">
                    {item.id}
                  </td>
                  <td className="py-2.5 px-4">
                    <p className="font-semibold text-slate-900 truncate">{item.title}</p>
                    <p className="text-[10px] text-slate-500">{item.location}</p>
                  </td>
                  <td className="py-2.5 px-4 text-slate-700">{item.category}</td>
                  <td className="py-2.5 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      {item.severity}
                    </span>
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      {item.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 font-mono text-[11px] text-slate-600">
                    {item.slaStatus}
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onInspectComplaint(item);
                      }}
                      className="p-1 text-slate-400 hover:text-blue-600 cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
