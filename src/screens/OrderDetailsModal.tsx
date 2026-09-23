import React, { useState } from 'react';
import { useOwnerApp } from '../context/OwnerAppContext';
import { 
  X, 
  Phone, 
  Printer, 
  CookingPot, 
  CheckCircle2, 
  Clock, 
  User, 
  Table, 
  Receipt,
  Check
} from 'lucide-react';

export const OrderDetailsModal: React.FC = () => {
  const { selectedOrderId, setSelectedOrderId, orders, updateOrderStatus } = useOwnerApp();
  const [showKot, setShowKot] = useState(false);

  if (!selectedOrderId) return null;

  const order = orders.find((o) => o.id === selectedOrderId);
  if (!order) return null;

  const stages = [
    { key: 'pending', label: 'Pending' },
    { key: 'accepted', label: 'Accepted' },
    { key: 'preparing', label: 'Cooking' },
    { key: 'ready', label: 'Ready' },
    { key: 'completed', label: 'Completed' },
  ];

  const currentIdx = stages.findIndex((s) => s.key === order.status);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 p-4 sm:p-5 flex items-center justify-between z-10">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-white">{order.orderNumber}</h3>
              <span className="text-xs uppercase font-extrabold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                {order.orderType === 'dine_in' ? `Table ${order.tableNumber || '-'}` : 'Takeaway'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Placed {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowKot(!showKot)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs flex items-center gap-1.5 transition"
              title="Print Thermal Kitchen Ticket (KOT)"
            >
              <Printer className="w-4 h-4 text-orange-400" />
              <span className="hidden xs:inline">Print KOT</span>
            </button>
            <button
              onClick={() => setSelectedOrderId(null)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Thermal KOT View simulator */}
        {showKot ? (
          <div className="p-6 bg-amber-50 text-black font-mono text-xs space-y-3 m-4 rounded-2xl shadow-inner border border-amber-200">
            <div className="text-center border-b border-black pb-2">
              <p className="font-bold text-sm">*** KITCHEN ORDER TICKET (KOT) ***</p>
              <p className="font-extrabold text-base mt-1">{order.orderNumber}</p>
              <p className="text-[11px]">
                {order.orderType.toUpperCase()} | TABLE: {order.tableNumber || 'COUNTER'}
              </p>
              <p className="text-[10px] text-gray-700">
                Time: {new Date(order.createdAt).toLocaleTimeString()}
              </p>
            </div>

            <div className="space-y-1.5 py-1">
              {order.items.map((i, idx) => (
                <div key={idx} className="flex justify-between items-start font-bold">
                  <div>
                    <span>
                      {i.quantity}x {i.name}
                    </span>
                    {i.notes && <p className="text-[10px] text-red-600 pl-4 font-normal">*** {i.notes} ***</p>}
                  </div>
                  <span>₹{i.price * i.quantity}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-black pt-2 flex justify-between font-extrabold text-sm">
              <span>TOTAL ITEMS: {order.items.reduce((a, b) => a + b.quantity, 0)}</span>
              <span>₹{order.totalAmount}</span>
            </div>

            <button
              onClick={() => alert('Sending raw ESC/POS payload to USB/Bluetooth Thermal Receipt Printer...')}
              className="w-full mt-3 py-2 bg-black text-white font-bold rounded-lg hover:bg-neutral-800 text-xs"
            >
              Send to Kitchen Thermal Printer
            </button>
          </div>
        ) : (
          <div className="p-5 space-y-5">
            {/* Status Timeline Stepper */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between">
                {stages.map((stage, idx) => {
                  const isDone = currentIdx >= idx;
                  const isCurrent = currentIdx === idx;
                  return (
                    <div key={stage.key} className="flex flex-col items-center flex-1">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition ${
                          isCurrent
                            ? 'bg-orange-600 text-white ring-4 ring-orange-500/20'
                            : isDone
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {isDone ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                      </div>
                      <span
                        className={`text-[10px] mt-1 uppercase font-bold tracking-wider ${
                          isCurrent ? 'text-orange-400' : isDone ? 'text-emerald-400' : 'text-slate-500'
                        }`}
                      >
                        {stage.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Customer Details */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/15 text-orange-400 flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{order.customerName}</h4>
                  <p className="text-xs text-slate-400">{order.customerPhone}</p>
                </div>
              </div>
              <a
                href={`tel:${order.customerPhone}`}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call</span>
              </a>
            </div>

            {/* Items Breakdown */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Order Items ({order.items.length})
              </h4>
              <div className="bg-slate-950 rounded-2xl p-3 border border-slate-850 space-y-2.5">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start text-xs border-b border-slate-900 pb-2 last:border-0 last:pb-0">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={item.isVeg ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                          {item.isVeg ? '🟢 ' : '🔴 '}
                        </span>
                        <span className="font-bold text-slate-200">
                          {item.quantity}x {item.name}
                        </span>
                      </div>
                      {item.notes && (
                        <p className="text-[11px] text-amber-400 font-medium pl-5 mt-0.5">
                          Instruction: &quot;{item.notes}&quot;
                        </p>
                      )}
                      <p className="text-[11px] text-slate-500 pl-5">₹{item.price} each</p>
                    </div>
                    <span className="font-bold text-slate-200">₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bill Summary */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span>₹{order.subtotal}</span>
              </div>
              {order.tax > 0 && (
                <div className="flex justify-between text-slate-400">
                  <span>Taxes & GST (5%)</span>
                  <span>₹{order.tax}</span>
                </div>
              )}
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Discount</span>
                  <span>-₹{order.discount}</span>
                </div>
              )}
              <div className="border-t border-slate-800 pt-2 flex justify-between font-black text-sm text-white">
                <span>Total Amount Paid</span>
                <span className="text-orange-400">₹{order.totalAmount}</span>
              </div>
            </div>

            {/* Action Advance Bar */}
            <div className="pt-2">
              {order.status === 'pending' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      updateOrderStatus(order.id, 'cancelled', 'Rejected by store');
                      setSelectedOrderId(null);
                    }}
                    className="flex-1 py-3 rounded-xl border border-red-500/40 text-red-400 hover:bg-red-500/10 text-xs font-bold transition"
                  >
                    Reject Order
                  </button>
                  <button
                    onClick={() => updateOrderStatus(order.id, 'accepted')}
                    className="flex-2 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-lg shadow-orange-950 transition"
                  >
                    Accept Order
                  </button>
                </div>
              )}

              {order.status === 'accepted' && (
                <button
                  onClick={() => updateOrderStatus(order.id, 'preparing')}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-950 transition"
                >
                  <CookingPot className="w-4 h-4" />
                  <span>Send to Kitchen (Start Cooking)</span>
                </button>
              )}

              {order.status === 'preparing' && (
                <button
                  onClick={() => updateOrderStatus(order.id, 'ready')}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 transition"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Mark Food Ready for Pickup / Delivery</span>
                </button>
              )}

              {order.status === 'ready' && (
                <button
                  onClick={() => {
                    updateOrderStatus(order.id, 'completed');
                    setSelectedOrderId(null);
                  }}
                  className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-lg shadow-teal-950 transition"
                >
                  Mark Handed Over & Completed
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
