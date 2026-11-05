import React from 'react';
import { motion } from 'framer-motion';

/**
 * Unified complaint card used by every handler workspace.
 *
 * code        — complaint code (mono, tone-colored)
 * badge       — React node, usually <StatusBadge /> / <PriorityBadge />
 * meta        — secondary text next to the badge (category / dept / …)
 * student     — right-aligned meta (student name, created date, …)
 * title       — complaint title
 * description — complaint body
 * children    — action area (resolution editor, feedback, notices)
 * index       — list index, used for a soft staggered entrance
 */

const TONES = {
  indigo:   { accent: 'bg-blue-500', text: 'text-blue-600' },
  purple:   { accent: 'bg-purple-500', text: 'text-purple-600' },
  cyan:     { accent: 'bg-cyan-500',   text: 'text-cyan-600' },
  amber:    { accent: 'bg-amber-500',  text: 'text-amber-600' },
  emerald:  { accent: 'bg-emerald-500',text: 'text-emerald-600' },
};

export function TicketCard({
  code,
  tone = 'indigo',
  badge,
  meta,
  student,
  title,
  description,
  children,
  index = 0,
  className = '',
}) {
  const t = TONES[tone] || TONES.indigo;

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, transition: { delay: 0, duration: 0.2, ease: 'easeOut' } }}
      transition={{ delay: Math.min(index * 0.05, 0.35), duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={`group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 backdrop-blur-xl space-y-4
                  transition-colors duration-200 ease-out
                  hover:border-slate-300 hover:bg-white hover:shadow-xl hover:shadow-slate-200 ${className}`}
    >
      {/* Tone accent rail */}
      <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${t.accent} opacity-60 transition-opacity duration-200 group-hover:opacity-100`} />
      {/* Top sheen */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-100 to-transparent" />

      {/* Meta row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className={`font-mono text-xs font-bold ${t.text}`}>{code}</span>
          {badge}
          {meta && <span className="text-[11px] text-slate-500">{meta}</span>}
        </div>
        {student && <span className="text-xs text-slate-500 font-mono flex items-center gap-1.5">{student}</span>}
      </div>

      {/* Body */}
      <div>
        <h3 className="text-base font-bold text-slate-900 transition-colors duration-200">{title}</h3>
        <p className="text-xs text-slate-600 mt-1 leading-relaxed transition-colors duration-200 group-hover:text-slate-700">{description}</p>
      </div>

      {/* Actions */}
      {children}
    </motion.article>
  );
}

export default TicketCard;
