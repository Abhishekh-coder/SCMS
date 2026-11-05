import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  Bell, 
  User, 
  LogOut, 
  Menu, 
  X, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';
import { useAuthStore } from '../app/store/authStore';
import apiClient from '../core/api/apiClient';
import { getNavigationSectionsForUser } from '../config/navigationConfig';

export default function DashboardLayout({ children, activeNav = 'DASHBOARD', onNavChange, user }) {
  const navigate = useNavigate();
  const { logout, activeRole } = useAuthStore();
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const role = user?.primaryRole || (user?.roles && user?.roles[0]) || activeRole || 'STUDENT';
  const fullName = user?.fullName || 'User Account';
  const deptCode = user?.departmentCode || '';
  const divCode = user?.divisionCode || '';

  // Fetch unread notifications count
  useEffect(() => {
    let isMounted = true;
    const fetchUnread = async () => {
      try {
        const res = await apiClient.get('/notifications/unread-count');
        if (isMounted && res?.data?.unreadCount !== undefined) {
          setUnreadCount(res.data.unreadCount);
        }
      } catch (e) {
        // Silent catch for background unread count
      }
    };

    fetchUnread();
    const timer = setInterval(fetchUnread, 30000);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, []);

  // Format scope tag: e.g. "HOD • IT" or "STUDENT • IT-A"
  const scopeTag = role === 'STUDENT'
    ? `STUDENT • ${divCode || deptCode || 'CAMPUS'}`
    : role === 'CLASS_INCHARGE'
    ? `CLASS INCHARGE • ${divCode || deptCode}`
    : role === 'TEACHER_GUARDIAN'
    ? `TEACHER GUARDIAN • ${divCode || deptCode}`
    : role === 'HOD'
    ? `HOD • ${deptCode} DEPT`
    : role === 'DEAN'
    ? `DEAN • ACADEMICS`
    : role === 'PRINCIPAL'
    ? `PRINCIPAL`
    : role === 'CAMPUS_SERVICES_HEAD'
    ? `CAMPUS SERVICES HEAD`
    : `${role} • ${deptCode || 'CAMPUS'}`;

  // Centralized, permission-driven role navigation sections
  const navSections = getNavigationSectionsForUser(user, role, unreadCount);

  const handleNavClick = (key) => {
    setMobileMenuOpen(false);
    if (onNavChange) onNavChange(key);
  };

  const handleLogout = () => {
    if (logout) logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#F7FAFE] font-sans antialiased text-slate-800 flex flex-col selection:bg-blue-100 selection:text-blue-900">
      
      {/* ── TOPBAR ── */}
      <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 shadow-xs">
        
        {/* Left: Mobile Menu Trigger + Brand */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(prev => !prev)}
            className="md:hidden p-2 rounded-xl bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 transition cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <button 
            type="button" 
            onClick={() => handleNavClick('DASHBOARD')}
            className="flex items-center gap-2.5 text-left cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs group-hover:bg-blue-700 transition">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight text-slate-900 flex items-center gap-1.5">
                CampusFix
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                  {deptCode || 'HQ'}
                </span>
              </span>
              <span className="text-[10px] text-slate-400 block font-medium">Enterprise Campus Management</span>
            </div>
          </button>
        </div>

        {/* Right: Notifications Quick Bell + User Profile Badge + Logout */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Notifications Quick Icon */}
          <button
            type="button"
            onClick={() => handleNavClick('NOTIFICATIONS')}
            className="relative p-2 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white animate-pulse" />
            )}
          </button>

          {/* User Profile Pill */}
          <button
            type="button"
            onClick={() => handleNavClick('PROFILE_PREFERENCES')}
            className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
              {fullName.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-slate-900 leading-tight max-w-[120px] truncate">{fullName}</p>
              <span className="text-[10px] text-blue-600 font-semibold block">{scopeTag}</span>
            </div>
          </button>

          {/* Logout Button */}
          <button
            type="button"
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-red-600 rounded-xl hover:bg-red-50 border border-transparent hover:border-red-200 transition cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ── BODY GRID ── */}
      <div className="flex-1 flex min-w-0">
        
        {/* DESKTOP SIDEBAR NAVIGATION */}
        <aside 
          className={`bg-white border-r border-slate-200 p-3 hidden md:flex flex-col justify-between shrink-0 transition-all duration-300 ${
            sidebarCollapsed ? 'w-18' : 'w-64'
          }`}
        >
          <div className="space-y-4">
            
            {/* Collapse / Expand Toggle Button */}
            <div className="flex items-center justify-between px-2 pt-1">
              {!sidebarCollapsed && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Navigation
                </span>
              )}
              <button
                type="button"
                onClick={() => setSidebarCollapsed(prev => !prev)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer ml-auto"
                title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            </div>

            {/* Semantic Role Navigation Sections */}
            {navSections.map((section, sIdx) => (
              <div key={section.heading || sIdx} className={`space-y-1 ${sIdx > 0 ? 'pt-2.5 border-t border-slate-100' : ''}`}>
                {!sidebarCollapsed && (
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-1.5">
                    {section.heading}
                  </p>
                )}
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeNav === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => handleNavClick(item.key)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        isActive
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : item.isAction
                          ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 hover:border-blue-300'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-transparent'
                      }`}
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : item.isAction ? 'text-blue-600' : 'text-slate-500'}`} />
                        {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                      </div>
                      {!sidebarCollapsed && item.badge > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-blue-600 text-white">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}

          </div>

          {/* Bottom Callout */}
          {!sidebarCollapsed && (
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1 mt-4">
              <p className="font-bold text-slate-800">Campus Helpdesk</p>
              <p className="text-[11px] text-slate-500">support@campusfix.edu</p>
            </div>
          )}
        </aside>

        {/* ── RESPONSIVE MOBILE DRAWER MENU ── */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden bg-slate-900/30 backdrop-blur-xs flex">
            <div className="w-72 bg-white border-r border-slate-200 p-5 flex flex-col justify-between shadow-xl overflow-y-auto">
              <div className="space-y-4">
                
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-blue-600" />
                    <span className="font-bold text-sm text-slate-900">CampusFix Menu</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {navSections.map((section, sIdx) => (
                  <div key={section.heading || sIdx} className={`space-y-1 ${sIdx > 0 ? 'pt-2.5 border-t border-slate-100' : ''}`}>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-1">
                      {section.heading}
                    </p>
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeNav === item.key;
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => handleNavClick(item.key)}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                            isActive
                              ? 'bg-blue-600 text-white shadow-xs'
                              : item.isAction
                              ? 'bg-blue-50 text-blue-700 font-bold'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="w-4 h-4" />
                            <span>{item.label}</span>
                          </div>
                          {item.badge > 0 && (
                            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-blue-600 text-white">
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}

              </div>

              <div className="pt-4 border-t border-slate-200 mt-4">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-red-50 border border-red-200 text-xs font-bold text-red-600 hover:bg-red-100"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>

            </div>
            
            {/* Backdrop click to dismiss */}
            <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
          </div>
        )}

        {/* MAIN CONTENT CANVAS */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto min-w-0 max-w-full">
          {children}
        </main>

      </div>

    </div>
  );
}
