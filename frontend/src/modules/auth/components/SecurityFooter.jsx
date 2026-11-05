import React from 'react';
import { Mail, Building2 } from 'lucide-react';

export default function SecurityFooter() {
  return (
    <footer className="pt-6 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500">
      <div className="flex items-center gap-2">
        <Mail className="w-4 h-4 text-blue-500" />
        <span>helpdesk@college.edu</span>
      </div>
      <div className="flex items-center gap-2">
        <Building2 className="w-4 h-4 text-slate-400" />
        <span>Central IT Cell</span>
      </div>
    </footer>
  );
}
