import React, { useEffect } from 'react';
import { useOwnerApp } from '../context/OwnerAppContext';
import { Store, Loader2 } from 'lucide-react';

export const SplashScreen: React.FC = () => {
  const { isAuthenticated, hasCompletedShopSetup, isLoading, setActiveScreen } = useOwnerApp();

  useEffect(() => {
    // Strictly wait until Supabase session check is complete (isLoading === false)
    if (isLoading) {
      console.log('[SplashScreen] ⏳ Waiting for Supabase auth session check to complete before routing...');
      return;
    }

    console.log('[SplashScreen] 🚀 Session check completed. Deciding navigation target:', {
      isAuthenticated,
      hasCompletedShopSetup,
    });

    if (isAuthenticated) {
      if (hasCompletedShopSetup) {
        setActiveScreen('dashboard');
      } else {
        setActiveScreen('shop_setup');
      }
    } else {
      const hasOnboarded = localStorage.getItem('foodfax_has_onboarded');
      if (hasOnboarded === 'true') {
        setActiveScreen('login');
      } else {
        setActiveScreen('onboarding');
      }
    }
  }, [isLoading, isAuthenticated, hasCompletedShopSetup, setActiveScreen]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center shadow-2xl shadow-orange-600/30 mb-6 animate-pulse">
        <Store className="w-12 h-12 text-white" />
      </div>
      <h1 className="text-3xl font-black text-white tracking-tight">FoodFax</h1>
      <span className="mt-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 font-extrabold text-xs tracking-wider border border-orange-500/30">
        PARTNER & OWNER APP
      </span>
      <p className="text-slate-400 text-xs mt-3 max-w-xs">
        Connecting local restaurants with instant digital ordering & zero-wait counter pickups
      </p>
      <div className="mt-12 flex items-center gap-2 text-slate-500 text-xs">
        <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
        <span>Initializing Supabase Auth & Realtime...</span>
      </div>
    </div>
  );
};
