import React from 'react';

export function Card({
  children,
  className = '',
  hoverable = false,
  ...props
}) {
  return (
    <div
      className={`glass-card p-5 ${hoverable ? 'hover:-translate-y-0.5 hover:shadow-lg hover:border-slate-300 cursor-pointer' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={`flex items-center justify-between mb-4 ${className}`}>
      <div>
        {title && <h3 className="text-base font-semibold text-slate-900 tracking-tight">{title}</h3>}
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function CardBody({ children, className = '' }) {
  return <div className={className}>{children}</div>;
}

export function CardFooter({ children, className = '' }) {
  return <div className={`mt-4 pt-3 border-t border-slate-200 flex items-center justify-between ${className}`}>{children}</div>;
}

export default Card;
