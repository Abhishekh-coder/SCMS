import { create } from 'zustand';
import apiClient from '../../core/api/apiClient';

// Clean up any legacy localStorage auth tokens from older versions so they don't cause cross-tab pollution
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('ccms_token');
    localStorage.removeItem('ccms_access_token');
    localStorage.removeItem('ccms_refresh_token');
    localStorage.removeItem('ccms_user');
    localStorage.removeItem('ccms_active_role');
  } catch (e) {
    // Ignore storage errors in restricted contexts
  }
}

// ─── Safe SessionStorage Helpers ──────────────────────────────────────────────
const getSessionItem = (key) => {
  if (typeof window === 'undefined') return null;
  try {
    return sessionStorage.getItem(key);
  } catch (e) {
    return null;
  }
};

const setSessionItem = (key, value) => {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(key, value);
  } catch (e) {}
};

const removeSessionItem = (key) => {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(key);
  } catch (e) {}
};

// ─── Role → Route Map ─────────────────────────────────────────────────────────
// Backend decides the role. Frontend just redirects.
// If a new role is added, add one line here — nothing else changes.
export const ROLE_ROUTES = {
  STUDENT:         '/workspace/student',
  CLASS_INCHARGE:  '/workspace/class-incharge',
  TEACHER_GUARDIAN: '/workspace/teacher-guardian',
  FACULTY:         '/workspace/faculty',
  HOD:             '/workspace/hod',
  DEAN:            '/workspace/dean',
  PRINCIPAL:       '/workspace/principal',
  ADMIN:           '/workspace/admin',
};

// ─── Auth Store (Tab-Isolated) ────────────────────────────────────────────────
const initialToken = getSessionItem('ccms_token') || getSessionItem('ccms_access_token');
let initialUser = null;
try {
  const userJson = getSessionItem('ccms_user');
  if (userJson) initialUser = JSON.parse(userJson);
} catch (e) {
  initialUser = null;
}

export const useAuthStore = create((set, get) => {
  // Listen for per-tab token refresh / unauthorized events dispatched by ApiClient
  if (typeof window !== 'undefined') {
    window.addEventListener('ccms:tokens-refreshed', (e) => {
      const newAccessToken = e.detail?.accessToken || getSessionItem('ccms_token');
      if (newAccessToken) {
        set({ token: newAccessToken, isAuthenticated: true });
      }
    });

    window.addEventListener('ccms:unauthorized', () => {
      removeSessionItem('ccms_token');
      removeSessionItem('ccms_access_token');
      removeSessionItem('ccms_refresh_token');
      removeSessionItem('ccms_user');
      removeSessionItem('ccms_active_role');
      set({ token: null, user: null, isAuthenticated: false, activeRole: null, error: null });
    });
  }

  return {
    token:           initialToken || null,
    user:            initialUser,
    isAuthenticated: Boolean(initialToken),
    // activeRole = which role the user is currently operating as in this tab
    activeRole:      getSessionItem('ccms_active_role') || null,
    isLoading:       false,
    error:           null,

    // ─── login ──────────────────────────────────────────────────────────────
    login: async (credential, password) => {
      set({ isLoading: true, error: null });
      try {
        const sessionId = apiClient.getSessionId();

        const res = await fetch('/api/v1/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-session-id': sessionId,
          },
          body: JSON.stringify({ loginId: credential, email: credential, password, recaptchaToken: null })
        });

        const json = await res.json();
        if (!res.ok) {
          const rawMessage = json.error?.message || json.message || 'Authentication failed.';
          let userFacingMessage = rawMessage;
          if (rawMessage.toLowerCase().includes('recaptcha') || rawMessage.toLowerCase().includes('token is required')) {
            userFacingMessage = 'Unable to verify your login request. Please refresh the page and try again.';
          } else if (rawMessage.toLowerCase().includes('invalid login id') || rawMessage.toLowerCase().includes('user_not_found') || rawMessage.toLowerCase().includes('invalid email or password') || rawMessage.toLowerCase().includes('invalid password')) {
            userFacingMessage = 'Invalid Login ID or password. Please check your credentials and try again.';
          }
          throw new Error(userFacingMessage);
        }

        const data = json.data;
        const { accessToken, refreshToken, userUuid, fullName, email, roles, role } = data;

        // Normalize: always work with roles[] array
        const userRoles = roles?.length ? roles : (role ? [role] : []);

        const user = { userUuid, fullName, email, roles: userRoles };

        // Persist strictly to sessionStorage (tab-local)
        apiClient.setAccessToken(accessToken);
        if (refreshToken) {
          apiClient.setRefreshToken(refreshToken);
        }
        setSessionItem('ccms_user', JSON.stringify(user));

        set({ token: accessToken, user, isAuthenticated: true, isLoading: false, error: null });

        // ── Redirection Decision Logic ─────────────────────────────────────────
        // 1. STUDENT role / profile → ALWAYS direct auto-redirect (no selector)
        if (userRoles.includes('STUDENT') || data.profileType === 'STUDENT') {
          const redirectTo = '/workspace/student';
          setSessionItem('ccms_active_role', 'STUDENT');
          set({ activeRole: 'STUDENT' });
          return { needsWorkspaceSelection: false, redirectTo, roles: userRoles };
        }

        // 2. Single Role → direct auto-redirect
        if (userRoles.length === 1) {
          const singleRole = userRoles[0];
          const redirectTo = ROLE_ROUTES[singleRole] || '/workspace/faculty';
          setSessionItem('ccms_active_role', singleRole);
          set({ activeRole: singleRole });
          return { needsWorkspaceSelection: false, redirectTo, roles: userRoles };
        }

        // 3. Multiple Roles → show WorkspaceSelector
        return { needsWorkspaceSelection: true, redirectTo: '/select-workspace', roles: userRoles };

      } catch (err) {
        set({ error: err.message, isLoading: false });
        throw err;
      }
    },

    // ─── setActiveRole ───────────────────────────────────────────────────────
    // Called from WorkspaceSelector when user picks one role from their list in this tab
    setActiveRole: (role) => {
      const redirectTo = ROLE_ROUTES[role] || '/workspace/student';
      setSessionItem('ccms_active_role', role);
      set({ activeRole: role });
      return redirectTo;
    },

    // ─── logout (Tab-Isolated) ───────────────────────────────────────────────
    logout: () => {
      apiClient.setAccessToken(null);
      apiClient.setRefreshToken(null);
      removeSessionItem('ccms_user');
      removeSessionItem('ccms_active_role');
      removeSessionItem('ccms_token');
      removeSessionItem('ccms_access_token');
      removeSessionItem('ccms_refresh_token');
      set({ token: null, user: null, isAuthenticated: false, activeRole: null, error: null });
    },

    clearError: () => set({ error: null }),
  };
});
