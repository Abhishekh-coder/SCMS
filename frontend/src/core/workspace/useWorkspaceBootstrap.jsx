import React, { useState, useEffect, createContext, useContext } from 'react';
import apiClient from '../api/apiClient';

const WorkspaceContext = createContext({
  user: null,
  permissions: [],
  assignments: [],
  navigation: [],
  widgets: [],
  featureFlags: {},
  theme: { mode: 'light', accent: 'blue' },
  loading: true,
  error: null,
  refreshBootstrap: () => {},
});

export function WorkspaceProvider({ children }) {
  const [bootstrapData, setBootstrapData] = useState({
    user: null,
    permissions: [],
    assignments: [],
    navigation: [],
    widgets: [],
    featureFlags: { aiAssistEnabled: true, globalSearchEnabled: true },
    theme: { mode: 'light', accent: 'blue' },
    loading: true,
    error: null,
  });

  const fetchBootstrap = async () => {
    const token = apiClient.getAccessToken() || (typeof window !== 'undefined' ? sessionStorage.getItem('ccms_token') : null);
    if (!token) {
      setBootstrapData(prev => ({ ...prev, loading: false, user: null }));
      return;
    }

    try {
      setBootstrapData(prev => ({ ...prev, loading: true, error: null }));
      const payload = await apiClient.get('/auth/bootstrap');
      if (payload.success && payload.data) {
        setBootstrapData({
          user: payload.data.user || null,
          permissions: payload.data.permissions || [],
          assignments: payload.data.assignments || [],
          navigation: payload.data.navigation || [],
          widgets: payload.data.widgets || [],
          featureFlags: payload.data.featureFlags || {},
          theme: payload.data.theme || { mode: 'light', accent: 'blue' },
          loading: false,
          error: null,
        });
      }
    } catch (err) {
      console.error('Failed to load workspace bootstrap:', err);
      setBootstrapData(prev => ({
        ...prev,
        loading: false,
        error: err.message || 'Failed to initialize workspace.',
      }));
    }
  };

  useEffect(() => {
    fetchBootstrap();

    const handleUnauthorized = () => {
      setBootstrapData({
        user: null,
        permissions: [],
        assignments: [],
        navigation: [],
        widgets: [],
        featureFlags: {},
        theme: { mode: 'light', accent: 'blue' },
        loading: false,
        error: null,
      });
    };

    window.addEventListener('ccms:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('ccms:unauthorized', handleUnauthorized);
  }, []);

  return (
    <WorkspaceContext.Provider value={{ ...bootstrapData, refreshBootstrap: fetchBootstrap }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspaceBootstrap() {
  return useContext(WorkspaceContext);
}

export default useWorkspaceBootstrap;
