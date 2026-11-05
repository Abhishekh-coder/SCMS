import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../../../app/store/authStore';
import { useWorkspaceBootstrap } from '../../../core/workspace/useWorkspaceBootstrap.jsx';

export default function LoginForm({
  onRegister,
  onPendingVerification,
  successMessage,
}) {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuthStore();
  const { refreshBootstrap } = useWorkspaceBootstrap();

  const [credential, setCredential] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [clientError, setClientError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setClientError(null);
    if (clearError) clearError();

    const trimmed = credential.trim();
    if (!trimmed) {
      setClientError('Institutional Login ID or email is required.');
      return;
    }

    try {
      const result = await login(trimmed, password);
      if (refreshBootstrap) refreshBootstrap();
      navigate(result.redirectTo || '/dashboard', { replace: true });
    } catch (err) {
      if (err?.code === 'PENDING_VERIFICATION' || err?.details?.requiresVerification) {
        const emailToVerify = err?.details?.email || (trimmed.includes('@') ? trimmed : '');
        if (onPendingVerification) {
          onPendingVerification(emailToVerify);
        }
        return;
      }
    }
  };

  const displayError = clientError || error;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl lg:text-4xl font-bold tracking-[-0.03em] text-slate-950">
          Welcome back
        </h1>
        <p className="text-base text-slate-500 mt-1.5">
          Sign in with your institutional credentials
        </p>
      </div>

      {successMessage && (
        <div className="mb-6 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800 flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {displayError && (
        <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700 flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <span>{displayError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-slate-800 mb-2">
            Institutional Login ID
          </label>
          <input
            type="text"
            value={credential}
            onChange={(e) => setCredential(e.target.value)}
            placeholder="EMP-IT-0037 or 2024-IT-A-001-STD"
            className="w-full h-14 rounded-xl border border-slate-200 px-4 text-base text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50/80 transition"
            required
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-semibold text-slate-800">
              Password
            </label>
            <button
              type="button"
              onClick={() => alert('Password reset module: Please contact campus IT or verify your account.')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Forgot password?
            </button>
          </div>

          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full h-14 rounded-xl border border-slate-200 px-4 pr-12 text-base text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50/80 transition"
              required
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2.5 text-sm text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Remember me</span>
          </label>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-14 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white font-semibold text-base transition shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 cursor-pointer mt-4"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Signing In...</span>
            </>
          ) : (
            <>
              <Lock className="w-5 h-5" />
              <span>Sign In</span>
              <span className="ml-1">→</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
