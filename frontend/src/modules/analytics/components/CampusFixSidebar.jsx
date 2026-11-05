import React from 'react';
import { 
  LayoutDashboard, FileText, BarChart3, Map, 
  Building2, MapPin, ClipboardList, Settings 
} from 'lucide-react';

export default function CampusFixSidebar({
  activeNav = 'Dashboard',
  onSelectNav
}) {
  const navItems = [
    { id: 'Dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'Complaints', label: 'Complaints', icon: FileText },
    { id: 'Analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'Campus Map', label: 'Campus Map', icon: Map },
    { id: 'Departments', label: 'Departments', icon: Building2 },
    { id: 'Locations', label: 'Locations', icon: MapPin },
    { id: 'Reports', label: 'Reports', icon: ClipboardList },
  ];

  return (
    <aside className="w-60 bg-[#080d19] border-r border-slate-800/80 flex flex-col justify-between shrink-0 select-none">
      <div>
        {/* Brand Header */}
        <div className="p-5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center shadow-lg shadow-blue-500/10">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight leading-none">
              CampusFix
            </h1>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              Complaint Intelligence
            </p>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="px-3 py-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectNav && onSelectNav(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                  isActive
                    ? 'bg-blue-600/10 text-blue-400 border border-blue-500/30 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Settings */}
      <div className="p-3 border-t border-slate-800/80">
        <button
          onClick={() => onSelectNav && onSelectNav('Settings')}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-all text-left"
        >
          <Settings className="w-4 h-4 text-slate-400" />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
}
