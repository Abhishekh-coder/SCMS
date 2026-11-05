import React, { useState, useEffect } from 'react';
import { 
  X, 
  PlusCircle, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  ChevronDown, 
  ChevronRight,
  ChevronLeft,
  Copy, 
  Check, 
  ArrowRight,
  ShieldAlert,
  Building,
  Upload,
  FileText,
  Trash2,
  HelpCircle,
  Clock,
  Sparkles,
  MapPin
} from 'lucide-react';
import apiClient from '../../core/api/apiClient';
import { CAMPUS_BUILDINGS } from '../analytics/data/ccmsAnalyticsData';

const CATEGORIES = [
  { value: 'ACADEMICS', label: 'Academics & Curriculum', desc: 'Syllabus, lecture schedules, study material' },
  { value: 'FACULTY', label: 'Faculty & Classroom', desc: 'Teaching support, class coordination' },
  { value: 'ATTENDANCE', label: 'Attendance Records', desc: 'Discrepancies in attendance or portal logs' },
  { value: 'EXAM', label: 'Examinations & Results', desc: 'Exam schedules, hall tickets, re-evaluations' },
  { value: 'HOSTEL', label: 'Hostel Maintenance', desc: 'Room repairs, hot water, hygiene, hostel rules' },
  { value: 'FACILITIES', label: 'Campus Infrastructure', desc: 'Projectors, electrical, AC, desks, sanitation' },
  { value: 'TRANSPORT', label: 'College Transport', desc: 'Bus timings, bus routes, transport pass' },
  { value: 'SECURITY', label: 'Security & Safety', desc: 'Campus safety, entry passes, lost and found' },
  { value: 'MESS_FOOD', label: 'Mess & Food Services', desc: 'Canteen food quality, meal timings, cafeteria' },
  { value: 'IT_SERVICES', label: 'IT & Wi-Fi Support', desc: 'Campus Wi-Fi, computer labs, student portal' },
];

const SCOPES = [
  { value: 'MY_CLASS', label: 'Classroom Issue (Affects my class division)' },
  { value: 'ONLY_ME', label: 'Individual Issue (Affects only me)' },
  { value: 'MULTIPLE_CLASSES', label: 'Multiple Divisions (Shared classrooms / common halls)' },
  { value: 'CAMPUS_WIDE', label: 'Campus-Wide Disruption (Affects entire campus)' },
];

const FLOORS = [
  'Ground Floor',
  '1st Floor',
  '2nd Floor',
  '3rd Floor',
  '4th Floor',
  'Basement / Parking',
  'Outdoor Campus Grounds'
];

export default function RegisterComplaintModal({ onClose, onSuccess, onViewComplaint, defaultBuilding }) {
  // Wizard steps: 1: Category -> 2: Details -> 3: Location -> 4: Evidence -> 5: Review
  const [currentStep, setCurrentStep] = useState(1);

  // Form State
  const [category, setCategory] = useState('FACILITIES');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [affectedScope, setAffectedScope] = useState('MY_CLASS');
  const [hasSafetyRisk, setHasSafetyRisk] = useState(false);

  // Location State
  const [building, setBuilding] = useState(defaultBuilding?.name || 'Academic Complex');
  const [floor, setFloor] = useState('2nd Floor');
  const [room, setRoom] = useState('');

  // Evidence / Attachment State
  const [attachedFile, setAttachedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [fileError, setFileError] = useState('');

  // Submission & Validation States
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [createdComplaint, setCreatedComplaint] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // Draft Auto-Restore from sessionStorage
  useEffect(() => {
    try {
      const savedDraft = sessionStorage.getItem('ccms_complaint_draft');
      if (savedDraft) {
        const d = JSON.parse(savedDraft);
        if (d.category) setCategory(d.category);
        if (d.subject) setSubject(d.subject);
        if (d.description) setDescription(d.description);
        if (d.affectedScope) setAffectedScope(d.affectedScope);
        if (d.hasSafetyRisk !== undefined) setHasSafetyRisk(d.hasSafetyRisk);
        if (d.building) setBuilding(d.building);
        if (d.floor) setFloor(d.floor);
        if (d.room) setRoom(d.room);
      }
    } catch (e) {
      // Ignore draft restore errors
    }
  }, []);

  // Draft Auto-Save to sessionStorage
  useEffect(() => {
    if (createdComplaint) {
      sessionStorage.removeItem('ccms_complaint_draft');
      return;
    }
    const draftData = { category, subject, description, affectedScope, hasSafetyRisk, building, floor, room };
    try {
      sessionStorage.setItem('ccms_complaint_draft', JSON.stringify(draftData));
    } catch (e) {}
  }, [category, subject, description, affectedScope, hasSafetyRisk, building, floor, room, createdComplaint]);

  // Handle File Upload & Validation (Max 5MB, JPG/PNG/WEBP/PDF)
  const handleFileChange = (e) => {
    setFileError('');
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setFileError('Invalid file type. Supported formats: JPG, PNG, WEBP, or PDF.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFileError('File exceeds 5MB size limit. Please upload a smaller file.');
      return;
    }

    setAttachedFile(file);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setFilePreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const handleRemoveFile = () => {
    setAttachedFile(null);
    setFilePreview(null);
    setFileError('');
  };

  // Step Validation
  const validateStep = (step) => {
    setError('');
    if (step === 1) {
      if (!category) {
        setError('Please choose an issue category to proceed.');
        return false;
      }
      return true;
    }
    if (step === 2) {
      if (!subject.trim() || subject.trim().length < 5) {
        setError('Please describe the problem summary in at least 5 characters.');
        return false;
      }
      if (!description.trim() || description.trim().length < 10) {
        setError('Please provide more details in the description (at least 10 characters).');
        return false;
      }
      return true;
    }
    if (step === 3) {
      if (!building) {
        setError('Please select a campus building.');
        return false;
      }
      return true;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setError('');
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  const handleCloseAttempt = () => {
    if (createdComplaint) {
      onClose();
      return;
    }
    if (subject.trim() || description.trim() || room.trim()) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  };

  const handleConfirmDiscard = () => {
    sessionStorage.removeItem('ccms_complaint_draft');
    setShowDiscardConfirm(false);
    onClose();
  };

  // Final Submission
  const handleSubmit = async () => {
    setError('');
    setSubmitting(true);

    const fullDescription = room.trim() 
      ? `${description.trim()}\n\n[Location Context: ${building}, ${floor}, Room/Area: ${room.trim()}]`
      : `${description.trim()}\n\n[Location Context: ${building}, ${floor}]`;

    try {
      const idempotencyKey = `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      const res = await apiClient.post('/complaints', {
        categoryCode: category,
        title: subject.trim(),
        description: fullDescription,
        affectedScope,
        hasSafetyRisk,
        location: {
          buildingCode: building,
          roomCode: room.trim() || floor
        }
      }, {
        headers: {
          'idempotency-key': idempotencyKey
        }
      });

      if (!res || !res.success) {
        throw new Error(res?.message || res?.error?.message || 'Failed to submit complaint.');
      }

      sessionStorage.removeItem('ccms_complaint_draft');
      setCreatedComplaint(res.data);
      if (onSuccess) onSuccess();

    } catch (err) {
      setError(err.message || 'Unable to submit complaint. Please check your network and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyCode = () => {
    const code = createdComplaint?.complaintCode || createdComplaint?.complaintUuid || '';
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedCategoryObj = CATEGORIES.find(c => c.value === category) || CATEGORIES[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div 
        className="w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 text-slate-800 relative max-h-[92vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        
        {/* ── Modal Header & Progress Indicator ── */}
        <div className="flex items-center justify-between pb-5 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 id="modal-title" className="text-xl font-bold text-slate-900 tracking-tight">
                {createdComplaint ? 'Complaint Registered' : 'Report a Campus Issue'}
              </h2>
              <p className="text-xs text-slate-500">
                {createdComplaint 
                  ? 'Your case is officially recorded in the institutional ledger' 
                  : `Step ${currentStep} of 5 • Simple guided submission`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCloseAttempt}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer shrink-0"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Discard Confirmation Prompt ── */}
        {showDiscardConfirm && (
          <div className="mt-4 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-3">
            <div className="flex items-center gap-2 font-bold">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Discard unsaved complaint draft?</span>
            </div>
            <p className="text-[11px] text-amber-700">
              You have entered complaint details. Your draft will be saved in your browser session if you keep it.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowDiscardConfirm(false)}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs"
              >
                Keep Editing
              </button>
              <button
                type="button"
                onClick={handleConfirmDiscard}
                className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs"
              >
                Discard Draft
              </button>
            </div>
          </div>
        )}

        {/* ── Step Progress Indicator Bar (Visible when not submitted) ── */}
        {!createdComplaint && (
          <div className="py-4 border-b border-slate-200">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-2">
              <span className={currentStep >= 1 ? 'text-blue-600 font-bold' : ''}>1. Category</span>
              <span className={currentStep >= 2 ? 'text-blue-600 font-bold' : ''}>2. Problem</span>
              <span className={currentStep >= 3 ? 'text-blue-600 font-bold' : ''}>3. Location</span>
              <span className={currentStep >= 4 ? 'text-blue-600 font-bold' : ''}>4. Evidence</span>
              <span className={currentStep >= 5 ? 'text-blue-600 font-bold' : ''}>5. Review</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-blue-600 h-full transition-all duration-300"
                style={{ width: `${(currentStep / 5) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* ── Inline Error Alert ── */}
        {error && (
          <div className="mt-4 p-4 rounded-2xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700 flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ── POST-SUBMISSION CONFIRMATION & TRACKING SCREEN ── */}
        {createdComplaint ? (
          <div className="py-6 space-y-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl font-bold text-slate-900">Grievance Submitted Successfully</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Your issue has been assigned an official tracking code and dispatched to the designated authority according to institutional SLA rules.
              </p>
            </div>

            {/* Generated Complaint ID Card */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 max-w-sm mx-auto space-y-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Official Complaint ID</span>
              <div className="flex items-center justify-center gap-2">
                <span className="font-mono text-base font-bold text-blue-600">
                  {createdComplaint.complaintCode || createdComplaint.complaintUuid}
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition cursor-pointer"
                  title="Copy ID to Clipboard"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              {copied && <span className="text-[10px] font-semibold text-emerald-600 block">Copied to clipboard!</span>}
            </div>

            {/* Next Steps Explanation */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-2 max-w-md mx-auto">
              <p className="font-bold text-slate-800 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>What Happens Next?</span>
              </p>
              <ul className="space-y-1.5 text-slate-600 text-[11px] list-disc list-inside">
                <li>Your designated Class Incharge or Department Head will review this case within 24 hours.</li>
                <li>You will receive real-time notifications in your Notification Center as actions are taken.</li>
                <li>Once resolved, you will have the opportunity to accept the resolution or request an appeal.</li>
              </ul>
            </div>

            {/* Confirmation Action Buttons */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-6 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                Close Window
              </button>
              {onViewComplaint && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onViewComplaint(createdComplaint);
                  }}
                  className="py-2.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Track This Complaint</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ) : (
          /* ── MAIN MULTI-STEP WIZARD CONTENT ── */
          <div className="mt-5 space-y-5">
            
            {/* STEP 1: CATEGORY SELECTION */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-1">
                    Select Issue Category <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-slate-500">
                    Choosing the right category ensures your grievance is instantly routed to the correct campus department.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[360px] overflow-y-auto pr-1">
                  {CATEGORIES.map((cat) => {
                    const isSelected = category === cat.value;
                    return (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setCategory(cat.value)}
                        className={`p-3.5 rounded-xl text-left border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50 border-blue-500 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-xs font-bold ${isSelected ? 'text-blue-700' : 'text-slate-900'}`}>
                            {cat.label}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                        </div>
                        <p className="text-[11px] text-slate-500 leading-snug">{cat.desc}</p>
                      </button>
                    );
                  })}
                </div>

                {/* Scope selector */}
                <div className="pt-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    How widely does this issue impact students?
                  </label>
                  <select
                    value={affectedScope}
                    onChange={(e) => setAffectedScope(e.target.value)}
                    className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    {SCOPES.map((sc) => (
                      <option key={sc.value} value={sc.value}>{sc.label}</option>
                    ))}
                  </select>
                </div>

                {/* Safety hazard checkbox */}
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <input
                    type="checkbox"
                    id="safetyRisk"
                    checked={hasSafetyRisk}
                    onChange={(e) => setHasSafetyRisk(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 bg-white text-red-600 focus:ring-red-500 cursor-pointer"
                  />
                  <label htmlFor="safetyRisk" className="text-xs font-semibold text-amber-900 cursor-pointer select-none">
                    Immediate Safety or Physical Hazard Risk (e.g. exposed live wiring, water leakage, structural hazard)
                  </label>
                </div>
              </div>
            )}

            {/* STEP 2: PROBLEM DESCRIPTION */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-1">
                    Describe the Problem <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-slate-500">
                    Be specific about what is broken, missing, or needs attention.
                  </p>
                </div>

                {/* Subject Input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Problem Summary / Subject <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[11px] text-slate-400 font-mono">{subject.length}/100</span>
                  </div>
                  <input
                    type="text"
                    maxLength={100}
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Ceiling fan not working in Class 204 or Projector lamp failure"
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                    required
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Please provide a clear title (at least 5 characters).</p>
                </div>

                {/* Description Textarea */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Detailed Description <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[11px] text-slate-400 font-mono">{description.length}/2000</span>
                  </div>
                  <textarea
                    rows={5}
                    maxLength={2000}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Explain what happened, where you observed it, when it started, and any symptoms observed..."
                    className="w-full p-3.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 resize-y"
                    required
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Provide sufficient detail so the technician or faculty can reproduce or locate the issue (at least 10 characters).</p>
                </div>
              </div>
            )}

            {/* STEP 3: LOCATION SELECTOR */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-1">
                    Select Campus Location <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-slate-500">
                    Connect the complaint to a specific campus building and room so staff can reach the site directly.
                  </p>
                </div>

                {/* Building Dropdown */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Campus Facility / Building <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={building}
                    onChange={(e) => setBuilding(e.target.value)}
                    className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    {CAMPUS_BUILDINGS.map((b) => (
                      <option key={b.id} value={b.name}>{b.name} (Zone {b.zone} • {b.type})</option>
                    ))}
                  </select>
                </div>

                {/* Floor Level Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Floor / Block Level
                  </label>
                  <select
                    value={floor}
                    onChange={(e) => setFloor(e.target.value)}
                    className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    {FLOORS.map((fl) => (
                      <option key={fl} value={fl}>{fl}</option>
                    ))}
                  </select>
                </div>

                {/* Specific Room / Area Identifier */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Room No., Lab Name, or Landmark (Optional)
                  </label>
                  <input
                    type="text"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    placeholder="e.g. Room 204, Software Lab 2, Girls Washroom East Wing"
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {/* STEP 4: EVIDENCE / ATTACHMENT */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-1">
                    Attach Supporting Evidence (Optional)
                  </label>
                  <p className="text-xs text-slate-500">
                    A photo or document helps maintenance teams identify required replacement parts before dispatching.
                  </p>
                </div>

                {/* Upload Box */}
                <div className="p-6 border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-2xl bg-slate-50 text-center space-y-3 transition">
                  <div className="w-12 h-12 rounded-2xl bg-white text-blue-600 border border-slate-200 flex items-center justify-center mx-auto shadow-xs">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <label 
                      htmlFor="evidenceFile" 
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer underline"
                    >
                      Click here to select a file
                    </label>
                    <p className="text-[11px] text-slate-400 mt-1">Supports PNG, JPG, WEBP, or PDF up to 5MB</p>
                  </div>
                  <input
                    type="file"
                    id="evidenceFile"
                    onChange={handleFileChange}
                    accept="image/png, image/jpeg, image/webp, application/pdf"
                    className="hidden"
                  />
                </div>

                {fileError && (
                  <p className="text-xs text-red-600 font-semibold">{fileError}</p>
                )}

                {/* Preview Card */}
                {attachedFile && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {filePreview ? (
                        <img 
                          src={filePreview} 
                          alt="Evidence preview" 
                          className="w-12 h-12 object-cover rounded-lg border border-slate-200" 
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-white text-slate-400 flex items-center justify-center border border-slate-200">
                          <FileText className="w-6 h-6" />
                        </div>
                      )}
                      <div className="space-y-0.5 text-xs">
                        <p className="font-bold text-slate-900 max-w-[200px] truncate">{attachedFile.name}</p>
                        <p className="text-[11px] text-slate-400">{(attachedFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-200 transition cursor-pointer"
                      title="Remove File"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* STEP 5: REVIEW INFORMATION & SUBMIT */}
            {currentStep === 5 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-1">
                    Review Information Before Submission
                  </label>
                  <p className="text-xs text-slate-500">
                    Verify that your entered grievance details and location are accurate.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Category & Department</span>
                    <p className="font-bold text-blue-600 text-sm">{selectedCategoryObj.label}</p>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Problem Subject</span>
                    <p className="font-semibold text-slate-900">{subject}</p>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Location</span>
                    <p className="font-semibold text-slate-800">
                      {building} • {floor} {room && `• Room: ${room}`}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Description Summary</span>
                    <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{description}</p>
                  </div>

                  {attachedFile && (
                    <div className="pt-1 flex items-center gap-2 text-emerald-600 font-semibold">
                      <Check className="w-3.5 h-3.5" />
                      <span>Attached: {attachedFile.name}</span>
                    </div>
                  )}

                  {hasSafetyRisk && (
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-bold flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Marked with immediate safety hazard flag (triggers priority escalation).</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── FOOTER NAVIGATION CONTROLS ── */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={submitting}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCloseAttempt}
                  disabled={submitting}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
              )}

              {currentStep < 5 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Continue</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-7 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition flex items-center gap-2 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting Grievance...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm & Submit</span>
                    </>
                  )}
                </button>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
