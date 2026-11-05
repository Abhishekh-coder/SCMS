import React from 'react';
import StatusBadge from '../../components/ui/StatusBadge';
import { Eye, Clock } from 'lucide-react';

const formatDivision = (div) => {
  if (!div) return '—';
  return div.replace(/^2024-/, '');
};

export default function ComplaintTable({ 
  complaints = [], 
  onSelectComplaint, 
  loading = false, 
  showDivision = false 
}) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-500 text-xs font-medium shadow-xs">
        Loading complaint records...
      </div>
    );
  }

  if (!complaints || complaints.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center space-y-2 shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 border border-slate-200 flex items-center justify-center mx-auto">
          <Clock className="w-6 h-6" />
        </div>
        <p className="text-sm font-bold text-slate-800">No Complaints Found</p>
        <p className="text-xs text-slate-500">There are no complaint records matching this scope or active filter.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <th className="py-3.5 px-4">ID Code</th>
              {showDivision && <th className="py-3.5 px-4">Division</th>}
              <th className="py-3.5 px-4">Subject</th>
              <th className="py-3.5 px-4">Category / Dept</th>
              <th className="py-3.5 px-4">Priority</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {complaints.map((item) => (
              <tr 
                key={item.complaintUuid || item._id} 
                className="hover:bg-slate-50/80 transition-colors"
              >
                <td className="py-3.5 px-4 font-mono font-semibold text-blue-600">
                  {item.complaintCode || item.complaintUuid?.slice(0, 8)}
                </td>
                {showDivision && (
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono">
                      {formatDivision(item.divisionCode)}
                    </span>
                  </td>
                )}
                <td className="py-3.5 px-4 font-medium text-slate-900 max-w-xs truncate">
                  {item.title}
                </td>
                <td className="py-3.5 px-4 text-slate-500">
                  <span className="font-semibold text-slate-700">{item.categoryCode}</span>
                  {item.departmentCode && <span className="ml-1 text-slate-400">• {item.departmentCode}</span>}
                </td>
                <td className="py-3.5 px-4">
                  <span className={`px-2 py-0.5 rounded font-bold text-[11px] border ${
                    item.priority === 'HIGH' || item.priority === 'URGENT' || item.priority === 'CRITICAL'
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : item.priority === 'MEDIUM'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}>
                    {item.priority || 'MEDIUM'}
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  <StatusBadge status={item.status} />
                </td>
                <td className="py-3.5 px-4 text-right">
                  <button
                    type="button"
                    onClick={() => onSelectComplaint && onSelectComplaint(item)}
                    className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-800 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
