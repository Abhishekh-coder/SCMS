import React, { createContext, useContext } from 'react';

// In production: fetched from GET /api/v1/tenant/config
// CollegeName is NEVER hardcoded — comes from config API
const TenantContext = createContext();

const defaultTenantConfig = {
  tenantId:        null,      // fetched from backend
  collegeName:     null,      // fetched from GET /api/v1/tenant/config
  collegeShortCode: null,
  campusTitle:     'Campus Complaint Management System',
  logoUrl:         null,
  supportEmail:    null,
  primaryColor:    '#4f46e5',
};

export function TenantProvider({ children }) {
  // TODO (Phase 4): Replace with real API call: GET /api/v1/tenant/config
  // const [tenantConfig, setTenantConfig] = useState(defaultTenantConfig);
  // useEffect(() => { fetch('/api/v1/tenant/config').then(...) }, []);

  // Development stub — brand values come from env or DB, never from JSX
  const tenantConfig = {
    ...defaultTenantConfig,
    collegeName:     import.meta.env.VITE_TENANT_COLLEGE_NAME     || null,
    collegeShortCode: import.meta.env.VITE_TENANT_SHORT_CODE      || null,
  };

  return (
    <TenantContext.Provider value={{ tenantConfig }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  return useContext(TenantContext);
}
