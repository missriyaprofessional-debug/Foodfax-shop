import React from 'react';
import { useOwnerApp } from '../context/OwnerAppContext';
import { 
  Store, 
  Volume2, 
  VolumeX, 
  Bell, 
  Flame, 
  SlidersHorizontal 
} from 'lucide-react';

interface TopAppBarProps {
  onOpenSettings: () => void;
  onOpenNotifications: () => void;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  onOpenSettings,
  onOpenNotifications,
}) => {
  const { shop, toggleShopOpen, isSoundEnabled, toggleSound, orders } = useOwnerApp();

  const pendingCount = orders.filter((o) => o.status === 'pending').length;

  if (!shop) return null;

  return (
    <header className="bg-slate-900 border-b border-slate-800 px-3 py-2.5 sm:px-4 sm:py-3 sticky top-0 z-30 shadow-md">
      <div className="flex items-center justify-between gap-2 max-w-6xl mx-auto">
        {/* Shop Name & Status */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-orange-600 flex items-center justify-center shrink-0 shadow-sm shadow-orange-950">
            <Store className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-sm sm:text-base text-slate-100 truncate tracking-tight">
                {shop.name}
              </h1>
              {shop.isRushMode && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded">
                  <Flame className="w-3 h-3 text-red-400" />
                  Rush +{shop.rushExtraMinutes}m
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 truncate">{shop.shopType || 'Restaurant Partner'}</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Shop Open / Closed Live Switch */}
          <button
            onClick={() => toggleShopOpen(!shop.isOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
              shop.isOpen
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25'
                : 'bg-red-500/15 border-red-500/40 text-red-400 hover:bg-red-500/25'
            }`}
            title="Toggle store open/closed"
          >
            <span
              className={`w-2 h-2 rounded-full ${shop.isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}
            />
            <span>{shop.isOpen ? 'STORE OPEN' : 'STORE CLOSED'}</span>
          </button>

          {/* Audio Chime Mute/Unmute */}
          <button
            onClick={toggleSound}
            className={`p-2 rounded-xl border transition ${
              isSoundEnabled
                ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                : 'bg-red-500/10 text-red-400 border-red-500/30'
            }`}
            title={isSoundEnabled ? 'Kitchen order chime is enabled' : 'Kitchen order chime is muted'}
          >
            {isSoundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Notifications Bell */}
          <button
            onClick={onOpenNotifications}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 relative transition"
            title="Order Notifications"
          >
            <Bell className="w-4 h-4" />
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-black text-[10px] font-black flex items-center justify-center animate-bounce">
                {pendingCount}
              </span>
            )}
          </button>

          {/* Shop Operations Settings */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition"
            title="Operations Settings"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
