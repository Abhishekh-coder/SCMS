import React from 'react';

export function Badge({
  children,
  variant = 'default', // 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple'
  size = 'md', // 'sm' | 'md'
  className = '',
  ...props
}) {
  const variants = {
    default: "bg-slate-100 text-slate-600 border-slate-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    danger: "bg-red-50 text-red-700 border-red-200",
    info: "bg-blue-50 text-blue-700 border-blue-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200"
  };

  const sizes = {
    sm: "px-2 py-0.5 text-[10px] tracking-wide",
    md: "px-2.5 py-1 text-xs tracking-wide"
  };

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full border ${variants[variant] || variants.default} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}

export default Badge;
