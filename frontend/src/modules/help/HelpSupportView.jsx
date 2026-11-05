import React, { useState } from 'react';
import { 
  HelpCircle, 
  Phone, 
  Mail, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck, 
  BookOpen, 
  Home, 
  GraduationCap, 
  Bus, 
  Wrench,
  AlertCircle,
  FileCheck2,
  ExternalLink
} from 'lucide-react';

export default function HelpSupportView({ onOpenRegister }) {
  const [openFaq, setOpenFaq] = useState(0);

  const HELP_DESKS = [
    { icon: HelpCircle,    title: 'Central IT Cell',         phone: '+91 (022) 2854-0001', email: 'it.helpdesk@college.edu', scope: 'Portal access, Wi-Fi, ERP logins' },
    { icon: Home,          title: 'Hostel Administration',    phone: '+91 (022) 2854-0002', email: 'hostel.admin@college.edu', scope: 'Room maintenance, mess food, water supply' },
    { icon: GraduationCap, title: 'Academic Secretariat',    phone: '+91 (022) 2854-0003', email: 'academic.cell@college.edu', scope: 'Curriculum, grade sheets, attendance disputes' },
    { icon: Bus,           title: 'Campus Transport Desk',   phone: '+91 (022) 2854-0004', email: 'transport@college.edu',     scope: 'College buses, bus passes, shuttle timings' },
    { icon: Wrench,        title: 'Estate & Campus Services', phone: '+91 (022) 2854-0005', email: 'estate.services@college.edu', scope: 'Classroom projectors, electrical, carpentry' },
    { icon: ShieldCheck,   title: 'Anti-Ragging & Security',  phone: '+91 (022) 2854-0099', email: 'security.cell@college.edu', scope: 'Emergency campus safety, 24/7 helpline' },
  ];

  const FAQS = [
    {
      q: 'How does the automated escalation and SLA work?',
      a: 'When you submit a complaint, it is automatically routed to your Class Incharge or designated operational coordinator with a 24-hour response SLA. If unresolved within the threshold, it escalates to the Teacher Guardian (48h), then to the Head of Department (HOD, 72h), Dean, and finally to the Principal.'
    },
    {
      q: 'What if I am unsatisfied with the resolution of my complaint?',
      a: 'After a complaint is marked RESOLVED, you have the right to review the resolution notes. If your issue is not adequately fixed, you can click "Request Reconsideration". This automatically appeals the case and escalates it to the next higher administrative tier.'
    },
    {
      q: 'Are my complaints visible to other students?',
      a: 'No. Academic and personal complaints are private and strictly partitioned. Only authorized faculty and administrative handlers assigned to your division or department can review your grievance details and attachments.'
    },
    {
      q: 'Can I upload photos or documents as proof?',
      a: 'Yes. You can upload images (PNG, JPG, WEBP) or PDF documents up to 5MB during complaint submission or during repair updates to provide clear visual evidence of the problem.'
    },
    {
      q: 'How do I know when my complaint status changes?',
      a: 'CampusFix provides instant in-app alerts in your Notification Center as well as automated email notifications whenever an authority reviews, forwards, or resolves your case.'
    }
  ];

  return (
    <div className="space-y-8 w-full max-w-4xl mx-auto">
      
      {/* ── Header ── */}
      <div className="pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
            <HelpCircle className="w-4 h-4" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Help & Support Center</h2>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Direct campus department contacts, resolution guidelines, and answers to common questions.
        </p>
      </div>

      {/* ── Resolution Hierarchy Visual ── */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-blue-600" />
            <span>Complaint Lifecycle & Escalation Hierarchy</span>
          </h3>
          <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
            Automated SLA Engine
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Every complaint follows a structured multi-tier path. If an authority does not act within the SLA timeframe, the case automatically transitions to the next supervisor.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Tier 1</span>
            <p className="text-xs font-bold text-slate-900 mt-1">Class Incharge</p>
            <span className="text-[10px] text-amber-600 font-semibold">24 Hours SLA</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Tier 2</span>
            <p className="text-xs font-bold text-slate-900 mt-1">Teacher Guardian</p>
            <span className="text-[10px] text-amber-600 font-semibold">48 Hours SLA</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Tier 3</span>
            <p className="text-xs font-bold text-slate-900 mt-1">HOD</p>
            <span className="text-[10px] text-amber-600 font-semibold">72 Hours SLA</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Tier 4</span>
            <p className="text-xs font-bold text-slate-900 mt-1">Dean</p>
            <span className="text-[10px] text-amber-600 font-semibold">Institutional Review</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Tier 5</span>
            <p className="text-xs font-bold text-slate-900 mt-1">Principal</p>
            <span className="text-[10px] text-emerald-600 font-semibold">Terminal Authority</span>
          </div>
        </div>
      </div>

      {/* ── Contact Points Grid ── */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900">Campus Service Desks</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {HELP_DESKS.map((desk, idx) => {
            const Icon = desk.icon;
            return (
              <div 
                key={idx} 
                className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-300 transition shadow-xs space-y-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{desk.title}</h4>
                    <p className="text-[11px] text-slate-500">{desk.scope}</p>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1 text-xs border-t border-slate-100">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{desk.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <a href={`mailto:${desk.email}`} className="text-blue-600 hover:underline">
                      {desk.email}
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Frequently Asked Questions ── */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900">Frequently Asked Questions</h3>
        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-xs">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={idx} className="transition-colors">
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between text-left gap-4 hover:bg-slate-50 cursor-pointer"
                >
                  <span className="text-sm font-bold text-slate-900">{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-blue-600 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs text-slate-600 leading-relaxed bg-slate-50/50">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
