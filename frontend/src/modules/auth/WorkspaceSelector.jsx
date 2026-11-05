import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, ArrowRight, User, AlertTriangle, LogOut, CheckCircle2 } from 'lucide-react';
import { useAuthStore, ROLE_ROUTES } from '../../app/store/authStore';
import { useWorkspaceBootstrap } from '../../core/workspace/useWorkspaceBootstrap.jsx';

const ROLE_LABELS = {
  STUDENT:          { label: 'Student Portal',       desc: 'Submit and track your complaints' },
  CLASS_INCHARGE:   { label: 'Class Incharge',       desc: 'Manage division class assignments' },
  TEACHER_GUARDIAN: { label: 'Teacher Guardian',     desc: 'Escalate and resolve student cases' },
  FACULTY:          { label: 'Faculty Handler',      desc: 'Resolve assigned department cases' },
  HOD:              { label: 'HOD Workspace',        desc: 'Department oversight and analytics' },
  DEAN:             { label: 'Dean Workspace',       desc: 'Multi-department governance' },
  PRINCIPAL:        { label: 'Principal Workspace',  desc: 'Campus-wide executive view' },
  ADMIN:            { label: 'System Administration', desc: 'Platform configuration and health' },
  SUPER_ADMIN:      { label: 'Super Admin Control Plane', desc: 'System architect control plane' }
};

export default function WorkspaceSelector() {
  const navigate = useNavigate();
  const { user, setActiveRole, logout } = useAuthStore();
  const { assignments, permissions } = useWorkspaceBootstrap();

  const userRoles = user?.roles || [];

  // Build selectable options from assignments & roles
  const selectableOptions = [];
  userRoles.forEach(r => {
    if (ROLE_LABELS[r]) {
      selectableOptions.push({
        key: r,
        label: ROLE_LABELS[r].label,
        desc: ROLE_LABELS[r].desc
      });
    }
  });

  assignments.forEach(a => {
    if (!selectableOptions.some(opt => opt.key === a.assignmentType) && ROLE_LABELS[a.assignmentType]) {
      selectableOptions.push({
        key: a.assignmentType,
        label: ROLE_LABELS[a.assignmentType].label,
        desc: `Scope: ${a.scopeType} - ${a.scopeId}`
      });
    }
  });

  function handleSelect(roleKey) {
    const redirectTo = setActiveRole(roleKey);
    navigate(redirectTo, { replace: true });
  }

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans text-slate-900 relative selection:bg-blue-500/30 selection:text-slate-900">

      {/* Ambient Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md space-y-6">

        {/* Header */}
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center mx-auto shadow-lg shadow-blue-500/30 border border-blue-400/30">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-display font-extrabold text-2xl text-slate-900 tracking-tight">
              Hello, {user?.fullName || 'User'}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Signed in as <span className="font-mono text-blue-600 font-semibold">{user?.loginId || user?.email}</span>
            </p>
          </div>
        </div>

        {/* ─── CASE A: NO ASSIGNMENTS OR ROLES ─── */}
        {selectableOptions.length === 0 ? (
          <div className="glass-card p-6 text-center space-y-4 border-amber-200 bg-amber-50">
            <div className="w-12 h-12 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center mx-auto text-amber-600">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">No Active Workspace Assigned</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Your account does not have an active operational assignment for this academic session. Please contact your Department Administrator.
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full py-2.5 px-4 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out & Switch Account</span>
            </button>
          </div>
        ) : (
          /* ─── CASE B: MULTIPLE WORKSPACES ─── */
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">
              Select Workspace for This Session
            </p>
            <div className="space-y-2">
              {selectableOptions.map((opt, i) => (
                <motion.button
                  key={opt.key}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => handleSelect(opt.key)}
                  className="w-full glass-card p-4 flex items-center justify-between hover:border-blue-400 hover:bg-blue-50 transition-all text-left group cursor-pointer"
                >
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{opt.label}</p>
                    <p className="text-xs text-slate-500">{opt.desc}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                </motion.button>
              ))}
            </div>

            <button
              onClick={handleLogout}
              className="w-full py-2 text-xs text-slate-400 hover:text-slate-700 transition-colors flex items-center justify-center gap-1.5 mt-4"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign out</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
