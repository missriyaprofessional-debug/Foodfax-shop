import React, { useState } from 'react';
import { useOwnerApp } from '../context/OwnerAppContext';
import { Store, User, Phone, Lock, Eye, EyeOff, Loader2, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { registerSchema } from '../utils/validationSchemas';

export const RegisterScreen: React.FC = () => {
  const { registerWithPhone, isLoading, errorMessage, setActiveScreen } = useOwnerApp();

  const [fullName, setFullName] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const fullPhone = `${countryCode}${phoneNumber.trim()}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setGeneralError(null);

    // Strict Zod Schema Validation
    const validationResult = registerSchema.safeParse({
      fullName: fullName.trim(),
      phone: fullPhone,
      password,
      confirmPassword,
    });

    if (!validationResult.success) {
      const errors: Record<string, string> = {};
      validationResult.error.issues.forEach((issue) => {
        const field = issue.path[0]?.toString() || 'general';
        errors[field] = issue.message;
      });
      setFieldErrors(errors);
      if (errors['general']) {
        setGeneralError(errors['general']);
      }
      return;
    }

    await registerWithPhone({
      phone: fullPhone,
      password,
      fullName: fullName.trim(),
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center px-5 py-8 max-w-md mx-auto">
      {/* Back Button */}
      <button
        onClick={() => setActiveScreen('login')}
        className="self-start mb-4 p-2 -ml-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition flex items-center gap-1.5 text-xs font-semibold"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Login</span>
      </button>

      {/* Brand Header */}
      <div className="mb-6">
        <div className="w-12 h-12 rounded-2xl bg-orange-600 flex items-center justify-center mb-3 shadow-lg shadow-orange-600/30">
          <Store className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-2xl font-black text-white tracking-tight">Register Restaurant</h2>
        <p className="text-slate-400 text-xs mt-1">
          Create an owner account using your verified mobile number to list your restaurant and manage live orders
        </p>
      </div>

      {/* General Error Banner */}
      {(errorMessage || generalError) && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage || generalError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Full Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Owner Full Name
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (fieldErrors['fullName']) {
                  setFieldErrors((prev) => ({ ...prev, fullName: '' }));
                }
              }}
              placeholder="e.g. Vikram Malhotra"
              className={`w-full bg-slate-900 border ${
                fieldErrors['fullName'] ? 'border-red-500 focus:border-red-500' : 'border-slate-800 focus:border-orange-500'
              } rounded-xl pl-10 pr-4 py-3 text-sm text-slate-100 placeholder-slate-600 outline-none transition`}
              required
            />
          </div>
          {fieldErrors['fullName'] && (
            <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1 font-medium">
              <AlertCircle className="w-3 h-3" />
              {fieldErrors['fullName']}
            </p>
          )}
        </div>

        {/* Mobile Number */}
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
                  if (fieldErrors['phone']) {
                    setFieldErrors((prev) => ({ ...prev, phone: '' }));
                  }
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
          {fieldErrors['phone'] ? (
            <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1 font-medium">
              <AlertCircle className="w-3 h-3" />
              {fieldErrors['phone']}
            </p>
          ) : (
            <p className="text-[10px] text-slate-500 mt-1">Must be a valid 10-digit Indian mobile number</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Security Password / PIN
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors['password']) {
                  setFieldErrors((prev) => ({ ...prev, password: '' }));
                }
              }}
              placeholder="Min. 6 characters"
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

        {/* Confirm Password */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Confirm Password / PIN
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (fieldErrors['confirmPassword']) {
                  setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
                }
              }}
              placeholder="Re-enter password"
              className={`w-full bg-slate-900 border ${
                fieldErrors['confirmPassword'] ? 'border-red-500 focus:border-red-500' : 'border-slate-800 focus:border-orange-500'
              } rounded-xl pl-10 pr-4 py-3 text-sm text-slate-100 placeholder-slate-600 outline-none transition`}
              required
            />
          </div>
          {fieldErrors['confirmPassword'] && (
            <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1 font-medium">
              <AlertCircle className="w-3 h-3" />
              {fieldErrors['confirmPassword']}
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
              <span>Creating Owner Account...</span>
            </>
          ) : (
            <span>Create Account & Setup Shop</span>
          )}
        </button>
      </form>

      {/* Switch to Login */}
      <div className="mt-8 text-center text-xs text-slate-400">
        Already have a shop account?{' '}
        <button
          onClick={() => setActiveScreen('login')}
          className="text-orange-400 font-bold hover:underline"
        >
          Sign In
        </button>
      </div>
    </div>
  );
};
