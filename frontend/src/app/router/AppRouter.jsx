import React, { Suspense, useState, useCallback, useMemo, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { TenantProvider } from '../../config/TenantContext';
import { WorkspaceProvider } from '../../core/workspace/useWorkspaceBootstrap.jsx';
import { useAuthStore } from '../store/authStore';
import ProtectedRoute from '../guards/ProtectedRoute';

// ─── Public Pages ─────────────────────────────────────────────────────────────
import LandingPage from '../../modules/landing/LandingPage';
import AuthPage from '../../modules/auth/AuthPage';
import WorkspaceSelector from '../../modules/auth/WorkspaceSelector';

// ─── Unified Dashboard Shell & Router ──────────────────────────────────────────
import DashboardLayout from '../../layouts/DashboardLayout';
import DashboardRouter from '../../modules/dashboard/DashboardRouter';
import InteractiveAnalyticsDashboard from '../../modules/analytics/InteractiveAnalyticsDashboard';

function WorkspaceShellWrapper() {
  const { user, activeRole } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [registerRequested, setRegisterRequested] = useState(false);

  const role = user?.primaryRole || (user?.roles && user?.roles[0]) || activeRole || 'STUDENT';

  // Derive activeNav directly from the URL pathname for 100% browser refresh & back/forward safety
  const activeNav = useMemo(() => {
    const p = location.pathname.toLowerCase();
    
    if (p.includes('/campus-info') || p.includes('/info')) return 'CAMPUS_INFO';
    if (p.includes('/map')) {
      const isLeadership = ['PRINCIPAL', 'SUPER_ADMIN', 'ADMIN'].includes(role);
      return isLeadership ? 'CAMPUS_MAP' : 'CAMPUS_INFO';
    }
    if (p.includes('/notifications')) return 'NOTIFICATIONS';
    if (p.includes('/help') || p.includes('/support')) return 'HELP_SUPPORT';
    if (p.includes('/profile') || p.includes('/preferences') || p.includes('/settings')) return 'PROFILE_PREFERENCES';
    
    // Principal navigation keys
    if (p.includes('/critical-escalations')) return 'CRITICAL_ESCALATIONS';
    if (p.includes('/decisions')) return 'INSTITUTIONAL_DECISIONS';
    if (p.includes('/performance')) return 'DEPT_PERFORMANCE';
    if (p.includes('/audit')) return 'AUDIT_ACTIVITY';
    
    // Department / Faculty / HOD keys
    if (p.includes('/faculty')) return 'FACULTY_STAFF';
    if (p.includes('/hod/complaints')) return 'DEPARTMENT_COMPLAINTS';
    if (p.includes('/assigned')) return 'ASSIGNED_COMPLAINTS';
    if (p.includes('/forwarded')) return 'FORWARDED_COMPLAINTS';
    if (p.includes('/overview') || p.includes('/class-overview')) return 'CLASS_OVERVIEW';
    if (p.includes('/escalated')) return 'ESCALATED_COMPLAINTS';
    if (p.includes('/complaints') || p.includes('/my-complaints')) return 'MY_COMPLAINTS';

    // Facilities / Campus Services keys
    if (p.includes('/buildings')) return 'ASSIGNED_BUILDINGS';
    if (p.includes('/facilities')) return 'FACILITY_INFO';
    
    return 'DASHBOARD';
  }, [location.pathname, role]);

  const handleNavChange = useCallback((key) => {
    if (key === 'ANALYTICS_EXPLORER') {
      const isAuthorized = ['PRINCIPAL', 'SUPER_ADMIN', 'ADMIN'].includes(role);
      if (isAuthorized) {
        navigate('/analytics');
      } else {
        navigate('/dashboard');
      }
      return;
    }

    if (key === 'REGISTER_COMPLAINT') {
      setRegisterRequested(true);
      return;
    }

    if (key === 'CAMPUS_INFO') {
      navigate('/dashboard/campus-info');
      return;
    }

    if (key === 'CAMPUS_MAP') {
      const isLeadership = ['PRINCIPAL', 'SUPER_ADMIN', 'ADMIN'].includes(role);
      if (isLeadership) {
        navigate('/dashboard/map');
      } else {
        navigate('/dashboard/campus-info');
      }
      return;
    }

    if (key === 'NOTIFICATIONS') {
      navigate('/dashboard/notifications');
      return;
    }

    if (key === 'HELP_SUPPORT') {
      navigate('/dashboard/help');
      return;
    }

    if (key === 'PROFILE_PREFERENCES') {
      navigate('/dashboard/profile');
      return;
    }

    // Principal / Admin leadership navigation
    if (role === 'PRINCIPAL' || role === 'SUPER_ADMIN' || role === 'ADMIN') {
      switch (key) {
        case 'COMMAND_CENTER':
        case 'DASHBOARD':
          navigate('/dashboard');
          break;
        case 'CRITICAL_ESCALATIONS':
          navigate('/dashboard/critical-escalations');
          break;
        case 'INSTITUTIONAL_DECISIONS':
          navigate('/dashboard/decisions');
          break;
        case 'DEPT_PERFORMANCE':
          navigate('/dashboard/performance');
          break;
        case 'AUDIT_ACTIVITY':
          navigate('/dashboard/audit');
          break;
        default:
          navigate('/dashboard');
      }
      return;
    }

    // Dean navigation
    if (role === 'DEAN') {
      switch (key) {
        case 'ALL_DEPARTMENTS':
          navigate('/workspace/dean/departments');
          break;
        case 'CRITICAL_ESCALATIONS':
          navigate('/workspace/dean/escalations');
          break;
        case 'DEPT_PERFORMANCE':
          navigate('/workspace/dean/performance');
          break;
        case 'MY_REQUESTS':
          navigate('/workspace/dean/my-requests');
          break;
        default:
          navigate('/workspace/dean');
      }
      return;
    }

    // Role-scoped route mappings
    if (role === 'CLASS_INCHARGE' || role === 'FACULTY') {
      switch (key) {
        case 'ASSIGNED_COMPLAINTS':
        case 'DEPT_TASKS':
        case 'PENDING_ACTIONS':
          navigate('/workspace/class-incharge/assigned');
          break;
        case 'FORWARDED_COMPLAINTS':
        case 'RESOLUTION_UPDATES':
          navigate('/workspace/class-incharge/forwarded');
          break;
        case 'CLASS_OVERVIEW':
        case 'CLASS_COMPLAINTS':
          navigate('/workspace/class-incharge/overview');
          break;
        default:
          navigate('/workspace/class-incharge');
      }
      return;
    }

    if (role === 'TEACHER_GUARDIAN') {
      switch (key) {
        case 'FORWARDED_COMPLAINTS':
        case 'STUDENT_CONCERNS':
          navigate('/workspace/teacher-guardian/forwarded');
          break;
        case 'ESCALATED_COMPLAINTS':
        case 'PENDING_RESPONSES':
        case 'RESOLUTION_FOLLOWUP':
          navigate('/workspace/teacher-guardian/escalated');
          break;
        default:
          navigate('/workspace/teacher-guardian');
      }
      return;
    }

    if (role === 'HOD') {
      switch (key) {
        case 'DEPARTMENT_COMPLAINTS':
        case 'PENDING_ASSIGNMENT':
          navigate('/workspace/hod/complaints');
          break;
        case 'ESCALATED_COMPLAINTS':
        case 'RESOLUTION_MONITORING':
          navigate('/workspace/hod/escalated');
          break;
        case 'FACULTY_STAFF':
        case 'DEPARTMENT_OVERVIEW':
          navigate('/workspace/hod/faculty');
          break;
        default:
          navigate('/workspace/hod');
      }
      return;
    }

    if (role === 'CAMPUS_SERVICES_HEAD' || role === 'MAINTENANCE' || role === 'FACILITIES_STAFF') {
      switch (key) {
        case 'ASSIGNED_WORK_ORDERS':
          navigate('/workspace/campus-services/assigned');
          break;
        case 'NEW_REQUESTS':
          navigate('/workspace/campus-services/new');
          break;
        case 'IN_PROGRESS_ORDERS':
          navigate('/workspace/campus-services/in-progress');
          break;
        case 'RESOLVED_ORDERS':
          navigate('/workspace/campus-services/resolved');
          break;
        case 'ASSIGNED_BUILDINGS':
          navigate('/workspace/campus-services/buildings');
          break;
        case 'FACILITY_INFO':
          navigate('/workspace/campus-services/facilities');
          break;
        default:
          navigate('/workspace/campus-services');
      }
      return;
    }

    if (role === 'STUDENT') {
      switch (key) {
        case 'MY_COMPLAINTS':
          navigate('/workspace/student/complaints');
          break;
        default:
          navigate('/workspace/student');
      }
      return;
    }

    navigate('/dashboard');
  }, [role, navigate]);

  const handleComplaintModalOpened = useCallback(() => {
    setRegisterRequested(false);
    navigate('/workspace/student/complaints');
  }, [navigate]);

  const authenticatedUser = user || {
    primaryRole: role,
    roles: [role],
    fullName: 'Institutional User',
  };

  return (
    <DashboardLayout activeNav={activeNav} onNavChange={handleNavChange} user={authenticatedUser}>
      <DashboardRouter
        user={authenticatedUser}
        activeNav={activeNav}
        onNavChange={handleNavChange}
        openComplaintModal={registerRequested}
        onComplaintModalOpened={handleComplaintModalOpened}
      />
    </DashboardLayout>
  );
}

export default function AppRouter() {
  return (
    <TenantProvider>
      <WorkspaceProvider>
        <BrowserRouter>
          <Routes>

            {/* ── PUBLIC ROUTES ── */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<AuthPage />} />

            {/* ── PROTECTED EXECUTIVE ANALYTICS EXPLORER (Leadership Only) ── */}
            <Route 
              path="/analytics" 
              element={
                <ProtectedRoute allowedRoles={['PRINCIPAL', 'SUPER_ADMIN', 'ADMIN']}>
                  <InteractiveAnalyticsDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/visualization" 
              element={
                <ProtectedRoute allowedRoles={['PRINCIPAL', 'SUPER_ADMIN', 'ADMIN']}>
                  <InteractiveAnalyticsDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/analytics" 
              element={
                <ProtectedRoute allowedRoles={['PRINCIPAL', 'SUPER_ADMIN', 'ADMIN']}>
                  <InteractiveAnalyticsDashboard />
                </ProtectedRoute>
              } 
            />

            {/* ── MULTI-ROLE SELECTOR ── */}
            <Route
              path="/select-workspace"
              element={
                <ProtectedRoute allowedRoles={[]}>
                  <WorkspaceSelector />
                </ProtectedRoute>
              }
            />

            {/* ── MAIN UNIFIED CCMS DASHBOARD WORKSPACE ── */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={[]}>
                  <WorkspaceShellWrapper />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/*"
              element={
                <ProtectedRoute allowedRoles={[]}>
                  <WorkspaceShellWrapper />
                </ProtectedRoute>
              }
            />

            {/* ── ROLE WORKSPACE ROUTES (Preserving Deep-Links & Direct URLs) ── */}
            <Route
              path="/workspace/*"
              element={
                <ProtectedRoute allowedRoles={[]}>
                  <WorkspaceShellWrapper />
                </ProtectedRoute>
              }
            />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />

          </Routes>
        </BrowserRouter>
      </WorkspaceProvider>
    </TenantProvider>
  );
}
