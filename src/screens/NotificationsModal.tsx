import React from 'react';
import { useOwnerApp } from '../context/OwnerAppContext';
import { soundService } from '../services/soundService';
import { X, Bell, Volume2, Receipt } from 'lucide-react';

interface NotificationsModalProps {
  onClose: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ onClose }) => {
  const { orders, setSelectedOrderId } = useOwnerApp();

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-orange-400" />
            <h3 className="text-base font-black text-white">Live Store Notifications</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chime Test Action */}
        <div className="p-3 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-orange-200">
            <Volume2 className="w-4 h-4 text-orange-400" />
            <span>Audio Chimes are active on new orders</span>
          </div>
          <button
            onClick={() => soundService.playNewOrderChime()}
            className="px-2.5 py-1 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow transition"
          >
            Play Chime
          </button>
        </div>

        {/* List of order alerts */}
        <div className="space-y-2">
          {orders.map((o) => (
            <div
              key={o.id}
              onClick={() => {
                setSelectedOrderId(o.id);
                onClose();
              }}
              className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 cursor-pointer transition flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-800 text-orange-400 flex items-center justify-center">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-white">
                    {o.orderNumber} - {o.customerName}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {o.orderType.toUpperCase()} • ₹{o.totalAmount}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded">
                {o.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
