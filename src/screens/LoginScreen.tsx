import React, { useState } from 'react';
import { useOwnerApp } from '../context/OwnerAppContext';
import { Store, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { login, isLoading, errorMessage, setActiveScreen } = useOwnerApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!email.trim()) {
      setValidationError('Please enter your owner email');
      return;
    }
    if (!password) {
      setValidationError('Please enter your password');
      return;
    }

    await login(email.trim(), password);
  };

  const handleQuickDemoLogin = () => {
    setEmail('partner@spicegarden.com');
    setPassword('restaurant123');
    login('partner@spicegarden.com', 'restaurant123');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center px-6 py-12 max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-orange-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-600/30">
          <Store className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-black text-white tracking-tight">Partner Login</h2>
        <p className="text-slate-400 text-xs mt-1">Sign in to manage your FoodFax restaurant & orders</p>
      </div>

      {/* Error Banner */}
      {(errorMessage || validationError) && (
        <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage || validationError}</span>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Owner Email Address</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="partner@restaurant.com"
              className="w-full bg-slate-900 border border-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-100 placeholder-slate-600 outline-none transition"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-900 border border-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl pl-10 pr-10 py-3 text-sm text-slate-100 placeholder-slate-600 outline-none transition"
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
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-2 py-3.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-600/30 transition disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Verifying credentials...</span>
            </>
          ) : (
            <span>Sign In to Dashboard</span>
          )}
        </button>
      </form>

      {/* Quick Demo Login button */}
      <div className="mt-5 p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
        <p className="text-[11px] text-slate-400 mb-2">Want to test right away without entering credentials?</p>
        <button
          onClick={handleQuickDemoLogin}
          type="button"
          className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-orange-400 text-xs font-semibold border border-slate-700 transition"
        >
          ⚡ Quick Demo Login (Spice Garden Bistro)
        </button>
      </div>

      {/* Switch to Register */}
      <div className="mt-8 text-center text-xs text-slate-400">
        Don&apos;t have an owner account?{' '}
        <button
          onClick={() => setActiveScreen('register')}
          className="text-orange-400 font-bold hover:underline"
        >
          Register Restaurant
        </button>
      </div>
    </div>
  );
};
