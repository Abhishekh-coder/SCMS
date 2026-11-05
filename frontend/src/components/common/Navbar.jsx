import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Bell, 
  User, 
  Sparkles, 
  ChevronDown, 
  LogOut, 
  X, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTenant } from '../../config/TenantContext';

export default function Navbar({ activeRole, onRoleChange, currentUser = { fullName: 'Abhishekh Sharma', role: 'STUDENT' } }) {
  const { tenantConfig } = useTenant();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  const notifications = [
    { id: '1', title: 'HOD Commented on Ticket', message: 'Dr. Suresh Kumar added an internal response to #CMP-847201', time: '10m ago', type: 'info' },
    { id: '2', title: 'Complaint Assigned', message: 'Hostel Block B Electricity ticket assigned to Mr. XYZ (IT Cell)', time: '45m ago', type: 'success' },
    { id: '3', title: 'AI Triage Suggestion', message: 'Category "INFRASTRUCTURE" automatically tagged with 94% confidence', time: '2h ago', type: 'ai' }
  ];

  const roles = [
    { code: 'STUDENT', label: 'Student Portal', icon: '🎓' },
    { code: 'FACULTY', label: 'Faculty Handler', icon: '👨‍🏫' },
    { code: 'HOD', label: 'HOD Dashboard', icon: '🏛' },
    { code: 'DEAN', label: 'Dean / Principal', icon: '📊' },
    { code: 'ADMIN', label: 'Control Plane Admin', icon: '⚙️' }
  ];

  return (
    <nav className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/70 border-b border-slate-200 px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo & College Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-blue-500 to-sky-400 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-slate-900 via-blue-700 to-sky-500 bg-clip-text text-transparent">
                {tenantConfig?.collegeShortCode ? `${tenantConfig.collegeShortCode} CCMS` : 'Campus CCMS'}
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-200 rounded-full">
                v2.0 Enterprise
              </span>
            </div>
            {tenantConfig?.collegeName && <p className="text-xs text-slate-500 font-medium">{tenantConfig.collegeName}</p>}
          </div>
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center gap-4">
          
          {/* Role Switcher Pill */}
          <div className="relative">
            <button
              onClick={() => setShowRoleDropdown(!showRoleDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:border-blue-400 text-xs font-semibold text-slate-700 transition-all"
            >
              <span>{roles.find(r => r.code === activeRole)?.icon}</span>
              <span>{roles.find(r => r.code === activeRole)?.label}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            <AnimatePresence>
              {showRoleDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 w-56 glass-panel bg-white/95 p-2 shadow-2xl border border-slate-200 rounded-2xl z-50"
                >
                  <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Switch Dashboard Persona</p>
                  {roles.map(r => (
                    <button
                      key={r.code}
                      onClick={() => {
                        onRoleChange(r.code);
                        setShowRoleDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                        activeRole === r.code ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{r.icon}</span>
                        <span>{r.label}</span>
                      </span>
                      {activeRole === r.code && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Notification Drawer Trigger */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2.5 rounded-xl bg-white border border-slate-300 hover:border-slate-400 text-slate-600 hover:text-slate-900 transition-all"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-500 ring-4 ring-white animate-pulse" />
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-3 w-80 md:w-96 glass-panel bg-white/95 p-4 shadow-2xl border border-slate-200 rounded-2xl z-50"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-blue-600" />
                      <h4 className="font-semibold text-sm text-slate-900">Live Notifications</h4>
                    </div>
                    <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-700">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mt-3 space-y-2 max-h-80 overflow-y-auto">
                    {notifications.map(n => (
                      <div key={n.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all">
                        <div className="flex items-start justify-between gap-2">
                          <h5 className="font-medium text-xs text-blue-700">{n.title}</h5>
                          <span className="text-[10px] text-slate-400">{n.time}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{n.message}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Profile Badge */}
          <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-sky-400 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-blue-500/20">
              AS
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-slate-800">{currentUser.fullName}</p>
              <p className="text-[10px] text-slate-500 font-medium">{activeRole} Persona</p>
            </div>
          </div>

        </div>
      </div>
    </nav>
  );
}
