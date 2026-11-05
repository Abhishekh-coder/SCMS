import React from 'react';

export default function AuthTabs({ activeView, onLogin, onRegister }) {
  const isLoginActive = activeView === 'LOGIN' || activeView === 'READY_TO_LOGIN';
  const isRegisterActive = activeView === 'REGISTER';

  return (
    <div className="grid grid-cols-2 p-1.5 bg-slate-100/90 rounded-2xl mb-8">
      <button
        type="button"
        onClick={onLogin}
        className={`py-2.5 text-sm font-semibold rounded-xl transition-all ${
          isLoginActive
            ? 'bg-white text-slate-900 shadow-sm'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        Sign In
      </button>

      <button
        type="button"
        onClick={onRegister}
        className={`py-2.5 text-sm font-semibold rounded-xl transition-all ${
          isRegisterActive
            ? 'bg-white text-slate-900 shadow-sm'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        Register
      </button>
    </div>
  );
}
