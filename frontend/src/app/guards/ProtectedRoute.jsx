import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

/**
 * ProtectedRoute
 *
 * Wraps any workspace route. Enforces:
 *   1. Authentication — must have valid token
 *   2. Role authorization — allowedRoles must include user's activeRole
 *
 * If unauthenticated → redirect to /login
 * If wrong role → 403 Forbidden (never leaks the actual workspace content)
 *
 * @param {string[]} allowedRoles - e.g. ['HOD', 'DEAN'] — backend-defined
 */
export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { isAuthenticated, activeRole } = useAuthStore();
  const location = useLocation();

  // Not logged in → send to login, preserve intended destination
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Logged in but allowedRoles specified and user's role not in list → 403
  if (allowedRoles.length > 0 && !allowedRoles.includes(activeRole)) {
    return <ForbiddenPage role={activeRole} required={allowedRoles} />;
  }

  return children;
}

// ─── 403 Page ─────────────────────────────────────────────────────────────────
// Rendered inline — student who tries to reach HOD URL sees this, never the content.
function ForbiddenPage({ role, required }) {
  const { logout } = useAuthStore();

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-5 p-8 font-sans">
      <div className="text-5xl">🔒</div>
      <div className="text-center space-y-2">
        <h1 className="font-display font-extrabold text-2xl text-slate-900">Access Denied</h1>
        <p className="text-sm text-slate-500 max-w-sm">
          Your account role (<span className="font-mono text-red-600">{role || 'UNKNOWN'}</span>) is not
          authorized to access this workspace.
          {required?.length > 0 && (
            <> Required: <span className="font-mono text-amber-600">{required.join(', ')}</span>.</>
          )}
        </p>
      </div>
      <div className="flex gap-3">
        <button onClick={() => window.history.back()} className="btn-secondary text-sm px-5 py-2.5">
          Go Back
        </button>
        <button onClick={logout} className="btn-primary text-sm px-5 py-2.5">
          Sign Out
        </button>
      </div>
    </div>
  );
}
