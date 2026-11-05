import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle } from 'lucide-react';

/**
 * Shared async-state panels used by every dashboard (light theme):
 *  - LoadingState : spinner with a message
 *  - ErrorState   : inline error banner with optional Retry
 *  - EmptyPanel   : centered empty state with icon, title, description, action
 */

const TONES = {
  indigo:   { text: 'text-blue-600', box: 'bg-blue-50 border-blue-200' },
  purple:   { text: 'text-purple-600', box: 'bg-purple-50 border-purple-200' },
  cyan:     { text: 'text-cyan-600',   box: 'bg-cyan-50 border-cyan-200' },
  amber:    { text: 'text-amber-600',  box: 'bg-amber-50 border-amber-200' },
  emerald:  { text: 'text-emerald-600',box: 'bg-emerald-50 border-emerald-200' },
  slate:    { text: 'text-slate-500',  box: 'bg-slate-100 border-slate-200' },
};

const PANEL = 'rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-xl animate-fade-in-up';

export function LoadingState({ message = 'Loading…', tone = 'indigo' }) {
  const t = TONES[tone] || TONES.indigo;

  return (
    <div className={`${PANEL} p-12 text-center space-y-3`}>
      <div className={`w-10 h-10 mx-auto rounded-xl border ${t.box} ${t.text} flex items-center justify-center`}>
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
      <p className="text-xs text-slate-500 font-semibold">{message}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className={`${PANEL} p-5 flex items-center justify-between gap-3 text-xs text-red-700 border-red-200 bg-red-50`}>
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 shrink-0 rounded-lg bg-red-100 border border-red-200 text-red-600 flex items-center justify-center">
          <AlertCircle className="w-4 h-4" />
        </div>
        <span className="leading-relaxed">{message}</span>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="shrink-0 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-700 font-semibold transition-colors cursor-pointer"
        >
          Retry
        </button>
      )}
    </div>
  );
}

export function EmptyPanel({ icon: Icon, tone = 'indigo', title, description, action }) {
  const t = TONES[tone] || TONES.indigo;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={`${PANEL} p-12 text-center space-y-4 max-w-md mx-auto`}
    >
      <div className={`w-16 h-16 rounded-2xl border ${t.box} ${t.text} flex items-center justify-center mx-auto`}>
        {Icon && <Icon className="w-8 h-8" />}
      </div>
      <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      {description && <p className="text-xs text-slate-500 leading-relaxed">{description}</p>}
      {action && <div className="pt-1">{action}</div>}
    </motion.div>
  );
}

export default LoadingState;
