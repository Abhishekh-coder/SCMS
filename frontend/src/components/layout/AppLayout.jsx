import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  FileText, 
  Bell, 
  User, 
  Inbox, 
  AlertCircle, 
  Users, 
  Building2, 
  BarChart3, 
  TrendingUp, 
  Building, 
  AlertTriangle, 
  PieChart, 
  ShieldAlert, 
  FileSpreadsheet, 
  Settings, 
  Activity,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import TopHeader from '../common/TopHeader';
import AmbientBackground from '../common/AmbientBackground';
import { useAuthStore } from '../../app/store/authStore';

const MENU_CONFIG = {
  STUDENT: [
    { key: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'REGISTER_COMPLAINT', label: 'Register Complaint', icon: PlusCircle },
    { key: 'MY_COMPLAINTS', label: 'My Complaints', icon: FileText },
    { key: 'NOTIFICATIONS', label: 'Notifications', icon: Bell },
    { key: 'PROFILE', label: 'My Profile', icon: User }
  ],
  FACULTY: [
    { key: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'ASSIGNED_COMPLAINTS', label: 'Assigned Complaints', icon: Inbox },
    { key: 'NOTIFICATIONS', label: 'Notifications', icon: Bell },
    { key: 'PROFILE', label: 'My Profile', icon: User }
  ],
  TEACHER_GUARDIAN: [
    { key: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'ESCALATED_COMPLAINTS', label: 'Escalated Complaints', icon: AlertCircle },
    { key: 'STUDENT_HISTORY', label: 'Student History', icon: Users },
    { key: 'PROFILE', label: 'My Profile', icon: User }
  ],
  HOD: [
    { key: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'DEPT_COMPLAINTS', label: 'Department Complaints', icon: Building2 },
    { key: 'FACULTY_PERFORMANCE', label: 'Faculty Performance', icon: BarChart3 },
    { key: 'ANALYTICS', label: 'Analytics', icon: TrendingUp },
    { key: 'PROFILE', label: 'My Profile', icon: User }
  ],
  DEAN: [
    { key: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'CROSS_DEPT', label: 'Cross Department', icon: Building },
    { key: 'ESCALATED_CASES', label: 'Escalated Cases', icon: AlertTriangle },
    { key: 'ANALYTICS', label: 'Analytics', icon: TrendingUp },
    { key: 'PROFILE', label: 'My Profile', icon: User }
  ],
  PRINCIPAL: [
    { key: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'CAMPUS_ANALYTICS', label: 'Campus Analytics', icon: PieChart },
    { key: 'FINAL_ESCALATIONS', label: 'Final Escalations', icon: ShieldAlert },
    { key: 'REPORTS', label: 'Reports', icon: FileSpreadsheet },
    { key: 'SETTINGS', label: 'Settings', icon: Settings }
  ],
  ADMIN: [
    { key: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'GOVERNANCE', label: 'Master Governance', icon: ShieldAlert },
    { key: 'AUDIT', label: 'System Audit', icon: Activity },
    { key: 'SETTINGS', label: 'Settings', icon: Settings }
  ],
  SUPER_ADMIN: [
    { key: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'GOVERNANCE', label: 'Master Governance', icon: ShieldAlert },
    { key: 'AUDIT', label: 'System Audit', icon: Activity },
    { key: 'SETTINGS', label: 'Settings', icon: Settings }
  ]
};

export default function AppLayout({ children, activeNav, onNavChange }) {
  const { user, activeRole, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  const primaryRole = activeRole || (user?.roles && user.roles[0]) || 'STUDENT';
  const navItems = MENU_CONFIG[primaryRole] || MENU_CONFIG.STUDENT;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans relative selection:bg-blue-500/30 selection:text-slate-900 flex flex-col">
      <AmbientBackground />

      {/* Top Header */}
      <TopHeader
        currentUser={user || { fullName: 'User', roles: ['STUDENT'] }}
        onLogout={logout}
      />

      <div className="flex flex-1 relative z-10 max-w-7xl w-full mx-auto">
        
        {/* Role-Based Dynamic Sidebar Navigation */}
        <aside className={`transition-all duration-300 border-r border-slate-200 bg-white/70 backdrop-blur-xl p-4 flex flex-col justify-between ${
          collapsed ? 'w-16' : 'w-64'
        }`}>
          <div className="space-y-2">
            <div className="px-3 py-1 mb-2">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider font-mono">
                {!collapsed && `${primaryRole} WORKSPACE`}
              </span>
            </div>
            {navItems.map(item => (
              <button
                key={item.key}
                onClick={() => onNavChange && onNavChange(item.key)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                  activeNav === item.key
                    ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm shadow-blue-500/10'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
              >
                <item.icon className="w-4 h-4 shrink-0 text-blue-500" />
                {!collapsed && <span>{item.label}</span>}
              </button>
            ))}
          </div>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors mt-auto"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </aside>

        {/* Main Content View */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
