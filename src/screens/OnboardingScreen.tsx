import React, { useState } from 'react';
import { useOwnerApp } from '../context/OwnerAppContext';
import { Store, BellRing, Flame, QrCode, ArrowRight } from 'lucide-react';

export const OnboardingScreen: React.FC = () => {
  const { setActiveScreen } = useOwnerApp();
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      icon: <BellRing className="w-12 h-12 text-orange-500" />,
      title: 'Realtime Live Orders',
      desc: 'Receive incoming orders with crystal-clear audio chimes, customer notes, and 1-tap kitchen ticket prints.',
    },
    {
      icon: <Flame className="w-12 h-12 text-orange-500" />,
      title: 'Rush Mode & Menu Control',
      desc: 'Toggle rush hour delay buffers, manage menu items, prices, and stock availability instantly without restarting.',
    },
    {
      icon: <QrCode className="w-12 h-12 text-orange-500" />,
      title: 'Direct UPI & Counter QR',
      desc: 'Print your store table standee QR code for direct customer ordering with 100% direct bank payouts.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-6 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center">
            <Store className="w-4 h-4 text-white" />
          </div>
          <span className="font-extrabold text-base tracking-tight text-white">FoodFax Partner</span>
        </div>
        <button
          onClick={() => {
            localStorage.setItem('foodfax_has_onboarded', 'true');
            setActiveScreen('login');
          }}
          className="text-xs font-bold text-orange-400 hover:text-orange-300"
        >
          Sign In
        </button>
      </div>

      {/* Slide Carousel */}
      <div className="my-auto py-8">
        <div className="w-24 h-24 rounded-full bg-slate-900 border-2 border-orange-500/30 flex items-center justify-center mx-auto mb-8 shadow-inner shadow-orange-500/10">
          {slides[currentSlide].icon}
        </div>
        <h2 className="text-2xl font-black text-white text-center tracking-tight mb-3">
          {slides[currentSlide].title}
        </h2>
        <p className="text-slate-400 text-sm text-center leading-relaxed max-w-xs mx-auto">
          {slides[currentSlide].desc}
        </p>

        {/* Dots */}
        <div className="flex items-center justify-center gap-2 mt-8">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`h-2 rounded-full transition-all ${
                currentSlide === i ? 'w-6 bg-orange-500' : 'w-2 bg-slate-700'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 pb-4">
        <button
          onClick={() => {
            localStorage.setItem('foodfax_has_onboarded', 'true');
            setActiveScreen('register');
          }}
          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-600/30 transition"
        >
          <span>Register My Restaurant</span>
          <ArrowRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            localStorage.setItem('foodfax_has_onboarded', 'true');
            setActiveScreen('login');
          }}
          className="w-full py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold text-sm transition"
        >
          Sign In to Existing Shop
        </button>
      </div>
    </div>
  );
};
