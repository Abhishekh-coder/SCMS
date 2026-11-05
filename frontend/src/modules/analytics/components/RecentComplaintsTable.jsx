import React from 'react';
import { 
  FileText, Eye, MoreHorizontal, ArrowRight 
} from 'lucide-react';

export default function RecentComplaintsTable({
  complaints = [],
  onInspectComplaint,
  onHoverComplaint,
  onViewAll
}) {
  const getPriorityBadge = (sev) => {
    switch (sev) {
      case 'Critical':
        return 'bg-red-950/60 text-red-400 border-red-800/60';
      case 'High':
        return 'bg-amber-950/60 text-amber-400 border-amber-800/60';
      case 'Medium':
        return 'bg-purple-950/60 text-purple-400 border-purple-800/60';
      default:
        return 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Resolved':
      case 'Closed':
        return 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60';
      case 'Escalated':
        return 'bg-rose-950/60 text-rose-400 border-rose-800/60';
      case 'In Progress':
        return 'bg-blue-950/60 text-blue-400 border-blue-800/60';
      default:
        return 'bg-slate-800/80 text-sky-400 border-sky-800/60';
    }
  };

  const getSlaBadge = (sla) => {
    switch (sla) {
      case 'Breached':
        return 'bg-rose-950/60 text-rose-400 border-rose-800/60';
      case 'Warning':
      case 'Approaching Breach':
        return 'bg-amber-950/60 text-amber-400 border-amber-800/60';
      default:
        return 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60';
    }
  };

  const getShortCategory = (cat) => {
    if (cat.includes('Infrastructure')) return 'Infrastructure';
    if (cat.includes('Hostel')) return 'Hostel & Living';
    if (cat.includes('IT & WiFi')) return 'IT & WiFi';
    if (cat.includes('Mess')) return 'Mess & Food';
    if (cat.includes('Transport')) return 'Transport';
    if (cat.includes('Security')) return 'Security & Safety';
    if (cat.includes('Academic')) return 'Academics';
    return cat.split(' ')[0];
  };

  // Show top 6-8 records matching mockup
  const displayRecords = complaints.slice(0, 8);

  return (
    <div className="bg-[#0d1322] rounded-2xl border border-slate-800/80 shadow-sm overflow-hidden select-none">
      
      {/* Table Header */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
            <FileText className="w-3.5 h-3.5" />
          </div>
          <h3 className="text-sm font-bold text-white tracking-tight">
            Recent Complaints
          </h3>
        </div>

        <button
          onClick={onViewAll}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-[#090d18] border border-slate-800 hover:border-slate-700 transition"
        >
          <span>View All</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Table Rows */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800/80 text-slate-400 text-[11px] font-medium">
              <th className="py-3 px-4">ID</th>
              <th className="py-3 px-4">Subject & Location</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Priority</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">SLA</th>
              <th className="py-3 px-4">Reported On</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {displayRecords.map((item) => {
              const formattedDate = new Date(item.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: '2-digit',
                year: 'numeric'
              });

              return (
                <tr
                  key={item.id}
                  onClick={() => onInspectComplaint(item)}
                  onMouseEnter={() => onHoverComplaint && onHoverComplaint(item.building)}
                  onMouseLeave={() => onHoverComplaint && onHoverComplaint(null)}
                  className="hover:bg-slate-800/30 cursor-pointer transition-colors group"
                >
                  {/* ID */}
                  <td className="py-3 px-4 font-mono font-medium text-cyan-400 whitespace-nowrap">
                    {item.id}
                  </td>

                  {/* Subject & Location */}
                  <td className="py-3 px-4 max-w-sm">
                    <p className="font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors truncate">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {item.location}
                    </p>
                  </td>

                  {/* Category */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-[#11192e] text-slate-300 border border-slate-800">
                      {getShortCategory(item.category)}
                    </span>
                  </td>

                  {/* Priority */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${getPriorityBadge(item.severity)}`}>
                      {item.severity}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${getStatusBadge(item.status)}`}>
                      {item.status}
                    </span>
                  </td>

                  {/* SLA */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${getSlaBadge(item.slaStatus)}`}>
                      {item.slaStatus === 'Approaching Breach' ? 'Warning' : item.slaStatus}
                    </span>
                  </td>

                  {/* Reported On */}
                  <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-slate-400">
                    {formattedDate}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2 text-slate-400">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onInspectComplaint(item);
                        }}
                        className="p-1 hover:text-cyan-400 hover:bg-slate-800 rounded transition"
                        title="View Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 hover:text-slate-200 hover:bg-slate-800 rounded transition"
                      >
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
