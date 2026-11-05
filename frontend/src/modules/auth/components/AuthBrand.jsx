import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { useTenant } from '../../../config/TenantContext';

export default function AuthBrand() {
  let collegeName = 'Campus Management System';
  try {
    const tenant = useTenant();
    if (tenant?.tenantConfig?.collegeName) {
      collegeName = tenant.tenantConfig.collegeName;
    }
  } catch (e) {
    // Fallback if TenantContext is not available
  }

  return (
    <div className="flex items-center gap-3">
      <div className="w-11 h-11 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
        <ShieldCheck className="w-6 h-6" />
      </div>
      <div>
        <h2 className="font-bold text-lg text-slate-900 leading-tight">
          {collegeName}
        </h2>
        <p className="text-xs text-slate-500 font-medium">
          Campus Management Portal
        </p>
      </div>
    </div>
  );
}
