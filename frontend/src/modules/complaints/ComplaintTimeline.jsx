import React from 'react';
import { CheckCircle2, Clock, ArrowRight, CornerDownRight, MessageSquare, AlertCircle } from 'lucide-react';

export default function ComplaintTimeline({ eventLedger = [] }) {
  if (!eventLedger || eventLedger.length === 0) {
    return <p className="text-xs text-slate-400 italic">No history events recorded yet.</p>;
  }

  const getEventIcon = (eventType) => {
    if (eventType.includes('SUBMITTED')) return <Clock className="w-4 h-4 text-blue-500" />;
    if (eventType.includes('FORWARDED')) return <ArrowRight className="w-4 h-4 text-indigo-500" />;
    if (eventType.includes('ESCALATED')) return <AlertCircle className="w-4 h-4 text-red-500" />;
    if (eventType.includes('RESOLVED')) return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    if (eventType.includes('COMMENT')) return <MessageSquare className="w-4 h-4 text-slate-500" />;
    return <CornerDownRight className="w-4 h-4 text-slate-400" />;
  };

  const cleanUIString = (str) => {
    if (!str) return '';
    return String(str)
      .replace(/\s*\([A-Z0-9_\- ]+\)/gi, '')
      .replace(/_/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  return (
    <div className="space-y-4">
      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Complaint Timeline & Audit Trail</h4>
      <div className="relative border-l-2 border-slate-100 ml-3 pl-5 space-y-5">
        {eventLedger.map((evt, idx) => (
          <div key={evt.ledgerUuid || idx} className="relative">
            <div className="absolute -left-[27px] top-0.5 w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm">
              {getEventIcon(evt.eventType)}
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">{cleanUIString(evt.eventType.replace('COMPLAINT_', ''))}</span>
                <span className="text-slate-400">{new Date(evt.timestamp).toLocaleString()}</span>
              </div>
              <p className="text-xs text-slate-600">
                By: <strong className="text-slate-800">{cleanUIString(evt.actorName || evt.actorUuid)}</strong>
              </p>
              {evt.note && (
                <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-1.5 leading-relaxed">
                  {cleanUIString(evt.note)}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
