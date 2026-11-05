import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, ChevronRight, Eye, 
  ArrowUpDown, AlertOctagon 
} from 'lucide-react';

export default function InteractiveDrilldownTable({
  complaints,
  onInspectComplaint,
  onToggleFilter,
  filters
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const pageSize = 10;

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  const sortedComplaints = useMemo(() => {
    return [...complaints].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === 'createdAt') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [complaints, sortField, sortDirection]);

  const totalPages = Math.ceil(sortedComplaints.length / pageSize) || 1;
  const paginatedComplaints = sortedComplaints.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case 'Critical':
        return 'bg-rose-950/60 text-rose-300 border-rose-800/50';
      case 'High':
        return 'bg-orange-950/60 text-orange-300 border-orange-800/50';
      case 'Medium':
        return 'bg-amber-950/60 text-amber-300 border-amber-800/50';
      default:
        return 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Resolved':
      case 'Closed':
        return 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50';
      case 'Escalated':
        return 'bg-rose-950/60 text-rose-300 border-rose-800/50';
      case 'In Progress':
        return 'bg-amber-950/60 text-amber-300 border-amber-800/50';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="bg-[#0f1523] rounded-2xl border border-slate-800 shadow-sm overflow-hidden mb-6">
      
      {/* Table Header Controls */}
      <div className="p-4 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-900/40">
        <div>
          <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <span>Filtered Complaint Records</span>
            <span className="text-xs font-mono font-medium bg-slate-800 text-cyan-400 px-2 py-0.5 rounded-full">
              {complaints.length} records
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Click any row to inspect case details and audit log
          </p>
        </div>

        {/* Pagination */}
        <div className="flex items-center gap-2 self-end sm:self-auto text-xs">
          <span className="text-slate-400 font-mono">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded-lg border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded-lg border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 uppercase tracking-wider text-[10px] font-medium">
              <th 
                className="py-3 px-4 cursor-pointer hover:text-slate-200 transition"
                onClick={() => handleSort('id')}
              >
                <div className="flex items-center gap-1">
                  <span>Tracking ID</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4">Subject & Location</th>
              <th className="py-3 px-4">Category</th>
              <th 
                className="py-3 px-4 cursor-pointer hover:text-slate-200 transition"
                onClick={() => handleSort('severity')}
              >
                <div className="flex items-center gap-1">
                  <span>Severity</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th 
                className="py-3 px-4 cursor-pointer hover:text-slate-200 transition"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center gap-1">
                  <span>Status</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4">SLA State</th>
              <th className="py-3 px-4 text-right">Inspect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {paginatedComplaints.length > 0 ? (
              paginatedComplaints.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => onInspectComplaint(item)}
                  className="hover:bg-slate-800/40 cursor-pointer transition-colors group"
                >
                  <td className="py-3 px-4 font-mono font-medium text-cyan-400 whitespace-nowrap">
                    {item.id}
                  </td>
                  <td className="py-3 px-4 max-w-xs">
                    <p className="font-medium text-slate-200 truncate group-hover:text-cyan-300 transition-colors">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {item.location}
                    </p>
                  </td>
                  <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                    {item.category}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${getSeverityBadge(item.severity)}`}>
                      {item.severity}
                    </span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${getStatusBadge(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    {item.slaStatus === 'Breached' ? (
                      <span className="text-rose-400 flex items-center gap-1 text-[11px] font-medium">
                        <AlertOctagon className="w-3 h-3" /> Breached
                      </span>
                    ) : item.slaStatus === 'Approaching Breach' ? (
                      <span className="text-amber-400 text-[11px] font-medium">
                        Warning
                      </span>
                    ) : (
                      <span className="text-emerald-400 text-[11px] font-medium">
                        Within SLA
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onInspectComplaint(item);
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition"
                      title="Inspect full case details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-10 text-center text-slate-400">
                  No complaints match the selected filter criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
