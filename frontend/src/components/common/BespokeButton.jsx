import React from 'react';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BespokeButton({ children, onClick, icon: Icon = ArrowRight, variant = 'primary', className = '' }) {
  const isPrimary = variant === 'primary';

  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`group relative inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-xs transition-all duration-300 ${
        isPrimary
          ? 'bg-gradient-to-r from-blue-600 via-blue-500 to-sky-400 text-white shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 hover:from-blue-500 hover:to-sky-300'
          : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 hover:border-slate-400 shadow-md'
      } ${className}`}
    >
      <span>{children}</span>
      {Icon && (
        <Icon className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
      )}
    </motion.button>
  );
}
