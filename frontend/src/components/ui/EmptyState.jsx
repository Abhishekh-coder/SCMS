import React from 'react';
import { Button } from './Button';

export function EmptyState({
  title = "No data found",
  description = "There are no records to display at this moment.",
  actionLabel,
  onAction,
  icon: Icon,
  className = ""
}) {
  return (
    <div className={`glass-card p-10 flex flex-col items-center justify-center text-center max-w-md mx-auto my-6 ${className}`}>
      <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-4 border border-blue-100 shadow-inner">
        {Icon ? <Icon className="w-7 h-7" /> : (
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        )}
      </div>

      <h3 className="text-base font-semibold text-slate-900 tracking-tight mb-1">{title}</h3>
      <p className="text-xs text-slate-500 max-w-xs mb-5 leading-relaxed">{description}</p>

      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export default EmptyState;
