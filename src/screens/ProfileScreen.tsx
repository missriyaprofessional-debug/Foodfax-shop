import React, { useState } from 'react';
import { useOwnerApp } from '../context/OwnerAppContext';
import { 
  Store, 
  SlidersHorizontal, 
  QrCode, 
  TrendingUp, 
  Bell, 
  LogOut, 
  ChevronRight,
  ShieldCheck,
  Phone
} from 'lucide-react';

interface ProfileScreenProps {
  onOpenSettings: () => void;
  onOpenNotifications: () => void;
  onOpenShopProfile: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onOpenSettings,
  onOpenNotifications,
  onOpenShopProfile,
}) => {
  const { ownerProfile, shop, logout, setActiveScreen } = useOwnerApp();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  return (
    <div className="space-y-4 pb-24 p-4 max-w-xl mx-auto">
      {/* Profile Header */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-orange-950 shrink-0">
          {ownerProfile?.fullName ? ownerProfile.fullName[0].toUpperCase() : 'O'}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="text-base font-extrabold text-white truncate">
              {ownerProfile?.fullName || 'Restaurant Owner'}
            </h3>
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 truncate mt-0.5">
            <Phone className="w-3 h-3 text-slate-500 shrink-0" />
            <span>{ownerProfile?.phone || 'Registered Partner'}</span>
          </div>
          <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-500/15 border border-orange-500/30 text-[10px] font-bold text-orange-400">
            <Store className="w-3 h-3" />
            <span className="truncate">{shop?.name || 'Verified Partner'}</span>
          </div>
        </div>
      </div>

      {/* Settings Navigation List */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden divide-y divide-slate-800/80">
        <button
          onClick={onOpenShopProfile}
          className="w-full p-4 flex items-center justify-between hover:bg-slate-850 transition text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500/15 text-orange-400 flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Restaurant Profile & Address</p>
              <p className="text-[11px] text-slate-400">Timings, description, address & UPI payout ID</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>

        <button
          onClick={onOpenSettings}
          className="w-full p-4 flex items-center justify-between hover:bg-slate-850 transition text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Operations & Rush Settings</p>
              <p className="text-[11px] text-slate-400">Rush buffer, order fulfilment modes, chime volume</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>

        <button
          onClick={() => setActiveScreen('shop_qr')}
          className="w-full p-4 flex items-center justify-between hover:bg-slate-850 transition text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Store QR Standee</p>
              <p className="text-[11px] text-slate-400">Print table standees for direct ordering</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>

        <button
          onClick={() => setActiveScreen('sales')}
          className="w-full p-4 flex items-center justify-between hover:bg-slate-850 transition text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Sales & Financial History</p>
              <p className="text-[11px] text-slate-400">Settlements, order history, and payment types</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>

        <button
          onClick={onOpenNotifications}
          className="w-full p-4 flex items-center justify-between hover:bg-slate-850 transition text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Order Alerts & Sound Test</p>
              <p className="text-[11px] text-slate-400">Manage audio chimes and incoming alerts</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      {/* Logout */}
      <button
        onClick={() => setShowLogoutConfirm(true)}
        className="w-full p-4 rounded-2xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold flex items-center justify-center gap-2 transition"
      >
        <LogOut className="w-4 h-4" />
        <span>Log Out from FoodFax Owner App</span>
      </button>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h4 className="text-base font-bold text-white">Log Out?</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Are you sure you want to end this restaurant session? You will need to sign in again with your phone number to access the owner dashboard.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  logout();
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white shadow-md shadow-red-950"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
