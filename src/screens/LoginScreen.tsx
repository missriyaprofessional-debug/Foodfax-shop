import React, { useState } from 'react';
import { useOwnerApp } from '../context/OwnerAppContext';
import { 
  Store, 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2, 
  AlertCircle, 
  KeyRound, 
  ArrowLeft,
  CheckCircle2,
  ShieldAlert
} from 'lucide-react';
import { 
  loginPasswordSchema, 
  loginOtpSchema, 
  phoneSchema,
  forgotPasswordRequestSchema,
  forgotPasswordResetSchema 
} from '../utils/validationSchemas';

export const LoginScreen: React.FC = () => {
  const { 
    loginWithPhone, 
    sendPhoneOtp, 
    verifyPhoneOtp, 
    isLoading, 
    errorMessage, 
    setActiveScreen, 
    generatedOtp,
    requestPasswordReset,
    resetPasswordWithOtp,
    resetOtpCode
  } = useOwnerApp();

  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authMode, setAuthMode] = useState<'password' | 'otp'>('password');
  const [otpSent, setOtpSent] = useState(false);

  // Field-level error state
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  // Forgot Password Flow State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState<'phone' | 'reset'>('phone');
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState<string | null>(null);
  const [forgotFieldErrors, setForgotFieldErrors] = useState<Record<string, string>>({});
  const [localResetOtp, setLocalResetOtp] = useState<string | null>(null);

  const fullPhone = `${countryCode}${phoneNumber.trim()}`;

  // Handle Login via Password / PIN
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setFormError(null);

    // Zod Schema Validation
    const result = loginPasswordSchema.safeParse({
      phone: fullPhone,
      password,
    });

    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0]?.toString() || 'form';
        errors[field] = issue.message;
      });
      setFieldErrors(errors);
      if (errors['form']) setFormError(errors['form']);
      return;
    }

    await loginWithPhone(fullPhone, password);
  };

  // Handle Sending SMS OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setFormError(null);

    // Zod Phone Validation
    const result = phoneSchema.safeParse(fullPhone);
    if (!result.success) {
      setFieldErrors({ phone: result.error.issues[0]?.message || 'Invalid mobile number' });
      return;
    }

    const success = await sendPhoneOtp(fullPhone);
    if (success) {
      setOtpSent(true);
    }
  };

  // Handle Verifying SMS OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setFormError(null);

    // Zod OTP Validation
    const result = loginOtpSchema.safeParse({
      phone: fullPhone,
      otp: otp.trim(),
    });

    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0]?.toString() || 'form';
        errors[field] = issue.message;
      });
      setFieldErrors(errors);
      return;
    }

    await verifyPhoneOtp(fullPhone, otp.trim());
  };

  // Forgot Password: Request OTP
  const handleForgotRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotFieldErrors({});
    setFormError(null);

    const targetPhone = `${countryCode}${forgotPhone.trim()}`;
    const result = forgotPasswordRequestSchema.safeParse({ phone: targetPhone });

    if (!result.success) {
      setForgotFieldErrors({ phone: result.error.issues[0]?.message || 'Invalid mobile number' });
      return;
    }

    const res = await requestPasswordReset(targetPhone);
    if (res.success) {
      setLocalResetOtp(res.otp || null);
      setForgotStep('reset');
      setForgotSuccessMsg(`Verification code sent to ${targetPhone}`);
    } else {
      setFormError(res.message);
    }
  };

  // Forgot Password: Reset with OTP & New Password
  const handleForgotReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotFieldErrors({});
    setFormError(null);

    const targetPhone = `${countryCode}${forgotPhone.trim()}`;
    const result = forgotPasswordResetSchema.safeParse({
      phone: targetPhone,
      otp: forgotOtp.trim(),
      newPassword,
      confirmPassword: confirmNewPassword,
    });

    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0]?.toString() || 'form';
        errors[field] = issue.message;
      });
      setForgotFieldErrors(errors);
      return;
    }

    const ok = await resetPasswordWithOtp(targetPhone, forgotOtp.trim(), newPassword);
    if (ok) {
      setForgotSuccessMsg('Password reset successfully! You can now log in.');
      setTimeout(() => {
        setShowForgotModal(false);
        setForgotStep('phone');
        setForgotPhone('');
        setForgotOtp('');
        setNewPassword('');
        setConfirmNewPassword('');
        setPhoneNumber(forgotPhone);
        setPassword(newPassword);
      }, 1500);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center px-5 py-8 max-w-md mx-auto relative">
      {/* Brand Header */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-2xl bg-orange-600 flex items-center justify-center mx-auto mb-3.5 shadow-lg shadow-orange-600/30">
          <Store className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-black text-white tracking-tight">FoodFax Partner Login</h2>
        <p className="text-slate-400 text-xs mt-1">
          Sign in with your registered mobile number to manage your restaurant & live orders
        </p>
      </div>

      {/* Mode Switch Tabs: Password vs OTP */}
      <div className="grid grid-cols-2 p-1 bg-slate-900 border border-slate-800 rounded-xl mb-5">
        <button
          type="button"
          onClick={() => {
            setAuthMode('password');
            setFieldErrors({});
            setFormError(null);
          }}
          className={`py-2 text-xs font-bold rounded-lg transition ${
            authMode === 'password'
              ? 'bg-orange-600 text-white shadow-md shadow-orange-950'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Password / PIN
        </button>
        <button
          type="button"
          onClick={() => {
            setAuthMode('otp');
            setFieldErrors({});
            setFormError(null);
          }}
          className={`py-2 text-xs font-bold rounded-lg transition ${
            authMode === 'otp'
              ? 'bg-orange-600 text-white shadow-md shadow-orange-950'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Instant SMS OTP
        </button>
      </div>

      {/* General Error Banner */}
      {(errorMessage || formError) && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage || formError}</span>
        </div>
      )}

      {/* Password Mode Form */}
      {authMode === 'password' && (
        <form onSubmit={handlePasswordLogin} className="space-y-4" noValidate>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Owner Mobile Number
            </label>
            <div className="flex gap-2">
              <div className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-3 flex items-center gap-1.5 text-xs font-bold text-slate-200 shrink-0">
                <span>🇮🇳</span>
                <span>{countryCode}</span>
              </div>
              <div className="relative flex-1">
                <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => {
                    setPhoneNumber(e.target.value);
                    if (fieldErrors['phone']) setFieldErrors((prev) => ({ ...prev, phone: '' }));
                  }}
                  maxLength={10}
                  placeholder="98450 12345"
                  className={`w-full bg-slate-900 border ${
                    fieldErrors['phone'] ? 'border-red-500 focus:border-red-500' : 'border-slate-800 focus:border-orange-500'
                  } rounded-xl pl-10 pr-4 py-3 text-sm text-slate-100 placeholder-slate-600 outline-none transition tracking-wide font-medium`}
                  required
                />
              </div>
            </div>
            {fieldErrors['phone'] && (
              <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3 h-3" />
                {fieldErrors['phone']}
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Security Password / PIN
              </label>
              <button
                type="button"
                onClick={() => {
                  setForgotPhone(phoneNumber);
                  setShowForgotModal(true);
                  setForgotStep('phone');
                  setForgotFieldErrors({});
                  setForgotSuccessMsg(null);
                }}
                className="text-[11px] text-orange-400 hover:underline font-semibold"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors['password']) setFieldErrors((prev) => ({ ...prev, password: '' }));
                }}
                placeholder="••••••••"
                className={`w-full bg-slate-900 border ${
                  fieldErrors['password'] ? 'border-red-500 focus:border-red-500' : 'border-slate-800 focus:border-orange-500'
                } rounded-xl pl-10 pr-10 py-3 text-sm text-slate-100 placeholder-slate-600 outline-none transition`}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {fieldErrors['password'] && (
              <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3 h-3" />
                {fieldErrors['password']}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-600/30 transition disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing in to dashboard...</span>
              </>
            ) : (
              <span>Sign In with Mobile</span>
            )}
          </button>
        </form>
      )}

      {/* OTP Mode Form */}
      {authMode === 'otp' && (
        <div className="space-y-4">
          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-4" noValidate>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Owner Mobile Number
                </label>
                <div className="flex gap-2">
                  <div className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-3 flex items-center gap-1.5 text-xs font-bold text-slate-200 shrink-0">
                    <span>🇮🇳</span>
                    <span>{countryCode}</span>
                  </div>
                  <div className="relative flex-1">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => {
                        setPhoneNumber(e.target.value);
                        if (fieldErrors['phone']) setFieldErrors((prev) => ({ ...prev, phone: '' }));
                      }}
                      maxLength={10}
                      placeholder="98450 12345"
                      className={`w-full bg-slate-900 border ${
                        fieldErrors['phone'] ? 'border-red-500 focus:border-red-500' : 'border-slate-800 focus:border-orange-500'
                      } rounded-xl pl-10 pr-4 py-3 text-sm text-slate-100 placeholder-slate-600 outline-none transition tracking-wide font-medium`}
                      required
                    />
                  </div>
                </div>
                {fieldErrors['phone'] && (
                  <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3 h-3" />
                    {fieldErrors['phone']}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-600/30 transition disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending OTP...</span>
                  </>
                ) : (
                  <span>Send SMS OTP Code</span>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4" noValidate>
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs space-y-1">
                <p>
                  Verification code sent to <strong>{fullPhone}</strong>
                </p>
                {generatedOtp && (
                  <p className="text-[11px] text-emerald-400 font-mono font-bold">
                    OTP Code: <span className="underline">{generatedOtp}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Enter 6-Digit SMS Code
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => {
                      setOtp(e.target.value);
                      if (fieldErrors['otp']) setFieldErrors((prev) => ({ ...prev, otp: '' }));
                    }}
                    placeholder="123456"
                    className={`w-full bg-slate-900 border ${
                      fieldErrors['otp'] ? 'border-red-500 focus:border-red-500' : 'border-slate-800 focus:border-orange-500'
                    } rounded-xl pl-10 pr-4 py-3 text-sm text-slate-100 placeholder-slate-600 outline-none transition tracking-widest font-mono text-center font-bold`}
                    maxLength={6}
                    autoFocus
                    required
                  />
                </div>
                {fieldErrors['otp'] && (
                  <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3 h-3" />
                    {fieldErrors['otp']}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-600/30 transition disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying code...</span>
                  </>
                ) : (
                  <span>Verify & Enter Dashboard</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setOtpSent(false)}
                className="w-full text-center text-xs text-orange-400 hover:underline pt-1"
              >
                Change Phone Number or Resend
              </button>
            </form>
          )}
        </div>
      )}

      {/* Switch to Register */}
      <div className="mt-8 text-center text-xs text-slate-400">
        New restaurant partner?{' '}
        <button
          onClick={() => setActiveScreen('register')}
          className="text-orange-400 font-bold hover:underline"
        >
          Register Restaurant
        </button>
      </div>

      {/* FORGOT PASSWORD MODAL */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-orange-400" />
                <h3 className="text-base font-bold text-white">Reset Password</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="text-slate-400 hover:text-white text-xs font-semibold"
              >
                ✕
              </button>
            </div>

            {forgotSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{forgotSuccessMsg}</span>
              </div>
            )}

            {/* Step 1: Enter Registered Phone Number */}
            {forgotStep === 'phone' && (
              <form onSubmit={handleForgotRequest} className="space-y-4" noValidate>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Enter your registered mobile number. We will send a secure verification code to reset your password.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Owner Mobile Number
                  </label>
                  <div className="flex gap-2">
                    <div className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 flex items-center gap-1.5 text-xs font-bold text-slate-200 shrink-0">
                      <span>🇮🇳</span>
                      <span>{countryCode}</span>
                    </div>
                    <div className="relative flex-1">
                      <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        value={forgotPhone}
                        onChange={(e) => {
                          setForgotPhone(e.target.value);
                          if (forgotFieldErrors['phone']) setForgotFieldErrors({});
                        }}
                        maxLength={10}
                        placeholder="98450 12345"
                        className={`w-full bg-slate-950 border ${
                          forgotFieldErrors['phone'] ? 'border-red-500 focus:border-red-500' : 'border-slate-800 focus:border-orange-500'
                        } rounded-xl pl-10 pr-4 py-3 text-sm text-slate-100 placeholder-slate-600 outline-none transition tracking-wide font-medium`}
                        required
                      />
                    </div>
                  </div>
                  {forgotFieldErrors['phone'] && (
                    <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3 h-3" />
                      {forgotFieldErrors['phone']}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-xs font-bold text-white shadow-lg shadow-orange-950 flex items-center justify-center gap-1.5"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Send Code</span>}
                  </button>
                </div>
              </form>
            )}

            {/* Step 2: Enter OTP & New Password */}
            {forgotStep === 'reset' && (
              <form onSubmit={handleForgotReset} className="space-y-3.5" noValidate>
                {localResetOtp && (
                  <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-300 text-xs space-y-0.5">
                    <p className="font-semibold">Reset Code:</p>
                    <p className="font-mono text-sm tracking-widest font-bold">{localResetOtp}</p>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    6-Digit Verification Code
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={forgotOtp}
                      onChange={(e) => {
                        setForgotOtp(e.target.value);
                        if (forgotFieldErrors['otp']) setForgotFieldErrors((prev) => ({ ...prev, otp: '' }));
                      }}
                      placeholder="123456"
                      maxLength={6}
                      className={`w-full bg-slate-950 border ${
                        forgotFieldErrors['otp'] ? 'border-red-500 focus:border-red-500' : 'border-slate-800 focus:border-orange-500'
                      } rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-100 placeholder-slate-600 outline-none transition font-mono tracking-widest text-center font-bold`}
                      required
                    />
                  </div>
                  {forgotFieldErrors['otp'] && (
                    <p className="text-[11px] text-red-400 mt-0.5">{forgotFieldErrors['otp']}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    New Security Password / PIN
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (forgotFieldErrors['newPassword']) setForgotFieldErrors((prev) => ({ ...prev, newPassword: '' }));
                      }}
                      placeholder="Min. 6 characters"
                      className={`w-full bg-slate-950 border ${
                        forgotFieldErrors['newPassword'] ? 'border-red-500 focus:border-red-500' : 'border-slate-800 focus:border-orange-500'
                      } rounded-xl pl-9 pr-9 py-2.5 text-xs text-slate-100 placeholder-slate-600 outline-none transition`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {forgotFieldErrors['newPassword'] && (
                    <p className="text-[11px] text-red-400 mt-0.5">{forgotFieldErrors['newPassword']}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={confirmNewPassword}
                      onChange={(e) => {
                        setConfirmNewPassword(e.target.value);
                        if (forgotFieldErrors['confirmPassword']) setForgotFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
                      }}
                      placeholder="Re-enter new password"
                      className={`w-full bg-slate-950 border ${
                        forgotFieldErrors['confirmPassword'] ? 'border-red-500 focus:border-red-500' : 'border-slate-800 focus:border-orange-500'
                      } rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-100 placeholder-slate-600 outline-none transition`}
                      required
                    />
                  </div>
                  {forgotFieldErrors['confirmPassword'] && (
                    <p className="text-[11px] text-red-400 mt-0.5">{forgotFieldErrors['confirmPassword']}</p>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotStep('phone')}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-xs font-bold text-white shadow-lg shadow-orange-950 flex items-center justify-center gap-1.5"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Update Password</span>}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
