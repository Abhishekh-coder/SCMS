import React from 'react';
import { 
  Inbox, CheckCircle2, AlertOctagon, Clock, 
  ShieldAlert, Star 
} from 'lucide-react';

export default function InteractiveKpiRibbon({
  kpis,
  filters,
  onToggleFilter
}) {
  const {
    total,
    resolved,
    resolutionRate,
    slaBreached,
    slaBreachRate,
    avgHours,
    criticalCount,
    escalatedCount,
    csatAvg
  } = kpis;

  const isResolvedActive = filters.status === 'Resolved';
  const isBreachActive = filters.slaStatus === 'Breached';
  const isCriticalActive = filters.severity === 'Critical';

  const cards = [
    {
      id: 'total',
      label: 'TOTAL TICKETS',
      value: total,
      subValue: 'All departments',
      icon: Inbox,
      iconColor: 'text-cyan-400',
      active: false,
      onClick: () => onToggleFilter('status', null)
    },
    {
      id: 'resolution',
      label: 'RESOLUTION',
      value: `${resolutionRate}%`,
      subValue: `${resolved} resolved`,
      icon: CheckCircle2,
      iconColor: 'text-emerald-400',
      active: isResolvedActive,
      onClick: () => onToggleFilter('status', isResolvedActive ? null : 'Resolved')
    },
    {
      id: 'sla',
      label: 'SLA BREACHES',
      value: slaBreached,
      subValue: `${slaBreachRate}% breach rate`,
      icon: AlertOctagon,
      iconColor: 'text-rose-400',
      active: isBreachActive,
      onClick: () => onToggleFilter('slaStatus', isBreachActive ? null : 'Breached')
    },
    {
      id: 'mttr',
      label: 'AVG MTTR',
      value: `${avgHours}h`,
      subValue: 'Turnaround time',
      icon: Clock,
      iconColor: 'text-indigo-400',
      active: false,
      onClick: null
    },
    {
      id: 'critical',
      label: 'CRITICAL ISSUES',
      value: criticalCount,
      subValue: `${escalatedCount} escalated`,
      icon: ShieldAlert,
      iconColor: 'text-rose-400',
      active: isCriticalActive,
      onClick: () => onToggleFilter('severity', isCriticalActive ? null : 'Critical')
    },
    {
      id: 'csat',
      label: 'CSAT SCORE',
      value: `${csatAvg} / 5`,
      subValue: 'Student rating',
      icon: Star,
      iconColor: 'text-amber-400',
      active: false,
      onClick: null
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {cards.map((card) => {
        const Icon = card.icon;
        const isClickable = Boolean(card.onClick);

        return (
          <div
            key={card.id}
            onClick={card.onClick || undefined}
            className={`bg-[#0f1523] rounded-2xl p-4 border transition-all ${
              card.active
                ? 'border-cyan-500/80 bg-cyan-950/20 ring-1 ring-cyan-500/40 shadow-sm'
                : 'border-slate-800 hover:border-slate-700'
            } ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold tracking-wider text-slate-400 whitespace-nowrap">
                {card.label}
              </span>
              <Icon className={`w-3.5 h-3.5 ${card.iconColor} shrink-0`} />
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-100 tracking-tight font-mono">
                {card.value}
              </span>
            </div>

            <p className="text-[11px] text-slate-400 mt-1">
              {card.subValue}
            </p>
          </div>
        );
      })}
    </div>
  );
}
