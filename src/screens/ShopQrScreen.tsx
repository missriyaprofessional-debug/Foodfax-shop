import React from 'react';
import { useOwnerApp } from '../context/OwnerAppContext';
import { Store, Printer, Download, Share2, Copy } from 'lucide-react';

export const ShopQrScreen: React.FC = () => {
  const { shop } = useOwnerApp();

  if (!shop) return null;

  const orderUrl = `https://foodfax.app/shop/${shop.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(orderUrl);
    alert('Ordering link copied to clipboard: ' + orderUrl);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-24 p-4 max-w-xl mx-auto text-center">
      <div>
        <h2 className="text-xl font-black text-white tracking-tight">Counter & Table Standee QR</h2>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          Place this branded QR standee on tables or the checkout counter so diners can instantly scan, browse your menu, and place orders.
        </p>
      </div>

      {/* Printable Standee Preview Card */}
      <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl max-w-sm mx-auto border-4 border-orange-500/20">
        {/* Brand Header */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-xl bg-orange-600 flex items-center justify-center text-white font-black shadow-md">
            <Store className="w-5 h-5" />
          </div>
          <span className="text-xl font-black text-slate-900 tracking-tight">FoodFax</span>
        </div>

        {/* Shop Info */}
        <h3 className="text-lg font-black text-slate-900 leading-tight">{shop.name}</h3>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          {shop.area ? `${shop.area}, ` : ''}
          {shop.city || 'Digital Ordering Partner'}
        </p>

        {/* High-Contrast Standee QR Code */}
        <div className="my-5 p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl inline-block shadow-inner">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
              orderUrl
            )}`}
            alt={`${shop.name} QR Code`}
            className="w-48 h-48 mx-auto"
          />
        </div>

        <div className="bg-orange-50 border border-orange-200 text-orange-700 py-1.5 px-3 rounded-full text-xs font-black tracking-wider uppercase inline-block mb-2">
          SCAN TO VIEW MENU & ORDER
        </div>
        <p className="text-[11px] text-slate-500 font-medium">
          Zero app download • Instant UPI payments
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-2.5 max-w-sm mx-auto">
        <button
          onClick={handlePrint}
          className="flex-1 py-3 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-950 transition"
        >
          <Printer className="w-4 h-4" />
          <span>Print Standee (A5/A4)</span>
        </button>

        <button
          onClick={handleCopyLink}
          className="py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold text-xs flex items-center justify-center gap-2 transition"
        >
          <Copy className="w-4 h-4" />
          <span>Copy URL</span>
        </button>
      </div>
    </div>
  );
};
