import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShieldCheck, ArrowRight,
  CheckCircle2, Bell, Sparkles, HelpCircle,
  BookOpen, Home, GraduationCap, Bus, Phone, Clock, BarChart3
} from 'lucide-react';
import { useTenant } from '../../config/TenantContext';

// ─── Help Desk Contacts ───────────────────────────────────────────────────────
// These are generic service-desk contact points.
// No fake business metrics. Real data only from API.
const HELP_DESKS = [
  { icon: HelpCircle,    label: 'IT Helpdesk',      detail: 'Technical issues, portal access' },
  { icon: Home,          label: 'Hostel Office',     detail: 'Accommodation & facility issues' },
  { icon: GraduationCap, label: 'Academic Cell',     detail: 'Grades, attendance, certificates' },
  { icon: BookOpen,      label: 'Library',           detail: 'Books, digital resources, fines' },
  { icon: Bus,           label: 'Transport',         detail: 'Bus route & timing queries' },
  { icon: Phone,         label: 'General Enquiry',   detail: 'Administrative queries' },
];

// ─── What you can do here ─────────────────────────────────────────────────────
const FEATURES = [
  { icon: ShieldCheck,   label: 'Secure Login',              detail: 'Institutional credentials only' },
  { icon: CheckCircle2,  label: 'Track Complaint Status',    detail: 'Real-time SLA visibility' },
  { icon: Bell,          label: 'Real-Time Updates',         detail: 'Instant notifications as cases progress' },
  { icon: Sparkles,      label: 'AI Assisted Support',       detail: 'Smart triage for faster resolution' },
];

// ─── Public Stats (API-driven, renders only when showPublicStats === true) ────
function PublicStatsSection() {
  const [state, setState] = useState({ status: 'loading', data: null });

  useEffect(() => {
    let cancelled = false;
    fetch('/api/v1/public/system-summary')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(json => {
        if (!cancelled) setState({ status: 'done', data: json.data });
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error', data: null });
      });
    return () => { cancelled = true; };
  }, []);

  // API says showPublicStats: false → render nothing
  if (state.status !== 'done' || !state.data?.showPublicStats || !state.data?.stats) {
    return null;
  }

  const { stats } = state.data;
  const metrics = [
    { label: 'Resolved within SLA',     value: `${stats.resolvedWithinSla}%`, source: 'ReportingSLAFact', period: 'Last 30 Days' },
    { label: 'Avg. Resolution Time',    value: `${stats.averageResolutionHours} hrs`, source: 'ResolutionTimeFact', period: 'This Semester' },
    { label: 'Active Departments',      value: stats.activeDepartments, source: 'DepartmentConfig', period: 'Current' },
  ];

  return (
    <section className="max-w-4xl mx-auto px-6 pb-20">
      <p className="text-center text-[11px] text-slate-500 uppercase tracking-widest mb-5">
        Live system summary — updated {new Date(state.data.lastUpdated).toLocaleTimeString()}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {metrics.map((m, i) => (
          <div key={i} className="glass-panel p-5 space-y-2">
            <p className="text-[11px] text-slate-500 uppercase tracking-wide">{m.label}</p>
            <p className="font-display font-extrabold text-3xl text-slate-900">{m.value}</p>
            <div className="text-[10px] text-slate-400 space-y-0.5">
              <p>{m.period}</p>
              <p className="font-mono text-slate-400">Source: {m.source}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Main Landing Page ────────────────────────────────────────────────────────
export default function LandingPage() {
  const navigate          = useNavigate();
  const { tenantConfig }  = useTenant();
  const collegeName       = tenantConfig.collegeName || null;

  return (
    <div className="min-h-screen bg-surface flex flex-col font-sans">

      {/* Ambient */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="ambient-blob w-[600px] h-[600px] bg-brand -top-64 -right-64" />
        <div className="ambient-blob w-[300px] h-[300px] bg-sky-400 bottom-0 -left-24" />
      </div>

      {/* ─── HERO — the entire point of this page ──────────────────────────── */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">

        {/* Logo mark */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          className="w-16 h-16 rounded-2xl bg-brand shadow-2xl shadow-blue-500/30
                     flex items-center justify-center mb-6"
        >
          <ShieldCheck className="w-8 h-8 text-white" />
        </motion.div>

        {/* Tenant name — only shown if configured */}
        {collegeName && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm font-semibold text-slate-500 mb-1"
          >
            {collegeName}
          </motion.p>
        )}

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.07 }}
          className="font-display font-extrabold text-4xl sm:text-5xl text-slate-900
                     tracking-tight leading-tight max-w-xl"
        >
          Campus Complaint
          <br />
          Management System
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.13 }}
          className="mt-4 text-sm text-slate-500 max-w-sm leading-relaxed"
        >
          Raise complaints. Track progress. Get resolved — faster.
        </motion.p>

        {/* ─── PRIMARY ACTIONS ──────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.19 }}
          className="mt-8 flex flex-col sm:flex-row items-center gap-3 w-full max-w-sm sm:max-w-md mx-auto"
        >
          <button
            id="cta-sign-in"
            onClick={() => navigate('/login')}
            className="btn-primary w-full justify-center py-3.5 text-sm"
          >
            <ShieldCheck className="w-4 h-4" />
            Sign In
          </button>
          <button
            id="cta-analytics"
            onClick={() => navigate('/analytics')}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 shadow-xs transition"
          >
            <BarChart3 className="w-4 h-4 text-blue-600" />
            Interactive Dashboard
          </button>
        </motion.div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.28 }}
          onClick={() => navigate('/login?tab=activate')}
          className="mt-3 text-[12px] text-slate-500 hover:text-slate-700
                     transition-colors duration-120 underline underline-offset-2"
        >
          Forgot password?
        </motion.button>

        {/* ─── WHAT YOU CAN DO HERE ────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-2xl"
        >
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className="glass-panel p-4 flex flex-col items-center gap-2 text-center"
            >
              <f.icon className="w-5 h-5 text-brand-light" />
              <p className="text-[12px] font-semibold text-slate-700">{f.label}</p>
              <p className="text-[11px] text-slate-500 leading-snug">{f.detail}</p>
            </div>
          ))}
        </motion.div>
      </main>

      {/* ─── PUBLIC STATS — only renders if API returns showPublicStats: true ── */}
      <PublicStatsSection />

      {/* ─── HELP DESK ──────────────────────────────────────────────────────── */}
      <section className="relative z-10 border-t border-slate-200 py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-7">
            <Phone className="w-4 h-4 text-slate-400" />
            <p className="text-[12px] font-semibold text-slate-500 uppercase tracking-widest">
              Need Assistance?
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {HELP_DESKS.map((h, i) => (
              <motion.button
                key={i}
                whileHover={{ y: -2 }}
                className="glass-panel p-4 flex flex-col items-center gap-2 text-center
                           hover:border-slate-300 transition-all duration-[120ms]"
              >
                <h.icon className="w-5 h-5 text-slate-400" />
                <p className="text-[11px] font-semibold text-slate-600">{h.label}</p>
                <p className="text-[10px] text-slate-500 leading-snug">{h.detail}</p>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─────────────────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-slate-200 py-4 px-6 text-center">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4
                        text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            Working hours: Mon–Sat, 9:00 AM – 5:00 PM
          </span>
          <span className="hidden sm:block text-slate-300">·</span>
          <span>Campus Complaint Management System</span>
        </div>
      </footer>
    </div>
  );
}
