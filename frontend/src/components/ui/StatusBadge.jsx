import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ArrowRight, 
  RotateCcw, 
  ShieldAlert, 
  CheckCheck 
} from 'lucide-react';

const STATUS_CONFIG = {
  SUBMITTED:   { label: 'Submitted',   bg: 'bg-slate-100',   text: 'text-slate-700',   border: 'border-slate-200',   icon: Clock },
  ASSIGNED:    { label: 'Assigned',    bg: 'bg-blue-50',     text: 'text-blue-700',    border: 'border-blue-200',    icon: ArrowRight },
  IN_PROGRESS: { label: 'In Progress', bg: 'bg-amber-50',    text: 'text-amber-800',   border: 'border-amber-200',   icon: Clock },
  FORWARDED:   { label: 'Forwarded',   bg: 'bg-indigo-50',   text: 'text-indigo-700',  border: 'border-indigo-200',  icon: ArrowRight },
  ESCALATED:   { label: 'Escalated',   bg: 'bg-red-50',      text: 'text-red-700',     border: 'border-red-200',     icon: ShieldAlert },
  RESOLVED:    { label: 'Resolved',    bg: 'bg-emerald-50',  text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle2 },
  CLOSED:      { label: 'Closed',      bg: 'bg-slate-100',   text: 'text-slate-600',   border: 'border-slate-200',   icon: CheckCheck },
  REOPENED:    { label: 'Reopened',    bg: 'bg-purple-50',   text: 'text-purple-700',  border: 'border-purple-200',  icon: RotateCcw },
};

export default function StatusBadge({ status = '' }) {
  const normalized = status.toUpperCase().trim();
  const cfg = STATUS_CONFIG[normalized] || {
    label: status || 'Unknown',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    icon: AlertCircle
  };

  const Icon = cfg.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <Icon className="w-3 h-3 shrink-0" aria-hidden="true" />
      <span>{cfg.label}</span>
    </span>
  );
}
