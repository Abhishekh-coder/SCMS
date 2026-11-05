import React, { useState } from 'react';
import { UserPlus, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';

export default function RegisterForm({ onSuccess, onLogin }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('STUDENT');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const calculatePasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: '', color: '#94a3b8' };
    let score = 0;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (score <= 2) return { score, label: 'Weak', color: '#dc2626' };
    if (score <= 3) return { score, label: 'Moderate', color: '#d97706' };
    return { score, label: 'Strong', color: '#059669' };
  };

  const strength = calculatePasswordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (fullName.trim().length < 2) {
      setError('Full name must be at least 2 characters long.');
      return;
    }
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=\[\]{}|;:',.<>\/])[A-Za-z\d@$!%*?&#^()_+\-=\[\]{}|;:',.<>\/]{12,64}$/;
    if (!pwdRegex.test(password)) {
      setError('Password must be 12-64 characters with an uppercase letter, a lowercase letter, a number, and a special character.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': `reg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
        },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          password,
          phone: phone.trim() || undefined,
          role,
          recaptchaToken: null
        })
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || json.message || 'Registration failed.');
      }
      setLoading(false);
      onSuccess({
        email: email.trim(),
        devOtpCode: json.data?.devOtpCode
      });
    } catch (err) {
      setLoading(false);
      setError(err.message);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl lg:text-4xl font-bold tracking-[-0.03em] text-slate-950">
          Create account
        </h1>
        <p className="text-base text-slate-500 mt-1.5">
          Register your institutional portal account
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700 flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1.5">
              Account Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full h-12 rounded-xl border border-slate-200 px-3 text-sm text-slate-900 bg-white outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50/80 transition"
            >
              <option value="STUDENT">Student</option>
              <option value="FACULTY">Faculty</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              className="w-full h-12 rounded-xl border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50/80 transition"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-1.5">
            Institutional Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="student@college.edu"
            className="w-full h-12 rounded-xl border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50/80 transition"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-1.5">
            Phone Number (Optional)
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="08591539873"
            className="w-full h-12 rounded-xl border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50/80 transition"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 12 chars"
                className="w-full h-12 rounded-xl border border-slate-200 px-3 pr-10 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50/80 transition"
                required
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1.5">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              className="w-full h-12 rounded-xl border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50/80 transition"
              required
            />
          </div>
        </div>

        {password && (
          <div className="flex items-center gap-2 text-xs pt-1">
            <div className="flex gap-1 flex-1">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className="h-1 flex-1 rounded-full transition-colors"
                  style={{
                    backgroundColor: step <= strength.score ? strength.color : '#e2e8f0'
                  }}
                />
              ))}
            </div>
            <span className="font-semibold" style={{ color: strength.color }}>
              {strength.label}
            </span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full h-14 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white font-semibold text-base transition shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 cursor-pointer mt-4"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Creating Account...</span>
            </>
          ) : (
            <>
              <UserPlus className="w-5 h-5" />
              <span>Create Account</span>
              <span className="ml-1">→</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
