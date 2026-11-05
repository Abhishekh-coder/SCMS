import React, { useState, useEffect } from 'react';
import { ShieldCheck, AlertCircle, CheckCircle2, Loader2, RefreshCw, Edit3, X } from 'lucide-react';

function maskEmail(emailStr = '') {
  if (!emailStr || !emailStr.includes('@')) return emailStr;
  const [name, domain] = emailStr.split('@');
  if (name.length <= 2) return `${name[0]}***@${domain}`;
  return `${name[0]}***${name[name.length - 1]}@${domain}`;
}

export default function VerifyEmailForm({
  email: initialEmail,
  initialDevOtpCode,
  onVerified,
  onBackToLogin,
}) {
  const [email, setEmail] = useState(initialEmail || '');
  const [otp, setOtp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [resendMsg, setResendMsg] = useState(null);
  const [devOtpCode, setDevOtpCode] = useState(initialDevOtpCode || '');

  // Cooldown timer
  const [cooldown, setCooldown] = useState(60);
  const [resendLoading, setResendLoading] = useState(false);

  // Change email modal
  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState('');
  const [changePasswordInput, setChangePasswordInput] = useState('');
  const [changeEmailLoading, setChangeEmailLoading] = useState(false);
  const [changeEmailError, setChangeEmailError] = useState(null);

  useEffect(() => {
    setEmail(initialEmail || '');
  }, [initialEmail]);

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    if (otp.length !== 6) {
      setError('Enter the 6-digit verification code.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/v1/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otpCode: otp.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || json.message || 'Verification failed.');
      }
      setIsSubmitting(false);
      onVerified();
    } catch (err) {
      setIsSubmitting(false);
      setError(err.message || 'Invalid or expired verification code.');
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resendLoading) return;
    setResendLoading(true);
    setResendMsg(null);
    setError('');

    try {
      const res = await fetch('/api/v1/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || json.message || 'Failed to resend code.');
      }
      if (json.data?.devOtpCode) {
        setDevOtpCode(json.data.devOtpCode);
      }
      setResendMsg('A new verification code has been sent to your email address.');
      setCooldown(60);
    } catch (err) {
      setError(err.message);
    } finally {
      setResendLoading(false);
    }
  };

  const handleChangeEmailSubmit = async (e) => {
    e.preventDefault();
    setChangeEmailError(null);
    if (!newEmailInput.trim() || !changePasswordInput) {
      setChangeEmailError('New email address and password are required.');
      return;
    }
    setChangeEmailLoading(true);
    try {
      const res = await fetch('/api/v1/auth/change-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentEmail: email,
          password: changePasswordInput,
          newEmail: newEmailInput.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || json.message || 'Failed to update email address.');
      }
      setEmail(newEmailInput.trim());
      if (json.data?.devOtpCode) {
        setDevOtpCode(json.data.devOtpCode);
      }
      setShowChangeEmail(false);
      setChangePasswordInput('');
      setNewEmailInput('');
      setCooldown(60);
      setResendMsg('Email updated successfully. Verification code dispatched to new email.');
    } catch (err) {
      setChangeEmailError(err.message);
    } finally {
      setChangeEmailLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl lg:text-4xl font-bold text-slate-950 tracking-[-0.03em]">
          Verify your email
        </h1>
        <div className="flex items-center justify-between mt-2">
          <p className="text-base text-slate-500">
            Code sent to{' '}
            <span className="font-semibold text-slate-800">
              {maskEmail(email)}
            </span>
          </p>
          <button
            type="button"
            onClick={() => setShowChangeEmail(true)}
            className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-semibold"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Change</span>
          </button>
        </div>
      </div>

      {resendMsg && (
        <div className="mb-6 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800 flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{resendMsg}</span>
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700 flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {devOtpCode && (
        <div className="mb-6 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
          <span>Dev Test OTP Code: <strong className="font-mono text-sm tracking-wider">{devOtpCode}</strong></span>
          <button
            type="button"
            onClick={() => setOtp(devOtpCode)}
            className="text-xs font-bold text-amber-800 underline hover:text-amber-950"
          >
            Auto-fill
          </button>
        </div>
      )}

      <form onSubmit={handleVerify} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-slate-800 mb-2">
            6-digit verification code
          </label>
          <input
            value={otp}
            maxLength={6}
            inputMode="numeric"
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            placeholder="1 2 3 4 5 6"
            className="w-full h-16 rounded-xl border border-slate-200 text-center font-mono text-2xl tracking-[0.5em] text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50/80 transition"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || otp.length !== 6}
          className="w-full h-14 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white font-semibold text-base transition shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Verifying...</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-5 h-5" />
              <span>Verify & Activate Account</span>
            </>
          )}
        </button>
      </form>

      <div className="flex justify-between items-center mt-7 text-sm font-medium">
        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0 || resendLoading}
          className="text-blue-600 hover:text-blue-700 disabled:text-slate-400 flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${resendLoading ? 'animate-spin' : ''}`} />
          <span>{cooldown > 0 ? `Resend Code (${cooldown}s)` : 'Resend Code'}</span>
        </button>

        <button
          type="button"
          onClick={onBackToLogin}
          className="text-slate-600 hover:text-slate-900 cursor-pointer"
        >
          Back to Sign In
        </button>
      </div>

      {/* Change Email Modal */}
      {showChangeEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900">Change Unverified Email</h3>
              <button
                onClick={() => setShowChangeEmail(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {changeEmailError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{changeEmailError}</span>
              </div>
            )}

            <form onSubmit={handleChangeEmailSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Current Email</label>
                <input
                  type="text"
                  value={email}
                  disabled
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">New Email Address</label>
                <input
                  type="email"
                  value={newEmailInput}
                  onChange={(e) => setNewEmailInput(e.target.value)}
                  placeholder="newstudent@college.edu"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Account Password (For Security)</label>
                <input
                  type="password"
                  value={changePasswordInput}
                  onChange={(e) => setChangePasswordInput(e.target.value)}
                  placeholder="Enter password"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowChangeEmail(false)}
                  className="flex-1 py-2 px-3 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={changeEmailLoading}
                  className="flex-1 py-2 px-3 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  {changeEmailLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Update & Resend'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
