import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export default function PrimaryButton({ children, onClick, icon: Icon = ArrowRight, size = 'md', className = '' }) {
  const sizes = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-5 py-3 text-sm',
    lg: 'px-7 py-4 text-sm',
  };

  return (
    <motion.button
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`btn-primary ${sizes[size]} ${className}`}
    >
      <span>{children}</span>
      {Icon && (
        <Icon className="w-4 h-4 transition-transform duration-120 group-hover:translate-x-0.5" />
      )}
    </motion.button>
  );
}
