import React, { useState } from 'react';
import { 
  User, 
  ShieldCheck, 
  Mail, 
  Building, 
  Lock, 
  Bell, 
  LogOut, 
  Key, 
  CheckCircle2, 
  Sparkles,
  Layers,
  Smartphone,
  Check
} from 'lucide-react';
import { useAuthStore } from '../../app/store/authStore';
import { useNavigate } from 'react-router-dom';

export default function ProfilePreferencesView({ user }) {
  const navigate = useNavigate();
  const { logout, setActiveRole, activeRole } = useAuthStore();
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [inAppAlerts, setInAppAlerts] = useState(true);
  const [slaAlerts, setSlaAlerts] = useState(true);
  const [saved, setSaved] = useState(false);

  const role = user?.primaryRole || (user?.roles && user?.roles[0]) || activeRole || 'STUDENT';
  const roles = user?.roles || [role];

  const handleRoleSwitch = (targetRole) => {
    if (setActiveRole) {
      setActiveRole(targetRole);
      window.location.reload();
    }
  };

  const handleSavePreferences = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLogout = () => {
    if (logout) logout();
    navigate('/login');
  };

  return (
    <div className="space-y-8 w-full max-w-4xl mx-auto">
      
      {/* ── Header ── */}
      <div className="pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
            <User className="w-4 h-4" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Profile & Preferences</h2>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Manage your institutional identity, operating role, and system notification preferences.
        </p>
      </div>

      {/* ── Identity Summary Card ── */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-700 border border-blue-200 font-bold text-xl flex items-center justify-center shrink-0">
            {(user?.fullName || 'User').slice(0, 2).toUpperCase()}
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-slate-900">{user?.fullName || 'Campus User'}</h3>
            <p className="text-xs text-slate-500">{user?.email || 'N/A'}</p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                {role.replace(/_/g, ' ')}
              </span>
              <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                {user?.loginId || user?.userUuid?.slice(0, 8)}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-xs font-bold text-red-700 transition cursor-pointer self-start sm:self-auto"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* ── Institutional Scope & Role Switcher ── */}
      {roles.length > 1 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <h4 className="text-sm font-bold text-slate-900">Active Operating Role</h4>
          </div>
          <p className="text-xs text-slate-500">
            You hold multiple responsibilities in CCMS. Select which role context to operate in:
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {roles.map((r) => {
              const isActive = (activeRole || role) === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => handleRoleSwitch(r)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 text-slate-600 hover:text-slate-900 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {r.replace(/_/g, ' ')} {isActive && '✓ (Active)'}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Institutional Details Grid ── */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h4 className="text-sm font-bold text-slate-900">Institutional Parameters</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-slate-500">Department</span>
            <p className="font-semibold text-slate-900">{user?.departmentCode || user?.department || 'Information Technology'}</p>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-slate-500">Class Division / Batch</span>
            <p className="font-semibold text-slate-900">{user?.divisionCode || '2024-IT-A'}</p>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-slate-500">Institutional Tenant</span>
            <p className="font-semibold text-slate-900">Main Campus (Default)</p>
          </div>
        </div>
      </div>

      {/* ── Notification Preferences ── */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Bell className="w-4 h-4 text-blue-600" />
            <span>Notification Preferences</span>
          </h4>
          {saved && (
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              <span>Preferences saved</span>
            </span>
          )}
        </div>

        <div className="space-y-3 pt-1">
          <label className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100/70 transition">
            <div>
              <p className="text-xs font-bold text-slate-900">Email Notifications</p>
              <p className="text-[11px] text-slate-500">Receive email alerts when complaints are assigned or resolved.</p>
            </div>
            <input
              type="checkbox"
              checked={emailAlerts}
              onChange={(e) => setEmailAlerts(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 bg-white text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100/70 transition">
            <div>
              <p className="text-xs font-bold text-slate-900">In-App Notification Center</p>
              <p className="text-[11px] text-slate-500">Show live badge alerts and status changes in the top bar.</p>
            </div>
            <input
              type="checkbox"
              checked={inAppAlerts}
              onChange={(e) => setInAppAlerts(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 bg-white text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100/70 transition">
            <div>
              <p className="text-xs font-bold text-slate-900">SLA Warning & Escalation Alerts</p>
              <p className="text-[11px] text-slate-500">Alert me when a complaint is nearing its resolution deadline.</p>
            </div>
            <input
              type="checkbox"
              checked={slaAlerts}
              onChange={(e) => setSlaAlerts(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 bg-white text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
          </label>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={handleSavePreferences}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
          >
            Save Preferences
          </button>
        </div>
      </div>

    </div>
  );
}
