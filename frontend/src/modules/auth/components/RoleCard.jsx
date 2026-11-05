import React from 'react';
import { GraduationCap, Users, UserPlus, ArrowRight } from 'lucide-react';

export default function RoleCard({ type, title, subtitle, onClick }) {
  const icons = {
    student: <GraduationCap className="w-5 h-5 text-blue-600" />,
    faculty: <Users className="w-5 h-5 text-blue-600" />,
    register: <UserPlus className="w-5 h-5 text-blue-600" />
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full flex items-center gap-4 rounded-2xl bg-white px-5 py-4 border border-slate-100/80 shadow-[0_4px_18px_rgba(15,23,42,0.04)] hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(15,23,42,0.07)] transition-all duration-200 text-left cursor-pointer"
    >
      <div className="w-12 h-12 rounded-full bg-blue-50/80 shrink-0 flex items-center justify-center">
        {icons[type] || <GraduationCap className="w-5 h-5 text-blue-600" />}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-900 text-base leading-tight">
          {title}
        </p>
        <p className="text-xs text-slate-500 mt-1 leading-normal">
          {subtitle}
        </p>
      </div>

      <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0" />
    </button>
  );
}
