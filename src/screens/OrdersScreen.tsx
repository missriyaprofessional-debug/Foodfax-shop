import React, { useState } from 'react';
import { useOwnerApp } from '../context/OwnerAppContext';
import { OrderStatus } from '../types';
import { 
  Search, 
  CookingPot, 
  CheckCircle2, 
  Receipt, 
  X, 
  XCircle, 
  AlertCircle,
  Clock,
  Printer
} from 'lucide-react';

export const OrdersScreen: React.FC = () => {
  const { orders, updateOrderStatus, setSelectedOrderId } = useOwnerApp();
  const [selectedTab, setSelectedTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cancelModalOrderId, setCancelModalOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('Item out of stock');

  const tabs = [
    { id: 'all', label: 'All Orders' },
    { id: 'pending', label: 'Pending' },
    { id: 'accepted', label: 'Accepted' },
    { id: 'preparing', label: 'Cooking' },
    { id: 'ready', label: 'Ready' },
    { id: 'completed', label: 'Completed' },
    { id: 'cancelled', label: 'Cancelled' },
  ];

  const filteredOrders = orders.filter((order) => {
    if (selectedTab !== 'all' && order.status !== selectedTab) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      order.orderNumber.toLowerCase().includes(q) ||
      order.customerName.toLowerCase().includes(q) ||
      order.customerPhone.includes(q)
    );
  });

  const getStatusCount = (statusId: string) => {
    if (statusId === 'all') return orders.length;
    return orders.filter((o) => o.status === statusId).length;
  };

  const handleConfirmCancel = () => {
    if (cancelModalOrderId) {
      updateOrderStatus(cancelModalOrderId, 'cancelled', cancelReason);
      setCancelModalOrderId(null);
    }
  };

  return (
    <div className="space-y-4 pb-20 p-4 max-w-4xl mx-auto">
      {/* Header and Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight">Kitchen & Live Orders</h2>
          <p className="text-xs text-slate-400">Review, prepare, and advance order status tickets in realtime</p>
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search #order, customer, phone..."
            className="w-full bg-slate-900 border border-slate-800 focus:border-orange-500 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar border-b border-slate-800">
        {tabs.map((tab) => {
          const count = getStatusCount(tab.id);
          const isSelected = selectedTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                isSelected
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-950'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              {count > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : tab.id === 'pending'
                      ? 'bg-amber-500 text-black font-black'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
          <Receipt className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h4 className="text-base font-bold text-slate-300">No {selectedTab} orders</h4>
          <p className="text-xs text-slate-500 mt-1">Orders in this state will appear here automatically</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const statusBadgeMap: Record<OrderStatus, { bg: string; text: string }> = {
              pending: { bg: 'bg-amber-500/20 border-amber-500/40', text: 'text-amber-300' },
              accepted: { bg: 'bg-blue-500/20 border-blue-500/40', text: 'text-blue-300' },
              preparing: { bg: 'bg-orange-500/20 border-orange-500/40', text: 'text-orange-300' },
              ready: { bg: 'bg-emerald-500/20 border-emerald-500/40', text: 'text-emerald-300' },
              completed: { bg: 'bg-slate-800 border-slate-700', text: 'text-slate-400' },
              cancelled: { bg: 'bg-red-500/20 border-red-500/40', text: 'text-red-400' },
            };

            const badge = statusBadgeMap[order.status] || { bg: 'bg-slate-800', text: 'text-slate-300' };

            return (
              <div
                key={order.id}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition space-y-3"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-white text-base">{order.orderNumber}</span>
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${badge.bg} ${badge.text}`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {order.customerName} • {order.customerPhone}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-base font-black text-white">₹{order.totalAmount}</p>
                    <span className="text-[10px] font-semibold text-slate-400">
                      {order.orderType === 'dine_in' ? `Table ${order.tableNumber || '-'}` : 'Takeaway'} •{' '}
                      {order.paymentMethod.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Items */}
                <div className="bg-slate-950/70 rounded-xl p-3 text-xs space-y-1.5 border border-slate-850">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start">
                      <div>
                        <span className={item.isVeg ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                          {item.isVeg ? '🟢 ' : '🔴 '}
                        </span>
                        <span className="font-semibold text-slate-200">
                          {item.quantity}x {item.name}
                        </span>
                        {item.notes && (
                          <p className="text-[11px] text-amber-400 italic pl-5">Note: &quot;{item.notes}&quot;</p>
                        )}
                      </div>
                      <span className="text-slate-400 font-medium">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>

                {order.cancellationReason && (
                  <p className="text-xs text-red-400 bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                    Cancelled: {order.cancellationReason}
                  </p>
                )}

                {/* Footer Controls */}
                <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedOrderId(order.id)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
                    >
                      View Ticket Details
                    </button>
                    {order.status !== 'completed' && order.status !== 'cancelled' && (
                      <button
                        onClick={() => setCancelModalOrderId(order.id)}
                        className="px-2.5 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-medium transition"
                      >
                        Reject
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {order.status === 'pending' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'accepted')}
                        className="px-4 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-md shadow-orange-950 transition"
                      >
                        Accept Order
                      </button>
                    )}
                    {order.status === 'accepted' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'preparing')}
                        className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-950 transition"
                      >
                        <CookingPot className="w-3.5 h-3.5" />
                        <span>Send to Kitchen</span>
                      </button>
                    )}
                    {order.status === 'preparing' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'ready')}
                        className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950 transition"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Ready for Pickup</span>
                      </button>
                    )}
                    {order.status === 'ready' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'completed')}
                        className="px-4 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-md shadow-teal-950 transition"
                      >
                        Mark Handed Over
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancel Order Dialog Modal */}
      {cancelModalOrderId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-red-400 font-extrabold text-base">
              <XCircle className="w-5 h-5" />
              <span>Reject / Cancel Order</span>
            </div>
            <p className="text-xs text-slate-300">
              Please specify the cancellation reason to notify the customer automatically:
            </p>

            <div className="space-y-2">
              {[
                'Item out of stock',
                'Kitchen overload / peak rush',
                'Store closing early',
                'Customer requested cancel',
                'Special instruction cannot be met',
              ].map((reason) => (
                <label
                  key={reason}
                  className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-800 cursor-pointer text-xs text-slate-200"
                >
                  <input
                    type="radio"
                    name="reason"
                    checked={cancelReason === reason}
                    onChange={() => setCancelReason(reason)}
                    className="accent-orange-500"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setCancelModalOrderId(null)}
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
              >
                Keep Order
              </button>
              <button
                onClick={handleConfirmCancel}
                className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white shadow-md shadow-red-950"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
