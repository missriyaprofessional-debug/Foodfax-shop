import React from 'react';
import { useOwnerApp } from '../context/OwnerAppContext';
import { soundService } from '../services/soundService';
import { X, Volume2, Flame, Sliders, CheckSquare, Square } from 'lucide-react';

interface ShopSettingsModalProps {
  onClose: () => void;
}

export const ShopSettingsModal: React.FC<ShopSettingsModalProps> = ({ onClose }) => {
  const { shop, saveShop, toggleRushMode, toggleShopOpen, isSoundEnabled, toggleSound } = useOwnerApp();

  if (!shop) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-orange-400" />
            <h3 className="text-base font-black text-white">Operations & Kitchen Settings</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Store Switch */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-white">Accepting Orders</p>
            <p className="text-[11px] text-slate-400">
              {shop.isOpen ? 'Store is live on customer ordering page' : 'Store is paused / closed'}
            </p>
          </div>
          <button
            onClick={() => toggleShopOpen(!shop.isOpen)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              shop.isOpen ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
            }`}
          >
            {shop.isOpen ? 'OPEN' : 'CLOSED'}
          </button>
        </div>

        {/* Rush Mode Configuration */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-red-400" />
              <p className="text-xs font-bold text-white">Rush Hour Delay Buffer</p>
            </div>
            <button
              onClick={() => toggleRushMode(!shop.isRushMode, shop.rushExtraMinutes)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                shop.isRushMode ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {shop.isRushMode ? 'ACTIVE' : 'OFF'}
            </button>
          </div>

          <p className="text-[11px] text-slate-400">
            Automatically adds extra prep time across all menu items to manage rush hours gracefully.
          </p>

          <div className="flex gap-2 pt-1">
            {[10, 15, 20, 30].map((mins) => (
              <button
                key={mins}
                onClick={() => toggleRushMode(true, mins)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition ${
                  shop.isRushMode && shop.rushExtraMinutes === mins
                    ? 'bg-red-600 text-white border-red-500'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                +{mins}m
              </button>
            ))}
          </div>
        </div>

        {/* Order Chimes & Sound */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-white">Order Alert Audio Chime</p>
              <p className="text-[11px] text-slate-400">Play pleasant 3-tone chime for incoming orders</p>
            </div>
            <button
              onClick={toggleSound}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                isSoundEnabled ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {isSoundEnabled ? 'SOUND ON' : 'MUTED'}
            </button>
          </div>

          <button
            onClick={() => soundService.playNewOrderChime()}
            className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-850 text-xs font-semibold text-orange-400 border border-slate-800 flex items-center justify-center gap-1.5 transition"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Test Kitchen Order Chime</span>
          </button>
        </div>

        {/* Accepted Fulfilment Modes */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
          <p className="text-xs font-bold text-white mb-2">Accepted Order Types</p>

          <label className="flex items-center justify-between cursor-pointer text-xs text-slate-300">
            <span>Dine-In Table Ordering</span>
            <input
              type="checkbox"
              checked={shop.acceptsDineIn}
              onChange={(e) => saveShop({ acceptsDineIn: e.target.checked })}
              className="accent-orange-500 w-4 h-4"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer text-xs text-slate-300">
            <span>Takeaway Counter Pickup</span>
            <input
              type="checkbox"
              checked={shop.acceptsTakeaway}
              onChange={(e) => saveShop({ acceptsTakeaway: e.target.checked })}
              className="accent-orange-500 w-4 h-4"
            />
          </label>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-lg shadow-orange-950 transition"
        >
          Save & Return
        </button>
      </div>
    </div>
  );
};
