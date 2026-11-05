import React, { useState, useEffect } from 'react';
import { ShieldCheck, Activity, Database, ToggleLeft, ToggleRight, Server, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import apiClient from '../../core/api/apiClient';
import PageHeader from '../ui/PageHeader';
import { LoadingState, ErrorState } from '../ui/StatePanel';

const FLAG_META = [
  { key: 'AI_TRIAGE_ENABLED', label: 'AI Smart Triage & Duplicate Categorization Engine' },
  { key: 'NOTIFICATIONS_ENABLED', label: 'Multi-Channel Event Notification Queue' },
  { key: 'WHATSAPP_ENABLED', label: 'WhatsApp Direct Dispatch Adapter' },
  { key: 'POWERBI_ENABLED', label: 'Power BI Star Schema Real-Time Data Mart Sync' }
];

export default function AdminDashboard() {
  const [diagnostics, setDiagnostics] = useState(null);
  const [flags, setFlags] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [flagBusy, setFlagBusy] = useState(null);
  const [flagError, setFlagError] = useState(null);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get('/admin/health');
      if (res.success && res.data) {
        setDiagnostics(res.data);
      } else {
        setError('Health diagnostics unavailable.');
      }
    } catch (err) {
      setError(err.message || 'Failed to load system health.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const toggleFlag = async (key) => {
    const current = Boolean(flags[key]);
    setFlagBusy(key);
    setFlagError(null);
    try {
      await apiClient.post('/admin/feature-flags', {
        flagCode: key,
        isEnabled: !current,
        name: key,
        description: FLAG_META.find(f => f.key === key)?.label || key
      });
      setFlags(prev => ({ ...prev, [key]: !current }));
    } catch (err) {
      setFlagError(err.message || `Failed to toggle ${key}. You may not have user:manage permission.`);
    } finally {
      setFlagBusy(null);
    }
  };

  const components = diagnostics?.components || {};
  const dbComp = components.database || {};
  const queueComp = components.notificationQueue || {};
  const aiComp = components.aiProvider || {};

  const statusColor = (status) => {
    const s = String(status || '').toUpperCase();
    if (s.includes('HEALTHY') || s.includes('CONNECTED') || s.includes('CONFIGURED')) return 'text-emerald-600';
    if (s.includes('DISCONNECT') || s.includes('NOT_CONFIGURED') || s.includes('DEGRADED')) return 'text-rose-600';
    return 'text-amber-600';
  };

  return (
    <div className="space-y-8 pb-12">

      {/* Header */}
      <PageHeader
        tone="amber"
        chip="Control Plane Administration"
        icon={ShieldCheck}
        meta="System Admin Control Center"
        title="CCMS System Health & Feature Flags"
        subtitle="Live diagnostics of the platform's critical subsystems and runtime toggles."
      />

      {/* ─── LOADING ─── */}
      {loading && (
        <LoadingState tone="amber" message="Running live system diagnostics…" />
      )}

      {/* ─── ERROR ─── */}
      {!loading && error && <ErrorState message={error} onRetry={fetchHealth} />}

      {/* ─── LIVE SYSTEM DIAGNOSTICS ─── */}
      {!loading && !error && diagnostics && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'MongoDB Connection', status: dbComp.status, details: dbComp.latencyMs != null ? `Latency: ${dbComp.latencyMs}ms` : 'Unreachable', color: statusColor(dbComp.status), icon: Database },
              { label: 'Notification Queue', status: queueComp.status, details: `Pending Jobs: ${queueComp.pendingJobs ?? 0}`, color: statusColor(queueComp.status), icon: Activity },
              { label: 'AI Provider', status: aiComp.status, details: aiComp.model ? `Model: ${aiComp.model}` : 'No provider configured', color: statusColor(aiComp.status), icon: Server }
            ].map((diag, idx) => (
              <div
                key={idx}
                className="group rounded-2xl border border-slate-200 bg-white p-5 backdrop-blur-xl
                           transition-all duration-200 ease-out
                           hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 group-hover:text-slate-800 transition-colors duration-200">
                    {diag.label}
                  </span>
                  <diag.icon className={`w-5 h-5 ${diag.color} transition-transform duration-200 group-hover:scale-110`} />
                </div>
                <p className={`text-xl font-extrabold mt-2 ${diag.color}`}>{diag.status || 'UNKNOWN'}</p>
                <p className="text-[10px] text-slate-500 mt-1">{diag.details}</p>
              </div>
            ))}
          </div>

          <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Last diagnostics: {diagnostics.timestamp ? new Date(diagnostics.timestamp).toLocaleString() : '—'}
          </div>

          {/* ─── RUNTIME FEATURE FLAGS ─── */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 backdrop-blur-xl">
            <h3 className="font-bold text-base text-slate-900 mb-4">Runtime Dynamic Feature Flags</h3>

            {flagError && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs mb-4">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{flagError}</span>
              </div>
            )}

            <div className="space-y-3">
              {FLAG_META.map((item, idx) => (
                <div
                  key={idx}
                  className="group flex items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs
                             transition-colors duration-150 hover:bg-slate-100 hover:border-slate-200"
                >
                  <span className="font-bold text-slate-800">{item.label}</span>
                  <button
                    onClick={() => toggleFlag(item.key)}
                    disabled={flagBusy === item.key}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold transition-all active:scale-[0.95] disabled:opacity-50 cursor-pointer ${
                      flags[item.key]
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700'
                    }`}
                  >
                    {flagBusy === item.key ? (
                      <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                    ) : flags[item.key] ? (
                      <ToggleRight className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <ToggleLeft className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                    )}
                    <span>{flags[item.key] ? 'ENABLED' : 'DISABLED'}</span>
                  </button>
                </div>
              ))}
            </div>

            <p className="text-[10px] text-slate-400 mt-4">
              Flags default to DISABLED until toggled. Changes require the <code className="text-blue-600 font-mono">user:manage</code> permission.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
