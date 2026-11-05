import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import AuthBrand from './AuthBrand';
import AuthTabs from './AuthTabs';
import RoleCard from './RoleCard';
import SecurityFooter from './SecurityFooter';
import '../styles/auth.css';

export default function AuthShell({
  children,
  activeView,
  onLogin,
  onRegister,
}) {
  const navigate = useNavigate();

  const isAuthForm =
    activeView === 'LOGIN' ||
    activeView === 'REGISTER' ||
    activeView === 'READY_TO_LOGIN';

  return (
    <main className="min-h-screen bg-[#f7f9fc] p-4 sm:p-6 lg:p-10 flex items-center justify-center font-sans antialiased">
      <div className="w-full max-w-[1440px] min-h-[760px] bg-white rounded-[28px] overflow-hidden shadow-[0_20px_60px_rgba(15,23,42,0.08)] grid lg:grid-cols-[0.9fr_1.1fr]">

        {/* LEFT PANEL */}
        <section className="bg-[#f7faff] px-8 py-10 lg:px-14 lg:py-12 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-100">
          <AuthBrand />

          <div className="flex-1 flex flex-col justify-center max-w-[480px] my-8 lg:my-0">
            <p className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-[-0.03em] text-slate-950">
              One Login
            </p>

            <p className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-[-0.03em] text-blue-600 mt-1">
              All Campus Access
            </p>

            <div className="w-11 h-1 bg-blue-600 rounded-full mt-6 mb-6" />

            <p className="text-base sm:text-lg leading-relaxed text-slate-500">
              Access academic, administrative and operational services with your institutional identity.
            </p>

            <div className="mt-8 space-y-3.5">
              <RoleCard
                type="student"
                title="Students"
                subtitle="Access your academic portal"
                onClick={onLogin}
              />

              <RoleCard
                type="faculty"
                title="Faculty & Leadership"
                subtitle="Access faculty & admin portal"
                onClick={onLogin}
              />

              <RoleCard
                type="register"
                title="New to the portal?"
                subtitle="Create your account"
                onClick={onRegister}
              />
            </div>
          </div>

          <SecurityFooter />
        </section>

        {/* RIGHT PANEL */}
        <section className="relative px-6 py-10 sm:px-12 lg:px-16 flex flex-col justify-center bg-white">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="self-start lg:absolute lg:top-10 lg:left-12 flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors mb-6 lg:mb-0 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </button>

          <div className="w-full max-w-[560px] mx-auto pt-2 lg:pt-8">
            {isAuthForm && (
              <AuthTabs
                activeView={activeView}
                onLogin={onLogin}
                onRegister={onRegister}
              />
            )}

            <div key={activeView} className="auth-enter">
              {children}
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}
