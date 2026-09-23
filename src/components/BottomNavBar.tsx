import React from 'react';
import { useOwnerApp } from '../context/OwnerAppContext';
import { ActiveScreen } from '../types';
import { LayoutDashboard, ReceiptText, UtensilsCrossed, QrCode, User } from 'lucide-react';

export const BottomNavBar: React.FC = () => {
  const { activeScreen, setActiveScreen, orders } = useOwnerApp();

  const activeOrdersCount = orders.filter((o) => ['pending', 'accepted', 'preparing', 'ready'].includes(o.status)).length;
  const pendingCount = orders.filter((o) => o.status === 'pending').length;

  const navItems: { screen: ActiveScreen; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      screen: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      screen: 'orders',
      label: 'Orders',
      icon: <ReceiptText className="w-5 h-5" />,
      badge: pendingCount > 0 ? pendingCount : activeOrdersCount > 0 ? activeOrdersCount : undefined,
    },
    {
      screen: 'menu',
      label: 'Menu',
      icon: <UtensilsCrossed className="w-5 h-5" />,
    },
    {
      screen: 'shop_qr',
      label: 'Shop QR',
      icon: <QrCode className="w-5 h-5" />,
    },
    {
      screen: 'profile',
      label: 'Profile',
      icon: <User className="w-5 h-5" />,
    },
  ];

  return (
    <nav className="bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-2 py-1.5 sticky bottom-0 z-30 shadow-lg">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = activeScreen === item.screen;
          return (
            <button
              key={item.screen}
              onClick={() => setActiveScreen(item.screen)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all relative ${
                isActive ? 'text-orange-500 font-bold' : 'text-slate-400 hover:text-slate-200 font-medium'
              }`}
            >
              <div className="relative">
                {item.icon}
                {Boolean(item.badge && item.badge > 0) && (
                  <span
                    className={`absolute -top-1.5 -right-2 min-w-4 h-4 px-1 rounded-full text-[10px] font-black flex items-center justify-center ${
                      pendingCount > 0 && item.screen === 'orders'
                        ? 'bg-amber-500 text-black animate-pulse'
                        : 'bg-orange-600 text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-1">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
