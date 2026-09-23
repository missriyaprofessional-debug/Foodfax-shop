import React, { useState } from 'react';
import { useOwnerApp } from '../context/OwnerAppContext';
import { IndianRupee, TrendingUp, CreditCard, Banknote, Calendar, CheckCircle2 } from 'lucide-react';

export const SalesScreen: React.FC = () => {
  const { orders } = useOwnerApp();
  const [filterDays, setFilterDays] = useState<number>(1);

  const completedOrders = orders.filter((o) => o.status === 'completed');
  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const upiCount = completedOrders.filter((o) => o.paymentMethod === 'upi').length;
  const cashCount = completedOrders.filter((o) => o.paymentMethod === 'cash').length;
  const aov = completedOrders.length > 0 ? Math.round(totalRevenue / completedOrders.length) : 0;

  return (
    <div className="space-y-4 pb-24 p-4 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-black text-white tracking-tight">Sales & Revenue Analytics</h2>
        <p className="text-xs text-slate-400">Direct settlement metrics, payouts, and completed order receipts</p>
      </div>

      {/* Date Filter Tabs */}
      <div className="flex gap-2">
        {[
          { label: 'Today', days: 1 },
          { label: 'Last 7 Days', days: 7 },
          { label: 'This Month', days: 30 },
        ].map((tab) => (
          <button
            key={tab.days}
            onClick={() => setFilterDays(tab.days)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              filterDays === tab.days
                ? 'bg-orange-600 text-white shadow-md shadow-orange-950'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Hero Revenue Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-tr from-orange-600 to-amber-600 text-white shadow-xl shadow-orange-950/30">
        <p className="text-xs font-bold uppercase tracking-wider text-orange-200">Total Net Revenue</p>
        <h3 className="text-3xl sm:text-4xl font-black mt-1">₹{totalRevenue.toLocaleString()}</h3>

        <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-between text-xs">
          <div>
            <span className="text-orange-200">Paid Orders:</span>{' '}
            <span className="font-black text-white">{completedOrders.length}</span>
          </div>
          <div>
            <span className="text-orange-200">Average Order Value:</span>{' '}
            <span className="font-black text-white">₹{aov}</span>
          </div>
        </div>
      </div>

      {/* Payment Splits */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <span className="text-xs text-slate-400 font-semibold">UPI Direct Payouts</span>
          </div>
          <p className="text-xl font-black text-white">{upiCount} orders</p>
          <p className="text-[11px] text-blue-400 mt-0.5">100% direct bank transfer</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <Banknote className="w-4 h-4" />
            </div>
            <span className="text-xs text-slate-400 font-semibold">Counter Cash</span>
          </div>
          <p className="text-xl font-black text-white">{cashCount} orders</p>
          <p className="text-[11px] text-amber-400 mt-0.5">Direct register collection</p>
        </div>
      </div>

      {/* Settled Transactions */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
          Settled Receipts Log
        </h4>

        {completedOrders.length === 0 ? (
          <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-xs text-slate-500">
            No completed orders for this period
          </div>
        ) : (
          <div className="space-y-2">
            {completedOrders.map((ord) => (
              <div
                key={ord.id}
                className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{ord.orderNumber}</span>
                    <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      {ord.paymentMethod} {ord.paymentStatus}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    {ord.customerName} • {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-extrabold text-white">₹{ord.totalAmount}</span>
                  <p className="text-[10px] text-slate-500">{ord.items.length} items</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
