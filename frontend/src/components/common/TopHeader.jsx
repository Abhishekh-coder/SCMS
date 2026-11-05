import React, { useState, useEffect } from 'react';
import { Building2, Bell, LogOut, X, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTenant } from '../../config/TenantContext';
import apiClient from '../../core/api/apiClient';

export default function TopHeader({ currentUser = { fullName: 'User', role: 'STUDENT' }, onLogout }) {
  const { tenantConfig } = useTenant();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);

  useEffect(() => {
    if (showNotifications) {
      setNotifLoading(true);
      apiClient.get('/notifications')
        .then(res => {
          if (res.success && Array.isArray(res.data)) {
            setNotifications(res.data.slice(0, 10));
          } else {
            setNotifications([]);
          }
        })
        .catch(() => setNotifications([]))
        .finally(() => setNotifLoading(false));
    }
  }, [showNotifications]);

  const fullName = currentUser.fullName || 'User';
  const primaryRole = currentUser.roles?.[0] || currentUser.role || 'STUDENT';
  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'U';

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/70 border-b border-slate-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3">
        
        {/* Dynamic Tenant Branding */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-blue-500 to-sky-400 flex items-center justify-center shadow-lg shadow-blue-500/20 transition-shadow hover:shadow-blue-500/30">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-extrabold text-lg tracking-tight gradient-text">
                {tenantConfig.collegeShortCode} CCMS
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-200 rounded-full">
                v2.0 Enterprise
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">{tenantConfig.collegeName}</p>
          </div>
        </div>

        {/* Right User Bar */}
        <div className="flex items-center gap-3">
          
          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => { setShowNotifications(!showNotifications); setShowProfileMenu(false); }}
              className="relative p-2.5 rounded-xl bg-slate-100 border border-slate-200 hover:bg-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 transition-all duration-150"
            >
              <Bell className="w-4 h-4" />
              {notifications.length > 0 && !showNotifications && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-500 ring-[3px] ring-white" />
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.96 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute right-0 mt-3 w-80 md:w-96 glass-panel bg-white/95 p-4 shadow-glass-lg border border-slate-200 rounded-2xl z-50"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                        <Bell className="w-3.5 h-3.5 text-blue-600" />
                      </div>
                      <h4 className="font-display font-bold text-sm text-slate-900">Notifications</h4>
                    </div>
                    <button 
                      onClick={() => setShowNotifications(false)} 
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mt-3 space-y-1.5 max-h-80 overflow-y-auto">
                    {notifLoading ? (
                      <p className="text-xs text-slate-500 text-center py-6">Loading notifications…</p>
                    ) : notifications.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-6">No notifications yet.</p>
                    ) : (
                      notifications.map((n, i) => (
                        <motion.div
                          key={n.notificationUuid || n._id || i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 hover:border-slate-200 transition-all duration-150 cursor-pointer"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 bg-blue-500" />
                              <h5 className="font-semibold text-xs text-slate-800">{n.title || 'Notification'}</h5>
                            </div>
                            <span className="text-[10px] text-slate-400 shrink-0">
                              {n.createdAt ? new Date(n.createdAt).toLocaleDateString() : ''}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1 ml-3.5 leading-relaxed">{n.message || n.body || ''}</p>
                        </motion.div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Profile Menu */}
          <div className="relative">
            <button
              onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifications(false); }}
              className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all duration-150"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-sky-400 flex items-center justify-center text-white font-bold text-[10px] shadow-md shadow-blue-500/20">
                {initials}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-slate-800 leading-tight">{fullName}</p>
                <p className="text-[10px] text-slate-500 font-medium">{primaryRole} Workspace</p>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${showProfileMenu ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {showProfileMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.96 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute right-0 mt-2 w-52 glass-panel bg-white/95 p-1.5 shadow-glass-lg border border-slate-200 rounded-2xl z-50"
                >
                  <div className="px-3 py-2 mb-1 space-y-1">
                    <p className="text-xs font-bold text-slate-900">{fullName}</p>
                    <p className="text-[10px] text-slate-500 truncate">{currentUser.email || `${primaryRole} Workspace`}</p>
                    {Array.isArray(currentUser.roles) && currentUser.roles.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {currentUser.roles.map(r => (
                          <span
                            key={r}
                            className="px-1.5 py-0.5 rounded-md bg-blue-50 border border-blue-100 text-[9px] font-bold text-blue-600"
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="h-px bg-slate-100 mx-2 my-1" />
                  <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 transition-all duration-150"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </header>
  );
}
