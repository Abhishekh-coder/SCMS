import React from 'react';
import { useTenant } from '../../config/TenantContext';
import { ShieldCheck } from 'lucide-react';

export default function InstitutionalFooter() {
  const { tenantConfig } = useTenant();

  return (
    <footer className="relative z-10 border-t border-slate-200 bg-surface/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Left — Brand & Info */}
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/15 to-blue-500/5 border border-blue-200 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-blue-500" />
            </div>
            <div className="space-y-0.5 text-center md:text-left">
              <p className="text-xs font-bold text-slate-800 tracking-tight">
                {tenantConfig.collegeName || 'Campus System'}
              </p>
              <p className="text-[10px] text-slate-400 font-medium">
                Campus Management & Case Resolution Engine — v2.0 Enterprise
              </p>
            </div>
          </div>

          {/* Right — Support Links */}
          <div className="flex items-center gap-1">
            {['Help Desk', 'IT Cell Support', 'Privacy Policy', 'Accessibility'].map((link, i) => (
              <React.Fragment key={link}>
                <button className="px-3 py-1.5 rounded-lg text-[11px] font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all duration-150">
                  {link}
                </button>
                {i < 3 && <span className="text-slate-300 text-[10px]">·</span>}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-slate-400">
          <span>© {new Date().getFullYear()} {tenantConfig.collegeShortCode || 'CCMS'}. All rights reserved.</span>
          <span className="font-mono text-slate-400">Build 2.0.0 • Powered by AI Triage Engine</span>
        </div>
      </div>
    </footer>
  );
}
