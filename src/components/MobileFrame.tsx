import React from 'react';
import { Wifi, Battery, Signal } from 'lucide-react';

interface MobileFrameProps {
  children: React.ReactNode;
  isMobileFrame: boolean;
}

export const MobileFrame: React.FC<MobileFrameProps> = ({ children, isMobileFrame }) => {
  if (!isMobileFrame) {
    return <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">{children}</div>;
  }

  const now = new Date();
  const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-2 sm:p-6 lg:p-10">
      {/* Smartphone Chassis */}
      <div className="relative w-full max-w-[440px] h-[92vh] max-h-[920px] bg-slate-900 border-[8px] sm:border-[12px] border-slate-800 rounded-[44px] shadow-2xl overflow-hidden flex flex-col ring-1 ring-slate-700/50">
        {/* Device Status Bar */}
        <div className="bg-slate-900/90 backdrop-blur-sm px-6 pt-2 pb-1 flex items-center justify-between text-[11px] font-bold text-slate-300 select-none shrink-0 z-40">
          <span>{timeString}</span>

          {/* Speaker / Camera Notch */}
          <div className="w-24 h-4 bg-slate-950 rounded-full flex items-center justify-center gap-1.5 shadow-inner">
            <div className="w-2 h-2 rounded-full bg-slate-800" />
            <div className="w-8 h-1.5 rounded-full bg-slate-900" />
          </div>

          <div className="flex items-center gap-1.5 text-slate-400">
            <Signal className="w-3 h-3 text-slate-300" />
            <Wifi className="w-3 h-3 text-slate-300" />
            <Battery className="w-3.5 h-3.5 text-slate-300" />
          </div>
        </div>

        {/* Screen Content Container */}
        <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col relative bg-slate-950">
          {children}
        </div>

        {/* Home Bar Indicator */}
        <div className="bg-slate-900/90 py-1.5 flex justify-center shrink-0 z-40">
          <div className="w-28 h-1 bg-slate-600 rounded-full" />
        </div>
      </div>
    </div>
  );
};
