import React, { useState, useMemo, useCallback } from 'react';
import { X, Send, Building2, AlertCircle, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '../../core/api/apiClient';

const CATEGORY_TREE = {
  ACADEMICS: {
    label: 'Academics & Exams',
    subcategories: [
      { key: 'FACULTY_BEHAVIOUR', label: 'Faculty Behaviour & Conduct' },
      { key: 'ATTENDANCE', label: 'Attendance Discrepancy' },
      { key: 'SEMESTER_EXAM', label: 'Semester Exam Issue' },
      { key: 'RESULTS_GRADES', label: 'Results & Grade Card' }
    ]
  },
  HOSTEL_MESS: {
    label: 'Hostel & Mess Facilities',
    subcategories: [
      { key: 'FOOD_HYGIENE', label: 'Food Quality & Hygiene' },
      { key: 'ROOM_MAINTENANCE', label: 'Room Furniture & Repairs' },
      { key: 'UTILITIES', label: 'Electricity & Water Supply' },
      { key: 'WARDEN_ASSISTANCE', label: 'Warden Assistance' }
    ]
  },
  IT_SERVICES: {
    label: 'IT & Campus Connectivity',
    subcategories: [
      { key: 'WIFI_ACCESS', label: 'Wi-Fi Network Access' },
      { key: 'ERP_PORTAL', label: 'ERP Portal Access Error' },
      { key: 'LAB_WORKSTATION', label: 'Computer Lab Workstation' }
    ]
  },
  LIBRARY: {
    label: 'Library Services',
    subcategories: [
      { key: 'DIGITAL_RESOURCE', label: 'Digital Portal & E-Journals' },
      { key: 'BOOK_CIRCULATION', label: 'Book Circulation & Fine' }
    ]
  },
  TRANSPORT: {
    label: 'Campus Transport',
    subcategories: [
      { key: 'BUS_TIMING', label: 'Bus Route & Schedule' },
      { key: 'PASS_RENEWAL', label: 'Bus Pass Renewal' }
    ]
  },
  SCHOLARSHIP_FEES: {
    label: 'Fees & Scholarship',
    subcategories: [
      { key: 'FEE_RECEIPT', label: 'Fee Receipt Discrepancy' },
      { key: 'SCHOLARSHIP_VERIFY', label: 'Scholarship Document Verification' }
    ]
  },
  CAMPUS_SAFETY: {
    label: 'Campus Safety & Redressal',
    subcategories: [
      { key: 'RAGGING_PREVENTION', label: 'Anti-Ragging Redressal' },
      { key: 'HARASSMENT_REDRESSAL', label: 'Harassment Redressal' },
      { key: 'SECURITY_PATROL', label: 'Campus Security Patrol' }
    ]
  },
  GENERAL_OTHER: {
    label: 'General & Other',
    subcategories: [
      { key: 'GENERAL_INQUIRY', label: 'General Campus Inquiry' },
      { key: 'OTHER_FACILITIES', label: 'Other Campus Facilities' }
    ]
  }
};

const NewComplaintModal = React.memo(function NewComplaintModal({ isOpen, onClose, onComplaintCreated }) {
  const [categoryKey, setCategoryKey] = useState('ACADEMICS');
  const [subcategoryKey, setSubcategoryKey] = useState('FACULTY_BEHAVIOUR');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [createdResponse, setCreatedResponse] = useState(null);

  const categoryKeys = useMemo(() => Object.keys(CATEGORY_TREE), []);
  const currentCategory = useMemo(() => CATEGORY_TREE[categoryKey] || CATEGORY_TREE.ACADEMICS, [categoryKey]);

  const handleCategoryChange = useCallback((newCat) => {
    setCategoryKey(newCat);
    const firstSub = CATEGORY_TREE[newCat]?.subcategories[0]?.key || 'GENERAL_INQUIRY';
    setSubcategoryKey(firstSub);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (title.trim().length < 5) {
      setError('Complaint title must be at least 5 characters long.');
      return;
    }

    if (description.trim().length < 20) {
      setError('Description must be at least 20 characters long to provide clear details.');
      return;
    }

    setIsSubmitting(true);

    try {
      const idempotencyKey = crypto.randomUUID();
      const res = await apiClient.post('/complaints', {
        title: title.trim(),
        description: description.trim(),
        categoryCode: categoryKey,
        subcategoryCode: subcategoryKey,
        departmentHint: 'IT'
      }, {
        headers: {
          'Idempotency-Key': idempotencyKey
        }
      });

      setIsSubmitting(false);
      setCreatedResponse(res.data);

      if (onComplaintCreated) {
        onComplaintCreated(res.data);
      }
    } catch (err) {
      setIsSubmitting(false);
      setError('Unable to register complaint. Please try again. If the issue persists, contact IT Cell.');
    }
  };

  const handleModalClose = useCallback(() => {
    setTitle('');
    setDescription('');
    setError(null);
    setCreatedResponse(null);
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  const fieldClasses = 'w-full p-3 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none disabled:opacity-50';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="glass-panel w-full max-w-xl p-6 border-blue-200 bg-white shadow-2xl relative space-y-6"
        >
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Register Campus Complaint</h2>
            </div>
            <button
              onClick={handleModalClose}
              disabled={isSubmitting}
              className="text-slate-400 hover:text-slate-700 disabled:opacity-50 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* ─── SUCCESS CONFIRMATION ─── */}
          {createdResponse ? (
            <div className="space-y-4 py-2">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h3 className="text-base font-bold text-slate-900">Complaint Registered Successfully</h3>
                <p className="text-xs font-mono text-emerald-600 font-bold">{createdResponse.complaintCode}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Priority:</span>
                  <span className="font-bold text-amber-600 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    {createdResponse.priority || 'MEDIUM'} (Determined by AI)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Assigned Handler:</span>
                  <span className="font-semibold text-slate-800">{createdResponse.assignedToName || 'Teacher Guardian'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Estimated Resolution SLA:</span>
                  <span className="font-mono text-cyan-600">24 Hours</span>
                </div>
              </div>

              <button
                onClick={handleModalClose}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer"
              >
                Back to Dashboard
              </button>
            </div>
          ) : (
            /* ─── REGISTRATION FORM ─── */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Complaint Title
                </label>
                <input
                  type="text"
                  required
                  disabled={isSubmitting}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="State the issue (at least 5 characters)..."
                  className={fieldClasses}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={categoryKey}
                    disabled={isSubmitting}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className={fieldClasses}
                  >
                    {categoryKeys.map(catKey => (
                      <option key={catKey} value={catKey}>
                        {CATEGORY_TREE[catKey].label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Subcategory
                  </label>
                  <select
                    value={subcategoryKey}
                    disabled={isSubmitting}
                    onChange={(e) => setSubcategoryKey(e.target.value)}
                    className={fieldClasses}
                  >
                    {currentCategory.subcategories.map(sub => (
                      <option key={sub.key} value={sub.key}>
                        {sub.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Detailed Description
                </label>
                <textarea
                  required
                  rows={4}
                  disabled={isSubmitting}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the specific issue, room number, or affected campus area in detail (at least 20 characters)..."
                  className={fieldClasses}
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleModalClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-gradient px-6 py-2.5 text-xs font-bold flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting…</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Complaint</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
});

export default NewComplaintModal;
