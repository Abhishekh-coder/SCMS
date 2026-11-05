import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";

import AuthShell from "./components/AuthShell";
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import VerifyEmailForm from "./components/VerifyEmailForm";

const AUTH_VIEW = {
  LOGIN: "LOGIN",
  REGISTER: "REGISTER",
  VERIFY: "VERIFY",
  ACTIVATED: "ACTIVATED",
  READY_TO_LOGIN: "READY_TO_LOGIN",
  ERROR: "ERROR",
};

export default function AuthPage() {
  const [params] = useSearchParams();

  const [view, setView] = useState(
    params.get("tab") === "activate" || params.get("tab") === "verify"
      ? AUTH_VIEW.VERIFY
      : params.get("tab") === "register"
      ? AUTH_VIEW.REGISTER
      : AUTH_VIEW.LOGIN
  );

  const [verificationEmail, setVerificationEmail] = useState(
    params.get("email") || ""
  );
  const [devOtpCode, setDevOtpCode] = useState("");

  const handleRegistrationSuccess = (data) => {
    setVerificationEmail(data.email);
    if (data.devOtpCode) {
      setDevOtpCode(data.devOtpCode);
    }
    setView(AUTH_VIEW.VERIFY);
  };

  const handlePendingVerification = (email) => {
    setVerificationEmail(email);
    setView(AUTH_VIEW.VERIFY);
  };

  const handleVerificationSuccess = () => {
    setView(AUTH_VIEW.READY_TO_LOGIN);
  };

  const renderView = () => {
    switch (view) {
      case AUTH_VIEW.REGISTER:
        return (
          <RegisterForm
            onSuccess={handleRegistrationSuccess}
            onLogin={() => setView(AUTH_VIEW.LOGIN)}
          />
        );

      case AUTH_VIEW.VERIFY:
        return (
          <VerifyEmailForm
            email={verificationEmail}
            initialDevOtpCode={devOtpCode}
            onVerified={handleVerificationSuccess}
            onBackToLogin={() => setView(AUTH_VIEW.LOGIN)}
          />
        );

      case AUTH_VIEW.READY_TO_LOGIN:
        return (
          <LoginForm
            successMessage="Email verified. Sign in to continue."
            onPendingVerification={handlePendingVerification}
            onRegister={() => setView(AUTH_VIEW.REGISTER)}
          />
        );

      case AUTH_VIEW.LOGIN:
      default:
        return (
          <LoginForm
            onRegister={() => setView(AUTH_VIEW.REGISTER)}
            onPendingVerification={handlePendingVerification}
          />
        );
    }
  };

  return (
    <AuthShell
      activeView={view}
      onLogin={() => setView(AUTH_VIEW.LOGIN)}
      onRegister={() => setView(AUTH_VIEW.REGISTER)}
    >
      {renderView()}
    </AuthShell>
  );
}
