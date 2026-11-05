import React from 'react';

/**
 * Consistent page header used by every workspace.
 *
 * tone   — 'indigo' | 'purple' | 'cyan' | 'amber' | 'emerald' (per-workspace accent)
 * chip   — the role/workspace label pill
 * meta   — small secondary text next to the chip (login id, user name, …)
 * title  — the page headline
 * actions — optional right-aligned slot (e.g. the "Register Complaint" CTA)
 */

const TONES = {
  indigo: {
    chip:     'bg-blue-50 text-blue-700 border-blue-200',
    accent:   'text-blue-600',
    glow:     'bg-blue-300/40',
    gradient: 'from-blue-50',
  },
  purple: {
    chip:     'bg-purple-50 text-purple-700 border-purple-200',
    accent:   'text-purple-600',
    glow:     'bg-purple-300/40',
    gradient: 'from-purple-50',
  },
  cyan: {
    chip:     'bg-cyan-50 text-cyan-700 border-cyan-200',
    accent:   'text-cyan-600',
    glow:     'bg-cyan-300/40',
    gradient: 'from-cyan-50',
  },
  amber: {
    chip:     'bg-amber-50 text-amber-700 border-amber-200',
    accent:   'text-amber-600',
    glow:     'bg-amber-300/40',
    gradient: 'from-amber-50',
  },
  emerald: {
    chip:     'bg-emerald-50 text-emerald-700 border-emerald-200',
    accent:   'text-emerald-600',
    glow:     'bg-emerald-300/40',
    gradient: 'from-emerald-50',
  },
};

export function PageHeader({ chip, tone = 'indigo', icon: Icon, title, subtitle, meta, actions, className = '' }) {
  const t = TONES[tone] || TONES.indigo;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-r ${t.gradient} via-white to-white p-6 backdrop-blur-xl animate-fade-in-up ${className}`}
    >
      {/* Ambient tone glow */}
      <div className={`pointer-events-none absolute -top-24 -right-16 w-64 h-64 rounded-full blur-3xl ${t.glow} opacity-40`} />
      {/* Top sheen */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-200 to-transparent" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-full border ${t.chip}`}>
              {Icon && <Icon className={`w-3.5 h-3.5 ${t.accent}`} />}
              {chip}
            </span>
            {meta && <span className="text-xs text-slate-500">{meta}</span>}
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mt-3">{title}</h1>
          {subtitle && <p className="text-xs text-slate-500 mt-1.5 leading-relaxed max-w-2xl">{subtitle}</p>}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
    </div>
  );
}

export default PageHeader;
